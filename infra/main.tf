terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}

# Local values
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  suffix     = random_id.suffix.hex
  
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# DynamoDB Table
module "dynamodb" {
  source = "./modules/dynamodb"
  
  table_name   = "${var.project_name}-incidents-${local.suffix}"
  environment  = var.environment
  project_name = var.project_name
}

# Lambda Functions
module "lambda" {
  source = "./modules/lambda"
  
  project_name     = var.project_name
  environment      = var.environment
  dynamodb_table   = module.dynamodb.table_name
  eventbridge_arn  = module.eventbridge.rule_arn
  suffix          = local.suffix
}

# EventBridge
module "eventbridge" {
  source = "./modules/eventbridge"
  
  project_name       = var.project_name
  environment        = var.environment
  lambda_processor_arn = module.lambda.processor_function_arn
  suffix            = local.suffix
}

# API Gateway
module "api_gateway" {
  source = "./modules/api_gateway"
  
  project_name         = var.project_name
  environment          = var.environment
  lambda_api_arn       = module.lambda.api_function_arn
  lambda_api_name      = module.lambda.api_function_name
  cognito_user_pool_arn = module.cognito.user_pool_arn
  suffix              = local.suffix
}

# Cognito
module "cognito" {
  source = "./modules/cognito"
  
  project_name              = var.project_name
  environment               = var.environment
  api_gateway_execution_arn = module.api_gateway.execution_arn
  suffix                   = local.suffix
}

# S3 and CloudFront for Frontend
module "frontend" {
  source = "./modules/frontend"
  
  project_name = var.project_name
  environment  = var.environment
  suffix      = local.suffix
}

# CloudWatch
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name         = var.project_name
  environment          = var.environment
  lambda_function_names = [
    module.lambda.processor_function_name,
    module.lambda.api_function_name
  ]
  dynamodb_table_name = module.dynamodb.table_name
  api_gateway_name    = module.api_gateway.api_name
  suffix             = local.suffix
}

# Slack Notifications
module "notifications" {
  count  = var.enable_slack_notifications && var.slack_webhook_url != "" ? 1 : 0
  source = "./modules/notifications"
  
  project_name      = var.project_name
  environment       = var.environment
  suffix           = local.suffix
  slack_webhook_url = var.slack_webhook_url
  log_retention_days = var.retention_days
}
