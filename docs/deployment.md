# Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.5.0
- Node.js >= 18.0.0
- npm or yarn package manager

## AWS Permissions Required

Your AWS user/role needs the following permissions:
- DynamoDB: Full access for table operations
- Lambda: Full access for function management
- API Gateway: Full access for API management
- S3: Full access for bucket operations
- CloudFront: Full access for distribution management
- Cognito: Full access for user pool management
- EventBridge: Full access for event rules
- CloudWatch: Full access for monitoring
- IAM: Limited access for role creation

## Step-by-Step Deployment

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd CloudOps-Incident-Dashboard

# Copy environment configuration
cp .env.example .env

# Edit .env with your specific values
nano .env
```

### 2. Deploy Infrastructure

```bash
cd infra

# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Deploy infrastructure
terraform apply
```

**Expected Output:**
- DynamoDB table created
- Lambda functions deployed
- API Gateway configured
- S3 bucket and CloudFront distribution
- Cognito user pool setup

### 3. Build and Deploy Backend

```bash
cd ../backend

# Install dependencies
npm install

# Build Lambda functions
npm run build

# Deploy to AWS (uploads ZIP files to Lambda)
npm run deploy
```

### 4. Build and Deploy Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Deploy to S3 and invalidate CloudFront
npm run deploy
```

### 5. Verify Deployment

1. **Check Infrastructure:**
   ```bash
   cd infra
   terraform output
   ```

2. **Test API:**
   ```bash
   curl https://your-api-gateway-url/health
   ```

3. **Access Dashboard:**
   - Open the CloudFront URL in your browser
   - Sign up for a new account
   - Verify authentication works

## Configuration

### Environment Variables

Update `.env` with your values:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
ENVIRONMENT=dev

# Project Configuration
PROJECT_NAME=cloudops-incident-dashboard
```

### Frontend Environment

The frontend build process uses these environment variables:

```bash
VITE_API_GATEWAY_URL=https://your-api-url
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxx
VITE_AWS_REGION=us-east-1
```

These are automatically set during CI/CD deployment.

## Post-Deployment Setup

### 1. Create Admin User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id your-user-pool-id \
  --username admin \
  --user-attributes Name=email,Value=admin@yourcompany.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

### 2. Test Incident Creation

1. Log into the dashboard
2. Create a test incident
3. Verify it appears in the database:
   ```bash
   aws dynamodb scan --table-name your-table-name
   ```

### 3. Test CloudWatch Integration

1. Create a test alarm:
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name "test-alarm" \
     --alarm-description "Test alarm for incident system" \
     --metric-name CPUUtilization \
     --namespace AWS/EC2 \
     --statistic Average \
     --period 300 \
     --threshold 80 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 2
   ```

2. Trigger the alarm and verify incident creation

## Troubleshooting

### Common Issues

**1. Terraform Apply Fails**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify region configuration
aws configure list

# Check for resource naming conflicts
terraform plan -detailed-exitcode
```

**2. Lambda Function Errors**
```bash
# Check function logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/cloudops"

# View recent errors
aws logs filter-log-events \
  --log-group-name "/aws/lambda/cloudops-processor" \
  --filter-pattern "ERROR"
```

**3. Frontend Build Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment variables
echo $VITE_API_GATEWAY_URL
```

**4. API Gateway CORS Issues**
- Verify OPTIONS method is configured
- Check Access-Control-Allow-Origin headers
- Ensure preflight requests are handled

**5. Cognito Authentication Issues**
- Verify user pool domain is configured
- Check callback URLs match your domain
- Ensure user pool client settings are correct

### Monitoring and Logs

**CloudWatch Logs:**
- `/aws/lambda/cloudops-processor-*`
- `/aws/lambda/cloudops-api-*`
- `/aws/apigateway/cloudops-*`

**Useful AWS CLI Commands:**
```bash
# Check Lambda function status
aws lambda list-functions --query "Functions[?contains(FunctionName, 'cloudops')]"

# View DynamoDB table
aws dynamodb describe-table --table-name your-table-name

# Check API Gateway stages
aws apigateway get-stages --rest-api-id your-api-id
```

## Updating the Application

### Infrastructure Updates
```bash
cd infra
terraform plan
terraform apply
```

### Backend Updates
```bash
cd backend
npm run build
npm run deploy
```

### Frontend Updates
```bash
cd frontend
npm run build
npm run deploy
```

## Cleanup

To destroy all resources:

```bash
# Remove S3 bucket contents first
aws s3 rm s3://your-bucket-name --recursive

# Destroy infrastructure
cd infra
terraform destroy
```

**⚠️ Warning:** This will permanently delete all data and resources.
