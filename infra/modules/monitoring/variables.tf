variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_function_names" {
  description = "List of Lambda function names to monitor"
  type        = list(string)
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name to monitor"
  type        = string
}

variable "api_gateway_name" {
  description = "API Gateway name to monitor"
  type        = string
}

variable "suffix" {
  description = "Random suffix for unique naming"
  type        = string
}
