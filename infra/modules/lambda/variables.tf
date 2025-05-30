variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "dynamodb_table" {
  description = "DynamoDB table name"
  type        = string
}

variable "eventbridge_arn" {
  description = "EventBridge rule ARN"
  type        = string
}

variable "suffix" {
  description = "Random suffix for unique naming"
  type        = string
}
