resource "aws_dynamodb_table" "attempts" {
  name         = "${var.app_name}-${var.environment}-attempts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-attempts"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "leaderboard" {
  name         = "${var.app_name}-${var.environment}-leaderboard"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "subjectId"
    type = "S"
  }

  attribute {
    name = "percent"
    type = "N"
  }

  attribute {
    name = "globalKey"
    type = "S"
  }

  global_secondary_index {
    name            = "GlobalLeaderboardIndex"
    hash_key        = "globalKey"
    range_key       = "percent"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "SubjectLeaderboardIndex"
    hash_key        = "subjectId"
    range_key       = "percent"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-leaderboard"
    Environment = var.environment
  }
}
