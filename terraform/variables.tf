variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Target environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "ncert10-quiz"
}

variable "container_image" {
  description = "Docker image repository and tag"
  type        = string
  default     = "ghcr.io/your-org/ncert10-quiz:latest"
}

variable "container_port" {
  description = "Port exposed by the Docker container"
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "Fargate CPU units (256, 512, 1024, etc.)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate Memory (512, 1024, 2048, etc.)"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum tasks for autoscaling"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum tasks for autoscaling"
  type        = number
  default     = 10
}
