# Cognito Microsoft AD Demo

A multi-application system demonstrating AWS Cognito integration with Microsoft Active Directory using OIDC authentication.

## Applications

### Main App (Port 3000)
- Authentication portal with Microsoft AD integration
- Application launcher with group-based access control
- User profile and token display

### HR App (Port 3001)
- HR Management System
- Restricted to HR department users only
- Employee directory, leave management, and payroll features

## Quick Start

### Using Docker Compose

```bash
# Build and run both applications
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

### Development Mode

```bash
# Main App
cd main-app
npm install
npm run dev

# HR App (in another terminal)
cd hr-app
npm install
npm run dev
```

## Access Control

### Main App
- Open to all authenticated users
- Shows applications based on user groups

### HR App
- **ADFS Users**: Must have `hr-` or `human-resource` in email/username
- **Cognito Users**: Must have `hr-users` or `admin-group` groups
- Redirects unauthorized users with access denied message

## Configuration

Both applications use the same Cognito configuration:
- User Pool ID: Set via environment or code
- Client ID: Set via environment or code
- Custom Domain: Set via environment or code

## URLs

- **Main App**: http://localhost:3000
- **HR App**: http://localhost:3001
- **Cognito Domain**: https://auth.nttdata-cs.com
- **Logout Redirect**: https://demo.nttdata-cs.com

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Main App      │    │    HR App       │
│   (Port 3000)   │    │   (Port 3001)   │
│                 │    │                 │
│ - Auth Portal   │    │ - HR Dashboard  │
│ - App Launcher  │    │ - Employee Mgmt │
│ - User Profile  │    │ - Leave System  │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                     │
         ┌─────────────────────────┐
         │   AWS Cognito +         │
         │   Microsoft AD          │
         └─────────────────────────┘
```