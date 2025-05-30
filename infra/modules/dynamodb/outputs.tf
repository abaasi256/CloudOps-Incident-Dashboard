output "table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.incidents.name
}

output "table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.incidents.arn
}

output "table_stream_arn" {
  description = "DynamoDB table stream ARN"
  value       = aws_dynamodb_table.incidents.stream_arn
}
