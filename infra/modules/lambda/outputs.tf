output "processor_function_arn" {
  description = "Processor Lambda function ARN"
  value       = aws_lambda_function.processor.arn
}

output "processor_function_name" {
  description = "Processor Lambda function name"
  value       = aws_lambda_function.processor.function_name
}

output "api_function_arn" {
  description = "API Lambda function ARN"
  value       = aws_lambda_function.api.arn
}

output "api_function_name" {
  description = "API Lambda function name"
  value       = aws_lambda_function.api.function_name
}

output "lambda_role_arn" {
  description = "Lambda IAM role ARN"
  value       = aws_iam_role.lambda_role.arn
}
