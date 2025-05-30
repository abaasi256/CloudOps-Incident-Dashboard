variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_api_arn" {
  description = "Lambda API function ARN"
  type        = string
}

variable "lambda_api_name" {
  description = "Lambda API function name"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "suffix" {
  description = "Random suffix for unique naming"
  type        = string
}
