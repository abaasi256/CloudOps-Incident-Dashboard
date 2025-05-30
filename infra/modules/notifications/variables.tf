variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "suffix" {
  description = "Random suffix for unique resource names"
  type        = string
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  sensitive   = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "notification_channels" {
  description = "List of notification channels"
  type = list(object({
    name        = string
    webhook_url = string
    severity    = list(string)
  }))
  default = []
}
