# Setup Guide

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- AWS Account with Cognito access
- Microsoft Active Directory (for OIDC integration)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd cognito-microsoftad-demo
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Docker Deployment (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### 4. Development Mode

```bash
# Terminal 1 - Main App
cd main-app
npm install
npm run dev

# Terminal 2 - HR App  
cd hr-app
npm install
npm run dev
```

## AWS Cognito Configuration

### 1. Create User Pool

```bash
# Using AWS CLI
aws cognito-idp create-user-pool \
  --pool-name "MicrosoftAD-Demo" \
  --policies PasswordPolicy='{MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}'
```

### 2. Configure OIDC Provider

1. Navigate to Cognito Console
2. Select your User Pool
3. Go to "Sign-in experience" → "Federated identity provider sign-in"
4. Add OIDC provider with Microsoft AD details

### 3. App Client Configuration

```bash
# Create app client
aws cognito-idp create-user-pool-client \
  --user-pool-id <your-pool-id> \
  --client-name "demo-client" \
  --callback-urls "http://localhost:3000/callback,http://localhost:3001/callback" \
  --logout-urls "http://localhost:3000,http://localhost:3001"
```

## Environment Variables

### Required Configuration

```env
# Cognito Configuration
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
REACT_APP_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_COGNITO_DOMAIN=https://auth.nttdata-cs.com

# Application URLs
REACT_APP_MAIN_APP_URL=http://localhost:3000
REACT_APP_HR_APP_URL=http://localhost:3001

# API Configuration
REACT_APP_API_ENDPOINT=http://localhost:4000/v2

# Database (for MFA demo)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mfa_demo
DB_USER=mfa_user
DB_PASSWORD=your_password
```

## Microsoft AD Integration

### 1. Register Application in Azure AD

1. Go to Azure Portal → Azure Active Directory
2. App registrations → New registration
3. Configure redirect URIs for Cognito
4. Note Application (client) ID and Directory (tenant) ID

### 2. Configure OIDC in Cognito

```json
{
  "provider_name": "MicrosoftAD",
  "provider_type": "OIDC",
  "provider_details": {
    "client_id": "your-azure-app-id",
    "client_secret": "your-azure-app-secret",
    "authorize_scopes": "openid email profile",
    "oidc_issuer": "https://login.microsoftonline.com/your-tenant-id/v2.0"
  }
}
```

## Database Setup (Optional - for MFA demo)

### Using Docker

```bash
# Start PostgreSQL container
docker run -d \
  --name mfa-postgres \
  -e POSTGRES_DB=mfa_demo \
  -e POSTGRES_USER=mfa_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:13
```

### Manual Setup

```sql
-- Create database and user
CREATE DATABASE mfa_demo;
CREATE USER mfa_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mfa_demo TO mfa_user;
```

## Verification

### 1. Check Applications

- Main App: http://localhost:3000
- HR App: http://localhost:3001

### 2. Test Authentication

1. Access Main App
2. Click "Sign In"
3. Authenticate with Microsoft AD credentials
4. Verify user profile and tokens
5. Test application launcher

### 3. Test Access Control

1. Login with HR user → Should access HR App
2. Login with non-HR user → Should see access denied

## Troubleshooting

### Common Issues

**CORS Errors**
- Verify callback URLs in Cognito configuration
- Check domain configuration

**Authentication Failures**
- Verify OIDC provider configuration
- Check Microsoft AD application settings
- Validate client ID and secrets

**Access Denied**
- Verify user group memberships
- Check group name mappings in applications

### Logs

```bash
# Docker logs
docker-compose logs main-app
docker-compose logs hr-app

# Application logs
npm run dev # Shows console output
```