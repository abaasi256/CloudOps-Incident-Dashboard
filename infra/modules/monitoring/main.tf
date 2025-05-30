# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_function_names[0]],
            [".", "Errors", ".", "."],
            [".", "Invocations", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Lambda Processor Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_function_names[1]],
            [".", "Errors", ".", "."],
            [".", "Invocations", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Lambda API Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_name],
            [".", "ConsumedWriteCapacityUnits", ".", "."],
            [".", "ItemCount", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "DynamoDB Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", var.api_gateway_name],
            [".", "Latency", ".", "."],
            [".", "4XXError", ".", "."],
            [".", "5XXError", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "API Gateway Metrics"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  count = length(var.lambda_function_names)
  
  alarm_name          = "${var.project_name}-lambda-errors-${var.lambda_function_names[count.index]}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda errors"

  dimensions = {
    FunctionName = var.lambda_function_names[count.index]
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  count = length(var.lambda_function_names)
  
  alarm_name          = "${var.project_name}-lambda-duration-${var.lambda_function_names[count.index]}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "20000"  # 20 seconds
  alarm_description   = "This metric monitors lambda duration"

  dimensions = {
    FunctionName = var.lambda_function_names[count.index]
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_errors" {
  alarm_name          = "${var.project_name}-api-gateway-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5xx errors"

  dimensions = {
    ApiName = var.api_gateway_name
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_latency" {
  alarm_name          = "${var.project_name}-api-gateway-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000"  # 2 seconds
  alarm_description   = "This metric monitors API Gateway latency"

  dimensions = {
    ApiName = var.api_gateway_name
  }

  tags = {
    Environment = var.environment
  }
}

# SNS Topic for alerts (optional)
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.suffix}"

  tags = {
    Environment = var.environment
  }
}

# CloudWatch Log Insights queries
resource "aws_cloudwatch_query_definition" "error_analysis" {
  name = "${var.project_name}/error-analysis"

  log_group_names = [
    "/aws/lambda/${var.lambda_function_names[0]}",
    "/aws/lambda/${var.lambda_function_names[1]}"
  ]

  query_string = <<EOF
fields @timestamp, @message, @requestId, @duration
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "performance_analysis" {
  name = "${var.project_name}/performance-analysis"

  log_group_names = [
    "/aws/lambda/${var.lambda_function_names[0]}",
    "/aws/lambda/${var.lambda_function_names[1]}"
  ]

  query_string = <<EOF
fields @timestamp, @duration, @billedDuration, @maxMemoryUsed
| filter @duration > 1000
| sort @duration desc
| limit 50
EOF
}

# Data source for current region
data "aws_region" "current" {}
