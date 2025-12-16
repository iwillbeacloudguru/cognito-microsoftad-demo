# Cognito Microsoft AD Demo

A multi-application system demonstrating AWS Cognito integration with Microsoft Active Directory using OIDC authentication.

## 📋 Table of Contents

- [Applications](#applications)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [URLs](#urls)
- [Contributing](#contributing)

## 🚀 Applications

### [Main App](./main-app/README.md) (Port 3000)
- Authentication portal with Microsoft AD integration
- Application launcher with group-based access control
- User profile and token display
- **Access**: All authenticated users

### [HR App](./hr-app/README.md) (Port 3001)
- HR Management System with employee directory
- Leave management and payroll features
- **Access**: HR department users only
  - **ADFS Users**: Must have `hr-` or `human-resource` in email/username
  - **Cognito Users**: Must belong to `hr-users` or `admin-group` groups

### [Finance App](./finance-app/README.md) (Port 3002)
- Financial Management System with reporting and analytics
- Budget management, expense tracking, and investment portfolio
- **Access**: Finance department users only
  - **ADFS Users**: Must have `finance-`, `accounting`, or `treasury` in email/username
  - **Cognito Users**: Must belong to `finance-users`, `accounting-group`, or `admin-group` groups

## ⚡ Quick Start

### Using Docker Compose (Recommended)

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

# Finance App (in another terminal)
cd finance-app
npm install
npm run dev
```

## 📚 Documentation

### Setup & Configuration
- [📖 Setup Guide](./docs/SETUP.md) - Complete installation and configuration
- [🏗️ Architecture](./docs/ARCHITECTURE.md) - System design and components
- [🔧 API Documentation](./docs/API.md) - REST API reference

### Application Guides
- [🔐 Main App Documentation](./main-app/README.md) - Authentication portal
- [👥 HR App Documentation](./hr-app/README.md) - HR management system
- [💰 Finance App Documentation](./finance-app/README.md) - Financial management system

### Additional Resources
- [🐳 Docker Configuration](./docker-compose.yml) - Container setup
- [📝 Project Memory](/.amazonq/rules/memory-bank/project-memory.md) - Development notes

## 📁 Project Structure

```
cognito-microsoftad-demo/
├── main-app/                 # Authentication portal (Port 3000)
│   ├── app/                  # React Router application
│   ├── Dockerfile           # Container configuration
│   └── README.md            # Main app documentation
├── hr-app/                   # HR management system (Port 3001)
│   ├── app/                  # React Router application
│   ├── Dockerfile           # Container configuration
│   └── README.md            # HR app documentation
├── finance-app/              # Financial management system (Port 3002)
│   ├── app/                  # React Router application
│   ├── Dockerfile           # Container configuration
│   └── README.md            # Finance app documentation
├── docs/                     # Project documentation
│   ├── SETUP.md             # Setup and configuration guide
│   ├── ARCHITECTURE.md      # System architecture
│   └── API.md               # API documentation
├── docker-compose.yml        # Multi-container setup
└── README.md                # This file
```

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| Main App | http://localhost:3000 | Authentication portal |
| HR App | http://localhost:3001 | HR management system |
| Finance App | http://localhost:3002 | Financial management system |
| Cognito Domain | https://auth.nttdata-cs.com | Authentication endpoint |
| Logout Redirect | https://demo.nttdata-cs.com | Post-logout landing |

## 🏗️ Architecture Overview

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Main App      │  │    HR App       │  │  Finance App    │
│   (Port 3000)   │  │   (Port 3001)   │  │   (Port 3002)   │
│                 │  │                 │  │                 │
│ - Auth Portal   │  │ - HR Dashboard  │  │ - Finance Dash  │
│ - App Launcher  │  │ - Employee Mgmt │  │ - Budget Mgmt   │
│ - User Profile  │  │ - Leave System  │  │ - Expense Track │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                 ┌─────────────────────────┐
                 │   AWS Cognito +         │
                 │   Microsoft AD          │
                 └─────────────────────────┘
```

## 🤝 Contributing

1. Read the [Setup Guide](./docs/SETUP.md) for development environment
2. Check [Architecture Documentation](./docs/ARCHITECTURE.md) for system design
3. Review [API Documentation](./docs/API.md) for integration details
4. Follow existing code patterns in each application

## 📄 License

This project is for demonstration purposes. See individual application licenses for details.