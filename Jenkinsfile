pipeline {
    agent any

    environment {
        APP_NAME          = 'ncert10-quiz'
        REGISTRY          = 'ghcr.io'
        IMAGE_NAME        = "${env.REGISTRY}/your-org/${env.APP_NAME}"
        IMAGE_TAG         = "${env.BUILD_NUMBER}-${env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : 'latest'}"
        DOCKER_CREDENTIALS= 'github-container-registry-creds'
        NODE_ENV          = 'production'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 25, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing project dependencies...'
                sh 'npm ci || npm install'
            }
        }

        stage('Validate Question Bank') {
            steps {
                echo 'Verifying NCERT Class 10 Question Bank contract...'
                sh 'npm run validate:bank'
            }
        }

        stage('Code Quality & Typing') {
            parallel {
                stage('Linting') {
                    steps {
                        echo 'Running ESLint checks...'
                        sh 'npm run lint'
                    }
                }
                stage('Type Check') {
                    steps {
                        echo 'Running TypeScript type checks...'
                        sh 'npm run typecheck'
                    }
                }
            }
        }

        stage('Production Build') {
            steps {
                echo 'Compiling Next.js production build...'
                sh 'npm run build'
            }
        }

        stage('Container Build') {
            steps {
                echo "Building Docker container image: ${env.IMAGE_NAME}:${env.IMAGE_TAG}..."
                sh """
                    docker build \
                        -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} \
                        -t ${env.IMAGE_NAME}:latest \
                        .
                """
            }
        }

        stage('Security Vulnerability Scan') {
            steps {
                echo 'Scanning container image with Trivy for high/critical vulnerabilities...'
                // If Trivy is installed on Jenkins agent:
                sh """
                    if command -v trivy >/dev/null 2>&1; then
                        trivy image --severity HIGH,CRITICAL --exit-code 0 ${env.IMAGE_NAME}:${env.IMAGE_TAG}
                    else
                        echo 'Trivy scanner not installed on agent, skipping container security scan.'
                    fi
                """
            }
        }

        stage('Push to Container Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo 'Authenticating and pushing image to container registry...'
                // Uses Jenkins credentials binding for secure registry access
                withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS, usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASS')]) {
                    sh """
                        echo "\$REGISTRY_PASS" | docker login ${env.REGISTRY} -u "\$REGISTRY_USER" --password-stdin
                        docker push ${env.IMAGE_NAME}:${env.IMAGE_TAG}
                        docker push ${env.IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo 'Deploying to Staging Kubernetes cluster via Helm...'
                sh """
                    if command -v helm >/dev/null 2>&1; then
                        helm upgrade --install ${env.APP_NAME}-staging ./helm/ncert10-quiz \
                            --namespace ncert10-quiz-staging \
                            --create-namespace \
                            --values ./helm/ncert10-quiz/values-staging.yaml \
                            --set image.tag=${env.IMAGE_TAG}
                    else
                        echo 'Helm not installed on Jenkins agent. Manual deployment required.'
                    fi
                """
            }
        }

        stage('Deploy to Production') {
            when {
                tag pattern: "v[0-9]+\\.[0-9]+\\.[0-9]+", comparator: "REGEXP"
            }
            steps {
                input message: "Approve deployment to Production with tag ${env.IMAGE_TAG}?"
                echo 'Deploying to Production Kubernetes cluster via Helm...'
                sh """
                    helm upgrade --install ${env.APP_NAME}-prod ./helm/ncert10-quiz \
                        --namespace ncert10-quiz \
                        --create-namespace \
                        --values ./helm/ncert10-quiz/values-prod.yaml \
                        --set image.tag=${env.IMAGE_TAG}
                """
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker images on agent...'
            sh 'docker image prune -f || true'
        }
        success {
            echo "CI/CD Pipeline succeeded for ${env.JOB_NAME} #${env.BUILD_NUMBER}!"
        }
        failure {
            echo "Pipeline failed for ${env.JOB_NAME} #${env.BUILD_NUMBER}. Please check build logs."
        }
    }
}
