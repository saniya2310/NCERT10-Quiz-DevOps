# BoardReady (ncert10-quiz) — Enterprise DevOps Architecture & Guide

This document outlines the complete DevOps implementation for the **BoardReady NCERT Class 10 Quiz** platform. It covers containerization, multi-environment lifecycles, CI/CD with GitHub Actions & Jenkins, Infrastructure as Code (Terraform for AWS ECS), Kubernetes (Helm & manifests), Observability (Prometheus + Grafana), and DevSecOps.

---

## 1. High-Level Architecture Diagram

```
                       DEVELOPER WORKFLOW
                 git commit & push to GitHub
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ GitHub Actions CI ]              [ Jenkins CI/CD ]
   • Question Bank Validator          • Declarative Pipeline
   • ESLint & TypeScript Checks       • Multi-stage Build & Test
   • Trivy CVE File Scan              • Trivy Container Scan
   • Gitleaks Secret Detection        • Auto-publish to GHCR
   • Multi-stage Docker Build         • Staging & Prod Helm Deploy
            │
            ▼
   [ GitHub Container Registry (GHCR) ]
   Images tagged: latest, <semver>, sha-<commit>
            │
            ├─────────────────────────────────────────────┐
            ▼                                             ▼
  [ Kubernetes / Helm Cluster ]                 [ AWS ECS Fargate ]
  • Helm Charts (dev, staging, prod)            • Terraform Managed VPC
  • Rolling Update Deployment                   • Application Load Balancer
  • Horizontal Pod Autoscaler (HPA)             • Fargate Task Definition
  • Ingress + TLS (Cert-Manager)                • AutoScaling (Target Tracking)
  • Persistent Volume Claim (PVC)               • CloudWatch Container Logs
            │                                             │
            └──────────────────────┬──────────────────────┘
                                   ▼
                   [ Observability & Monitoring ]
                   • Prometheus (/api/metrics)
                   • Grafana Live Performance Dashboard
                   • Health Probes (/api/health)
```

---

## 2. Multi-Environment Model

The system separates configuration and lifecycle across three standard tiers:

| Environment | Purpose | Infrastructure | URL / Host |
| :--- | :--- | :--- | :--- |
| **Development** (`dev`) | Local iteration & feature testing | Docker Compose (`docker-compose.dev.yml`) or K8s namespace `ncert10-quiz-dev` | `http://localhost:3001` or `dev.boardready.example.com` |
| **Staging** (`staging`) | Pre-production validation, integration tests | K8s namespace `ncert10-quiz-staging` or AWS ECS Staging Cluster | `staging.boardready.example.com` |
| **Production** (`prod`) | Public student traffic, zero-downtime rolling updates, HPA | K8s namespace `ncert10-quiz` or AWS ECS Production Cluster | `boardready.example.com` |

Environment configuration files:
* `.env.development`
* `.env.staging`
* `.env.production`
* `terraform/environments/{dev,staging,prod}.tfvars`
* `helm/ncert10-quiz/values-{dev,staging,prod}.yaml`

---

## 3. Containerization (Docker)

### Multi-Stage Build Architecture (`Dockerfile`)
* **Stage 1 (`deps`)**: Caches dependencies from `package.json` to prevent unnecessary reinstallations when only application code changes.
* **Stage 2 (`builder`)**: Validates the 120-question NCERT JSON banks (`scripts/validate-bank.mjs`) and generates an optimized standalone Next.js production build with telemetry disabled.
* **Stage 3 (`runner`)**: Alpine Linux base (`node:20-alpine`) containing only the minimal runtime files.
  * **Non-root Security**: Creates and runs under unprivileged user `nextjs:nodejs` (`UID 10001`).
  * **Image Footprint**: Reduced from ~1.2 GB to ~110 MB.
  * **Container Healthcheck**: Executes `wget -qO- http://127.0.0.1:3000/api/health` every 30 seconds.

### Quick Docker Commands
```bash
# Build production image
docker build -t ncert10-quiz:latest .

# Run standalone container
docker run -d -p 3000:3000 --name quiz-app ncert10-quiz:latest
```

