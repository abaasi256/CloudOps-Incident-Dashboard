output "rule_arn" {
  description = "EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.alarm_events.arn
}

output "rule_name" {
  description = "EventBridge rule name"
  value       = aws_cloudwatch_event_rule.alarm_events.name
}

output "custom_rule_arn" {
  description = "Custom EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.custom_events.arn
}
