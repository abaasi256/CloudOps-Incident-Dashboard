# Data sources
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-api-${var.suffix}"
  description = "CloudOps Incident Dashboard API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "${var.project_name}-cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [var.cognito_user_pool_arn]
}

# Resources
resource "aws_api_gateway_resource" "incidents" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "incidents"
}

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

# Test resource without authentication
resource "aws_api_gateway_resource" "test_incidents" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "test-incidents"
}

# Individual incident resources (with {id} parameter)
resource "aws_api_gateway_resource" "incidents_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.incidents.id
  path_part   = "{id}"
}

resource "aws_api_gateway_resource" "test_incidents_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.test_incidents.id
  path_part   = "{id}"
}

# Stats resources
resource "aws_api_gateway_resource" "incidents_stats" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.incidents.id
  path_part   = "stats"
}

resource "aws_api_gateway_resource" "test_incidents_stats" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.test_incidents.id
  path_part   = "stats"
}

# Collection Methods
resource "aws_api_gateway_method" "incidents_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.incidents.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_method" "incidents_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.incidents.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "test_incidents_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.test_incidents.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "test_incidents_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.test_incidents.id
  http_method   = "POST"
  authorization = "NONE"
}

# Individual incident methods
resource "aws_api_gateway_method" "incidents_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.incidents_id.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_method" "incidents_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.incidents_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_method" "test_incidents_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.test_incidents_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "test_incidents_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.test_incidents_id.id
  http_method   = "PUT"
  authorization = "NONE"
}

# Stats methods
resource "aws_api_gateway_method" "incidents_stats_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.incidents_stats.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_method" "test_incidents_stats_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.test_incidents_stats.id
  http_method   = "GET"
  authorization = "NONE"
}

# CORS OPTIONS methods
resource "aws_api_gateway_method" "incidents_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.incidents.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "test_incidents_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.test_incidents.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Lambda integrations for collections
resource "aws_api_gateway_integration" "incidents_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.incidents.id
  http_method             = aws_api_gateway_method.incidents_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

resource "aws_api_gateway_integration" "incidents_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.incidents.id
  http_method             = aws_api_gateway_method.incidents_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

resource "aws_api_gateway_integration" "health_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.health.id
  http_method             = aws_api_gateway_method.health_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

resource "aws_api_gateway_integration" "test_incidents_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.test_incidents.id
  http_method             = aws_api_gateway_method.test_incidents_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

resource "aws_api_gateway_integration" "test_incidents_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.test_incidents.id
  http_method             = aws_api_gateway_method.test_incidents_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

# Lambda integrations for individual incidents
resource "aws_api_gateway_integration" "incidents_id_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.incidents_id.id
  http_method             = aws_api_gateway_method.incidents_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

resource "aws_api_gateway_integration" "incidents_id_put" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.incidents_id.id
  http_method             = aws_api_gateway_method.incidents_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

resource "aws_api_gateway_integration" "test_incidents_id_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.test_incidents_id.id
  http_method             = aws_api_gateway_method.test_incidents_id_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

resource "aws_api_gateway_integration" "test_incidents_id_put" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.test_incidents_id.id
  http_method             = aws_api_gateway_method.test_incidents_id_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

# Lambda integrations for stats
resource "aws_api_gateway_integration" "incidents_stats_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.incidents_stats.id
  http_method             = aws_api_gateway_method.incidents_stats_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

resource "aws_api_gateway_integration" "test_incidents_stats_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.test_incidents_stats.id
  http_method             = aws_api_gateway_method.test_incidents_stats_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${var.lambda_api_arn}/invocations"
}

# CORS integrations
resource "aws_api_gateway_integration" "incidents_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.incidents.id
  http_method = aws_api_gateway_method.incidents_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration" "test_incidents_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.test_incidents.id
  http_method = aws_api_gateway_method.test_incidents_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Method responses for CORS
resource "aws_api_gateway_method_response" "incidents_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.incidents.id
  http_method = aws_api_gateway_method.incidents_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  depends_on = [aws_api_gateway_method.incidents_options]
}

resource "aws_api_gateway_method_response" "test_incidents_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.test_incidents.id
  http_method = aws_api_gateway_method.test_incidents_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  depends_on = [aws_api_gateway_method.test_incidents_options]
}

# Integration responses for CORS
resource "aws_api_gateway_integration_response" "incidents_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.incidents.id
  http_method = aws_api_gateway_method.incidents_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [
    aws_api_gateway_integration.incidents_options,
    aws_api_gateway_method_response.incidents_options
  ]
}

resource "aws_api_gateway_integration_response" "test_incidents_options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.test_incidents.id
  http_method = aws_api_gateway_method.test_incidents_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [
    aws_api_gateway_integration.test_incidents_options,
    aws_api_gateway_method_response.test_incidents_options
  ]
}

# Lambda permission
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_api_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.incidents_get,
    aws_api_gateway_integration.incidents_post,
    aws_api_gateway_integration.health_get,
    aws_api_gateway_integration.test_incidents_get,
    aws_api_gateway_integration.test_incidents_post,
    aws_api_gateway_integration.incidents_id_get,
    aws_api_gateway_integration.incidents_id_put,
    aws_api_gateway_integration.test_incidents_id_get,
    aws_api_gateway_integration.test_incidents_id_put,
    aws_api_gateway_integration.incidents_stats_get,
    aws_api_gateway_integration.test_incidents_stats_get,
    aws_api_gateway_integration.incidents_options,
    aws_api_gateway_integration.test_incidents_options,
    aws_api_gateway_integration_response.incidents_options,
    aws_api_gateway_integration_response.test_incidents_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.incidents.id,
      aws_api_gateway_resource.test_incidents.id,
      aws_api_gateway_resource.incidents_id.id,
      aws_api_gateway_resource.test_incidents_id.id,
      aws_api_gateway_resource.incidents_stats.id,
      aws_api_gateway_resource.test_incidents_stats.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "v1"

  tags = {
    Environment = var.environment
  }
}
