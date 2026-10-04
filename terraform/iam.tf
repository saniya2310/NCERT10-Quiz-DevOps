# IAM Role for EC2 hosting Docker, Kubernetes, and Jenkins
resource "aws_iam_role" "devops_ec2" {
  name = "${var.app_name}-${var.environment}-devops-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy granting S3, DynamoDB, and CloudWatch permissions
resource "aws_iam_policy" "devops_ec2_policy" {
  name        = "${var.app_name}-${var.environment}-devops-ec2-policy"
  description = "Allows EC2 instance to access S3 artifacts and DynamoDB quiz tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable"
        ]
        Resource = [
          aws_dynamodb_table.attempts.arn,
          "${aws_dynamodb_table.attempts.arn}/index/*",
          aws_dynamodb_table.leaderboard.arn,
          "${aws_dynamodb_table.leaderboard.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "devops_ec2_attach" {
  role       = aws_iam_role.devops_ec2.name
  policy_arn = aws_iam_policy.devops_ec2_policy.arn
}

resource "aws_iam_instance_profile" "devops_ec2" {
  name = "${var.app_name}-${var.environment}-devops-ec2-profile"
  role = aws_iam_role.devops_ec2.name
}
