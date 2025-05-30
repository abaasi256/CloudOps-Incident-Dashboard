resource "aws_dynamodb_table" "incidents" {
  name           = var.table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "incidentId"
  
  attribute {
    name = "incidentId"
    type = "S"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "S"
  }
  
  attribute {
    name = "severity"
    type = "S"
  }
  
  # GSI for querying by status and timestamp
  global_secondary_index {
    name            = "status-timestamp-index"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  # GSI for querying by severity
  global_secondary_index {
    name            = "severity-timestamp-index"
    hash_key        = "severity"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name        = "${var.project_name}-incidents-table"
    Environment = var.environment
  }
}

# CloudWatch alarm for DynamoDB throttling
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.project_name}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadThrottledEvents"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB read throttles"
  
  dimensions = {
    TableName = aws_dynamodb_table.incidents.name
  }
  
  tags = {
    Environment = var.environment
  }
}