---

## 4. Docker Compose & Local Monitoring Stack

Three Compose configurations are available:

### 1. Production Mode
Runs the application with volume-backed persistence and health monitoring:
```bash
docker compose up --build -d
```

### 2. Development Mode (Live Hot Reloading)
Mounts source code into the container so edits update instantly:
```bash
docker compose -f docker-compose.dev.yml up
```

### 3. Production + Observability Stack (Prometheus + Grafana)
Spins up the web application, Prometheus scraper, and pre-configured Grafana dashboard:
```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

#### Monitoring Access Endpoints:
* **Web Application:** `http://localhost:3001`
* **Metrics Endpoint:** `http://localhost:3001/api/metrics`
* **Prometheus UI:** `http://localhost:9090`
* **Grafana Dashboard:** `http://localhost:3002` (Login: `admin` / `admin`)
  * Pre-loaded dashboard: **BoardReady - Production Observability** (Uptime, heap memory, score distribution, question count by subject).

---

## 5. Continuous Integration & Delivery (CI/CD)

### A. GitHub Actions Workflows (`.github/workflows/`)

1. **`ci.yml` (Quality Gate)**:
   * Triggers on every push & pull request to `main`/`master`.
   * **Steps:**
     1. NCERT Question Bank schema and integrity validation (`npm run validate:bank`).
     2. ESLint code style and quality check (`npm run lint`).
     3. TypeScript static type verification (`npm run typecheck`).
     4. Next.js production build (`npm run build`).
     5. Secret leak scanning with **Gitleaks**.
     6. File and dependency vulnerability scanning with **Trivy**.
     7. Dry-run Docker container build with GitHub Actions layer cache.

2. **`release-and-publish.yml` (Container Publishing)**:
   * Triggers on commits to `main`/`master` and release tags (`v*.*.*`).
   * Builds multi-platform image with Docker Buildx.
   * Pushes versioned tags (`latest`, `v1.0.0`, `sha-xxxx`) to **GitHub Container Registry (`ghcr.io`)**.
   * Executes post-push image CVE vulnerability scan using Trivy.

3. **`deploy-aws-ecs.yml` (Zero-Downtime AWS ECS Deploy)**:
   * Manual dispatch or automated trigger with environment choice (`dev`, `staging`, `prod`).
   * Uses AWS OIDC role assumption.
   * Renders new image tag in the ECS Task Definition and initiates a zero-downtime rolling update.

### B. Jenkins CI/CD Pipeline (`Jenkinsfile`)

A declarative pipeline for teams self-hosting Jenkins:
* **Stages:**
  1. `Checkout`: SCM pull.
  2. `Install Dependencies`: `npm ci`.
  3. `Validate Question Bank`: `scripts/validate-bank.mjs`.
  4. `Code Quality`: Parallel execution of Linting + TypeScript type checks.
  5. `Production Build`: Compiles Next.js bundle.
  6. `Container Build`: Tags with build number and commit hash.
  7. `Security Vulnerability Scan`: Scans container with Trivy for HIGH and CRITICAL CVEs.
  8. `Push to Container Registry`: Secure credentials injection for GHCR / Docker Hub.
  9. `Deploy to Staging`: Automated Helm upgrade in `ncert10-quiz-staging`.
  10. `Deploy to Production`: Manual approval gate triggered on Git release tags.

---

## 6. Kubernetes & Helm Deployment

### A. Raw Manifests (`k8s/`)
Deployable directly using Kustomize:
```bash
kubectl apply -k k8s/
```
Manifests included:
* `namespace.yaml`: Dedicated `ncert10-quiz` namespace.
* `deployment.yaml`: Rolling update (`maxSurge: 1`, `maxUnavailable: 0`), least privilege securityContext, non-root user, liveness/readiness probes.
* `service.yaml`: Internal `ClusterIP` exposing port 80 → container port 3000.
* `ingress.yaml`: NGINX ingress with TLS certificate auto-provisioning via Cert-Manager.
* `hpa.yaml`: Horizontal Pod Autoscaler scaling from 2 to 10 pods when CPU > 70% or Memory > 80%.
* `pvc.yaml`: Persistent volume claim for server-side leaderboard storage.

