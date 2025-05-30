# EventBridge Rule for CloudWatch Alarms
resource "aws_cloudwatch_event_rule" "alarm_events" {
  name        = "${var.project_name}-alarm-events-${var.suffix}"
  description = "Capture CloudWatch alarm state changes"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      state = {
        value = ["ALARM", "OK"]
      }
    }
  })

  tags = {
    Environment = var.environment
  }
}

# EventBridge Rule for custom application events
resource "aws_cloudwatch_event_rule" "custom_events" {
  name        = "${var.project_name}-custom-events-${var.suffix}"
  description = "Capture custom application events"

  event_pattern = jsonencode({
    source      = ["custom.incident-system"]
    detail-type = ["Incident Created", "Incident Updated", "Service Health Check"]
  })

  tags = {
    Environment = var.environment
  }
}

# EventBridge Target for alarm events
resource "aws_cloudwatch_event_target" "lambda_target_alarms" {
  rule      = aws_cloudwatch_event_rule.alarm_events.name
  target_id = "SendToLambdaProcessor"
  arn       = var.lambda_processor_arn
}

# EventBridge Target for custom events
resource "aws_cloudwatch_event_target" "lambda_target_custom" {
  rule      = aws_cloudwatch_event_rule.custom_events.name
  target_id = "SendToLambdaProcessorCustom"
  arn       = var.lambda_processor_arn
}

# Demo CloudWatch Alarm for testing
resource "aws_cloudwatch_metric_alarm" "demo_alarm" {
  alarm_name          = "${var.project_name}-demo-high-cpu-${var.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = []

  dimensions = {
    InstanceId = "i-1234567890abcdef0"  # Dummy instance ID for demo
  }

  tags = {
    Environment = var.environment
    Purpose     = "demo"
  }
}

# Synthetic alarm for testing (triggers every 5 minutes)
resource "aws_cloudwatch_metric_alarm" "synthetic_test_alarm" {
  alarm_name          = "${var.project_name}-synthetic-test-${var.suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "NumberOfObjects"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Average"
  threshold           = "999999"
  alarm_description   = "Synthetic alarm for testing incident creation"
  treat_missing_data  = "breaching"

  dimensions = {
    BucketName = "non-existent-bucket-for-testing-${var.suffix}"
    StorageType = "AllStorageTypes"
  }

  tags = {
    Environment = var.environment
    Purpose     = "testing"
  }
}
