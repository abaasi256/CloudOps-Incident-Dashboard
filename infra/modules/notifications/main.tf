# Notifications Module - Slack Integration
# This module handles Slack notifications for incident management

# SSM Parameter for Slack Webhook URL (secure storage)
resource "aws_ssm_parameter" "slack_webhook_url" {
  name        = "/${var.project_name}/${var.environment}/slack/webhook-url"
  description = "Slack webhook URL for incident notifications"
  type        = "SecureString"
  value       = var.slack_webhook_url

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda function for Slack notifications
resource "aws_lambda_function" "slack_notifier" {
  filename         = data.archive_file.slack_notifier_zip.output_path
  function_name    = "${var.project_name}-slack-notifier-${var.suffix}"
  role            = aws_iam_role.slack_notifier_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  source_code_hash = data.archive_file.slack_notifier_zip.output_base64sha256

  environment {
    variables = {
      SLACK_WEBHOOK_PARAMETER = aws_ssm_parameter.slack_webhook_url.name
      ENVIRONMENT            = var.environment
      LOG_LEVEL             = "info"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.slack_notifier_basic,
    aws_cloudwatch_log_group.slack_notifier_logs,
  ]

  tags = {
    Environment = var.environment
  }
}

# CloudWatch Log Group for Slack notifier
resource "aws_cloudwatch_log_group" "slack_notifier_logs" {
  name              = "/aws/lambda/${var.project_name}-slack-notifier-${var.suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Environment = var.environment
  }
}

# IAM Role for Slack notifier Lambda
resource "aws_iam_role" "slack_notifier_role" {
  name = "${var.project_name}-slack-notifier-role-${var.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
  }
}

# Attach basic execution role to Lambda
resource "aws_iam_role_policy_attachment" "slack_notifier_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.slack_notifier_role.name
}

# Custom policy for SSM access
resource "aws_iam_role_policy" "slack_notifier_policy" {
  name = "${var.project_name}-slack-notifier-policy-${var.suffix}"
  role = aws_iam_role.slack_notifier_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = aws_ssm_parameter.slack_webhook_url.arn
      }
    ]
  })
}

# EventBridge rule for incident notifications
resource "aws_cloudwatch_event_rule" "incident_notifications" {
  name        = "${var.project_name}-incident-notifications-${var.suffix}"
  description = "Capture incident events for Slack notifications"

  event_pattern = jsonencode({
    source      = ["custom.incident-system"]
    detail-type = [
      "Incident Created",
      "Incident Updated", 
      "Incident Resolved",
      "Critical Incident"
    ]
  })

  tags = {
    Environment = var.environment
  }
}

# EventBridge target for Slack notifications
resource "aws_cloudwatch_event_target" "slack_target" {
  rule      = aws_cloudwatch_event_rule.incident_notifications.name
  target_id = "SendToSlackNotifier"
  arn       = aws_lambda_function.slack_notifier.arn
}

# Permission for EventBridge to invoke Slack notifier
resource "aws_lambda_permission" "allow_eventbridge_slack" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slack_notifier.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.incident_notifications.arn
}

# Archive file for Slack notifier Lambda
data "archive_file" "slack_notifier_zip" {
  type        = "zip"
  output_path = "${path.module}/slack-notifier.zip"
  
  source {
    content  = file("${path.module}/slack-notifier.js")
    filename = "index.js"
  }
}
