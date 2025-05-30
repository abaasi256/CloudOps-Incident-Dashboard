output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.api_gateway.api_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito Client ID"
  value       = module.cognito.client_id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = module.dynamodb.table_name
}

output "s3_bucket_name" {
  description = "S3 bucket for frontend hosting"
  value       = module.frontend.bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.frontend.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.frontend.domain_name
}

output "eventbridge_rule_arn" {
  description = "EventBridge rule ARN"
  value       = module.eventbridge.rule_arn
}

output "processor_function_name" {
  description = "Lambda processor function name"
  value       = module.lambda.processor_function_name
}

output "api_function_name" {
  description = "Lambda API function name"
  value       = module.lambda.api_function_name
}

# Legacy outputs for backward compatibility
output "lambda_processor_function_name" {
  description = "Lambda processor function name (legacy)"
  value       = module.lambda.processor_function_name
}

output "lambda_api_function_name" {
  description = "Lambda API function name (legacy)"
  value       = module.lambda.api_function_name
}

output "monitoring_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
}

output "slack_notifier_function_name" {
  description = "Slack notifier Lambda function name"
  value       = var.enable_slack_notifications && var.slack_webhook_url != "" ? module.notifications[0].slack_notifier_function_name : null
  sensitive   = true
}

output "slack_webhook_parameter" {
  description = "SSM parameter name for Slack webhook URL"
  value       = var.enable_slack_notifications && var.slack_webhook_url != "" ? module.notifications[0].slack_webhook_parameter : null
  sensitive   = true
}
