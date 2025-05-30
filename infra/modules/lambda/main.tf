# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role-${var.suffix}"

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
}

# IAM Policy for Lambda functions
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy-${var.suffix}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:*:*:table/${var.dynamodb_table}",
          "arn:aws:dynamodb:*:*:table/${var.dynamodb_table}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "processor_logs" {
  name              = "/aws/lambda/${var.project_name}-processor-${var.suffix}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/lambda/${var.project_name}-api-${var.suffix}"
  retention_in_days = 14
}

# Lambda function for processing events
resource "aws_lambda_function" "processor" {
  filename         = "${path.module}/processor.zip"
  function_name    = "${var.project_name}-processor-${var.suffix}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  
  source_code_hash = filebase64sha256("${path.module}/processor.zip")

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table
      ENVIRONMENT    = var.environment
      LOG_LEVEL     = "info"
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.processor_logs,
  ]

  tags = {
    Environment = var.environment
  }
}

# Lambda function for API operations
resource "aws_lambda_function" "api" {
  filename         = "${path.module}/api.zip"
  function_name    = "${var.project_name}-api-${var.suffix}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  
  source_code_hash = filebase64sha256("${path.module}/api.zip")

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table
      ENVIRONMENT    = var.environment
      LOG_LEVEL     = "info"
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.api_logs,
  ]

  tags = {
    Environment = var.environment
  }
}

# Permission for EventBridge to invoke processor Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = var.eventbridge_arn
}
