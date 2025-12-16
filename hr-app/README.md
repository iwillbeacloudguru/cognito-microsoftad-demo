# HR App - Human Resources Management System

A specialized HR management application with restricted access control for HR department users.

## Overview

This application provides HR-specific functionality with strict access controls:
- Employee directory and management
- Leave management system
- Payroll features
- HR dashboard and analytics

## Features

- 👥 Employee directory and profiles
- 📅 Leave management system
- 💰 Payroll management
- 📊 HR analytics dashboard
- 🔒 Restricted access (HR users only)
- 📱 Responsive design

## Technology Stack

- **Framework**: React Router v7 with SSR
- **Authentication**: AWS Cognito + OIDC
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Build Tool**: Vite

## Access Control

### ADFS Users
- Must have `hr-` or `human-resource` in email/username

### Cognito Users  
- Must belong to `hr-users` or `admin-group` groups

### Unauthorized Access
- Redirects to access denied page
- Shows appropriate error message

## Getting Started

### Prerequisites
- Node.js 18+
- Valid HR group membership in Cognito/ADFS
- Access granted by system administrator

### Installation

```bash
cd hr-app
npm install
```

### Development

```bash
npm run dev
```

Application runs on `http://localhost:3001`

### Production Build

```bash
npm run build
npm start
```

## Configuration

Inherits Cognito configuration from main app:
- Same User Pool ID
- Same Client ID
- Same Custom Domain
- Additional group validation

## HR Features

### Employee Management
- View employee directory
- Manage employee profiles
- Track employee status

### Leave Management
- Submit leave requests
- Approve/deny requests
- View leave calendar
- Generate leave reports

### Payroll System
- Process payroll
- Generate pay stubs
- Tax calculations
- Benefits management

## Docker Support

```bash
# Build image
docker build -t hr-app .

# Run container
docker run -p 3001:3001 hr-app
```

## Security

- Group-based access control
- JWT token validation
- Secure API endpoints
- Audit logging

## Related Applications

- [Main App](../main-app/README.md) - Authentication Portal
- [Project Root](../README.md) - Main project documentation