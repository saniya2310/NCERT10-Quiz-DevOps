output "ec2_public_ip" {
  description = "The public IPv4 address of the EC2 DevOps Host"
  value       = aws_instance.devops_node.public_ip
}

output "quiz_app_url" {
  description = "The public web link to access the NCERT Class 10 Quiz Platform"
  value       = "http://${aws_instance.devops_node.public_ip}"
}

output "jenkins_url" {
  description = "The direct web link to access the Jenkins CI/CD Dashboard"
  value       = "http://${aws_instance.devops_node.public_ip}:8080"
}

output "s3_artifacts_bucket" {
  description = "The Amazon S3 bucket storing Jenkins pipeline build artifacts and reports"
  value       = aws_s3_bucket.artifacts.id
}

output "dynamodb_attempts_table" {
  description = "The DynamoDB table storing student quiz attempts"
  value       = aws_dynamodb_table.attempts.name
}

output "dynamodb_leaderboard_table" {
  description = "The DynamoDB table storing global & subject leaderboard scores"
  value       = aws_dynamodb_table.leaderboard.name
}