### B. Enterprise Helm Chart (`helm/ncert10-quiz/`)
Deploy to any Kubernetes cluster with environment overrides:

```bash
# Lint the chart
helm lint ./helm/ncert10-quiz

# Deploy to Development
helm upgrade --install ncert10-quiz-dev ./helm/ncert10-quiz \
  -n ncert10-quiz-dev --create-namespace \
  -f ./helm/ncert10-quiz/values-dev.yaml

# Deploy to Staging
helm upgrade --install ncert10-quiz-staging ./helm/ncert10-quiz \
  -n ncert10-quiz-staging --create-namespace \
  -f ./helm/ncert10-quiz/values-staging.yaml

# Deploy to Production
helm upgrade --install ncert10-quiz-prod ./helm/ncert10-quiz \
  -n ncert10-quiz --create-namespace \
  -f ./helm/ncert10-quiz/values-prod.yaml
```

---

## 7. Infrastructure as Code (IaC) with Terraform for AWS ECS

Located in [`terraform/`](file:///c:/Users/lenovo/Projects/ncert10-quiz/terraform):
* `vpc.tf`: Multi-AZ VPC across 2 Availability Zones with public subnets, internet gateway, and route tables.
* `security_groups.tf`: Least-privilege security groups (ALB accepts ports 80/443; ECS tasks strictly accept ingress from ALB security group on port 3000).
* `alb.tf`: Application Load Balancer with target group health check at `/api/health`.
* `ecs.tf`: ECS Cluster, CloudWatch Log Group (30-day retention), IAM execution roles, Fargate Task Definition, and ECS Service with Target Tracking AutoScaling.

### Terraform Commands
```bash
cd terraform

# 1. Initialize providers
terraform init

# 2. Plan deployment for Staging
terraform plan -var-file="environments/staging.tfvars"

# 3. Apply deployment
terraform apply -var-file="environments/staging.tfvars" -auto-approve

# 4. Plan/Apply Production
terraform apply -var-file="environments/prod.tfvars"
```

---

## 8. Observability & Monitoring

### Metrics Exposition (`/api/metrics`)
The application exposes Prometheus-compatible metrics in standard exposition format:
* `process_uptime_seconds`: Application process uptime.
* `nodejs_heap_size_total_bytes` & `nodejs_heap_size_used_bytes`: Runtime memory allocations.
* `nodejs_resident_memory_bytes`: Physical RAM utilization.
* `ncert10_quiz_healthy`: Health status gauge.
* `ncert10_quiz_questions_total{subject="..."}`: Available questions per subject.
* `ncert10_quiz_attempts_total`: Total recorded quiz attempts.
* `ncert10_quiz_average_score_percent`: System-wide average score.

### Pre-Configured Grafana Dashboard
Mounted automatically in `monitoring/grafana/dashboards/boardready-dashboard.json`:
* Live color-coded Stat panels for Health, Uptime, Attempts, and Leaderboard.
* Gauge for average score percentage with thresholds (Red <50%, Yellow 50-74%, Green 75%+).
* Time-series chart tracking Node.js process heap memory over time.
* Bar gauge displaying the 120 NCERT questions distributed across subjects.

---

## 9. DevSecOps & Security Hardening

1. **Static Analysis & Secret Detection**:
   * Gitleaks scans git history and workspace for accidental secret leaks in CI.
   * Trivy scans packages and filesystem for vulnerable dependencies before compilation.
2. **Container Security**:
   * Base image: `node:20-alpine` (minimal CVE profile).
   * Runs as non-root user (`USER nextjs`, UID 10001).
   * Linux capabilities dropped in Kubernetes (`capabilities: drop: ["ALL"]`).
   * Read-only container root file system supported.
3. **Application Integrity**:
   * Answer evaluation occurs exclusively on the server (`/api/attempts`). The browser never receives answer keys in `/api/quiz`.
   * Public API responses strip hidden fields using `toPublic()`.
