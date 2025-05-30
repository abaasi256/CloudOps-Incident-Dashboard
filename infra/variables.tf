variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "demo"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "cloudops-demo"
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = "incidents-demo.com"
}

variable "enable_custom_domain" {
  description = "Enable custom domain for API Gateway"
  type        = bool
  default     = false
}

variable "notification_email" {
  description = "Email for critical notifications"
  type        = string
  default     = "admin@incidents-demo.com"
}

variable "retention_days" {
  description = "CloudWatch logs retention in days"
  type        = number
  default     = 14
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for DynamoDB"
  type        = bool
  default     = true
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for incident notifications"
  type        = string
  default     = ""
  sensitive   = true
}

variable "enable_slack_notifications" {
  description = "Enable Slack notifications for incidents"
  type        = bool
  default     = false
}
