variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "api_gateway_execution_arn" {
  description = "API Gateway execution ARN for IAM policy"
  type        = string
}

variable "suffix" {
  description = "Random suffix for unique naming"
  type        = string
}
