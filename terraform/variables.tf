variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-north-1"
}

variable "environment" {
  description = "Target environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "ncert10-quiz"
}

variable "instance_type" {
  description = "EC2 instance type for Docker, Kubernetes, and Jenkins host"
  type        = string
  default     = "t3.micro"
}

variable "container_port" {
  description = "Port exposed by the Docker container"
  type        = number
  default     = 3000
}
