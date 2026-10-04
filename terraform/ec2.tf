# Enterprise EC2 Instance hosting Docker, Kubernetes (K3s), Jenkins, and Quiz Application
resource "aws_instance" "devops_node" {
  ami                         = "ami-0f980b876fce6ce35"
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.devops_node.id]
  iam_instance_profile        = aws_iam_instance_profile.devops_ec2.name
  associate_public_ip_address = true
  user_data_replace_on_change = true

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
    set -x

    # 1. Setup 4GB Swapfile to ensure smooth builds and multiple services on t3.micro
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab

    # 2. Update System & Install Core Packages
    dnf update -y
    dnf install -y nginx tar gzip curl wget git

    # 3. Configure and Start Nginx immediately to open Port 80
    cat << 'NGINX_CONF' > /etc/nginx/conf.d/quiz.conf
    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://127.0.0.1:3000;
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

    systemctl daemon-reload
    systemctl enable --now nginx
    systemctl restart nginx

    # 4. Install Node.js 20
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs

    # 5. Download Application Bundle from S3 and Deploy
    mkdir -p /opt/app
    cd /opt/app
    aws s3 cp s3://${aws_s3_bucket.artifacts.id}/app.tar.gz app.tar.gz
    tar -xzf app.tar.gz

    cat << 'ENVFILE' > .env.production
    PORT=3000
    AWS_REGION=${var.aws_region}
    DYNAMODB_TABLE_ATTEMPTS=${aws_dynamodb_table.attempts.name}
    DYNAMODB_TABLE_LEADERBOARD=${aws_dynamodb_table.leaderboard.name}
    NODE_ENV=production
    ENVFILE

    npm install
    npm run build

    # 6. Configure systemd service for Quiz App
    cat << 'SERVICEFILE' > /etc/systemd/system/quiz.service
    [Unit]
    Description=NCERT Class 10 Quiz App Next.js Service
    After=network.target

    [Service]
    Type=simple
    User=root
    WorkingDirectory=/opt/app
    EnvironmentFile=/opt/app/.env.production
    ExecStart=/usr/bin/npm start
    Restart=always
    RestartSec=5

    [Install]
    WantedBy=multi-user.target
    SERVICEFILE

    systemctl daemon-reload
    systemctl enable --now quiz

    # 7. Install and Start Docker Daemon
    dnf install -y docker
    systemctl enable --now docker
    usermod -aG docker ec2-user

    # 8. Install Kubernetes (Lightweight Certified CNCF K3s)
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--write-kubeconfig-mode 644" sh - || true
    echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> /etc/profile
    echo 'alias kubectl="k3s kubectl"' >> /etc/profile

    # 9. Install Java 17 & Jenkins CI/CD
    dnf install -y java-17-amazon-corretto
    wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
    rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
    dnf install -y jenkins || true
    systemctl enable --now jenkins || true

    echo "Bootstrap completed successfully at $(date)" > /var/log/bootstrap-complete.log
  EOF

  depends_on = [
    aws_s3_object.app_bundle,
    aws_dynamodb_table.attempts,
    aws_dynamodb_table.leaderboard,
    aws_iam_role_policy_attachment.devops_ec2_ssm
  ]

  tags = {
    Name        = "${var.app_name}-${var.environment}-devops-node"
    Environment = var.environment
    Role        = "Kubernetes-Docker-Jenkins-Host"
  }
}
