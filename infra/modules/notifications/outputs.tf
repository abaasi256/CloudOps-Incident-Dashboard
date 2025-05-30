output "slack_notifier_function_name" {
  description = "Name of the Slack notifier Lambda function"
  value       = aws_lambda_function.slack_notifier.function_name
}

output "slack_notifier_function_arn" {
  description = "ARN of the Slack notifier Lambda function"
  value       = aws_lambda_function.slack_notifier.arn
}

output "notification_rule_arn" {
  description = "ARN of the EventBridge rule for notifications"
  value       = aws_cloudwatch_event_rule.incident_notifications.arn
}

output "slack_webhook_parameter" {
  description = "SSM parameter name for Slack webhook URL"
  value       = aws_ssm_parameter.slack_webhook_url.name
  sensitive   = true
}
