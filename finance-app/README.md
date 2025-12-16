# Finance App - Financial Management System

A specialized financial management application with restricted access control for finance department users.

## Overview

This application provides finance-specific functionality with strict access controls:
- Financial reports and statements
- Budget management and tracking
- Expense monitoring and approval
- Investment portfolio management
- Tax management and compliance
- Risk analysis and assessment

## Features

- 📊 Financial reporting and analytics
- 💰 Budget planning and tracking
- 💳 Expense management system
- 📈 Investment portfolio tracking
- 📋 Tax calculations and compliance
- ⚠️ Risk assessment tools
- 🔒 Restricted access (Finance users only)
- 📱 Responsive design

## Technology Stack

- **Framework**: React Router v7 with SSR
- **Authentication**: AWS Cognito + OIDC
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Build Tool**: Vite

## Access Control

### ADFS Users
- Must have `finance-`, `accounting`, or `treasury` in email/username

### Cognito Users  
- Must belong to `finance-users`, `accounting-group`, or `admin-group` groups

### Unauthorized Access
- Redirects to access denied page
- Shows appropriate error message

## Getting Started

### Prerequisites
- Node.js 18+
- Valid Finance group membership in Cognito/ADFS
- Access granted by system administrator

### Installation

```bash
cd finance-app
npm install
```

### Development

```bash
npm run dev
```

Application runs on `http://localhost:3002`

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

## Finance Features

### Financial Reports
- Generate P&L statements
- Balance sheet reports
- Cash flow analysis
- Custom financial reports

### Budget Management
- Create departmental budgets
- Track budget vs actual
- Variance analysis
- Budget approvals

### Expense Tracking
- Submit expense reports
- Approve/deny expenses
- Expense categorization
- Reimbursement processing

### Investment Portfolio
- Track company investments
- Performance monitoring
- Asset allocation
- Risk assessment

### Tax Management
- Tax calculations
- Compliance tracking
- Filing preparation
- Audit support

## Docker Support

```bash
# Build image
docker build -t finance-app .

# Run container
docker run -p 3002:3002 finance-app
```

## Security

- Group-based access control
- JWT token validation
- Secure API endpoints
- Audit logging

## Related Applications

- [Main App](../main-app/README.md) - Authentication Portal
- [HR App](../hr-app/README.md) - HR Management System
- [Project Root](../README.md) - Main project documentation