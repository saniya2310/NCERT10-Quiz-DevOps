# Enterprise EC2 Instance hosting Docker, Kubernetes (K3s), and Jenkins
resource "aws_instance" "devops_node" {
  ami                         = "ami-0f980b876fce6ce35"
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.devops_node.id]
  iam_instance_profile        = aws_iam_instance_profile.devops_ec2.name
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.app_name}-${var.environment}-root-volume"
    }
  }

  user_data = <<-EOF
    #!/bin/bash
    set -ex

    # 1. Setup 4GB Swap to support concurrent Docker, K8s, and Jenkins builds
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab

    # 2. Update System & Install Core Utilities (Docker, Git, Java for Jenkins)
    dnf update -y
    dnf install -y docker git tar gzip curl wget java-17-amazon-corretto-headless nginx

    # 3. Enable and Start Docker Daemon
    systemctl enable --now docker
    usermod -aG docker ec2-user

    # 4. Install Kubernetes (Lightweight Certified CNCF K3s Cluster)
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--write-kubeconfig-mode 644 --docker" sh -
    export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
    echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> /etc/profile
    echo 'alias kubectl="k3s kubectl"' >> /etc/profile

    # 5. Install Jenkins Repository and Service
    wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
    rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
    dnf install -y jenkins
    usermod -aG docker jenkins || true

    # Grant Jenkins access to Kubernetes kubeconfig
    mkdir -p /var/lib/jenkins/.kube
    cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config || true
    chown -R jenkins:jenkins /var/lib/jenkins/.kube || true

    systemctl daemon-reload
    systemctl enable --now jenkins

    # 6. Configure Nginx Reverse Proxy (Port 80 -> Kubernetes NodePort 30080)
    cat << 'NGINX_CONF' > /etc/nginx/conf.d/devops.conf
    server {
        listen 80;
        server_name _;

        # Forward web traffic to Kubernetes Service NodePort
        location / {
            proxy_pass http://127.0.0.1:30080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_cache_bypass \$http_upgrade;
        }
    }
    NGINX_CONF

    systemctl enable --now nginx
    systemctl restart nginx

    # Log completion marker
    echo "DevOps Node bootstrap finished successfully at $(date)" > /var/log/bootstrap-complete.log
  EOF

  tags = {
    Name        = "${var.app_name}-${var.environment}-devops-node"
    Environment = var.environment
    Role        = "Kubernetes-Docker-Jenkins-Host"
  }
}
