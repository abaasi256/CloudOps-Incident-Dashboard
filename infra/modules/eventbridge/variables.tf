variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lambda_processor_arn" {
  description = "Lambda processor function ARN"
  type        = string
}

variable "suffix" {
  description = "Random suffix for unique naming"
  type        = string
}
