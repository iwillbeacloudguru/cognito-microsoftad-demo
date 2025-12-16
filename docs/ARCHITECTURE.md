# System Architecture

## Overview

The Cognito Microsoft AD Demo is a multi-application system demonstrating enterprise authentication patterns using AWS Cognito integrated with Microsoft Active Directory.

## Architecture Diagram

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

## Components

### Authentication Layer
- **AWS Cognito User Pool**: Central identity provider
- **Microsoft AD Integration**: OIDC federation
- **TOTP MFA**: Multi-factor authentication
- **JWT Tokens**: Secure session management

### Application Layer
- **Main App**: Authentication portal and launcher
- **HR App**: Specialized HR management system
- **Future Apps**: Extensible architecture for additional applications

### Infrastructure
- **Docker Compose**: Container orchestration
- **PostgreSQL**: Database for MFA demo data
- **React Router**: SSR-enabled frontend framework

## Security Model

### Authentication Flow
1. User accesses application
2. Redirected to Cognito hosted UI
3. Microsoft AD authentication via OIDC
4. MFA challenge (if enabled)
5. JWT token issued
6. Application access granted

### Authorization
- **Group-based Access Control**: Users assigned to groups
- **Application-level Permissions**: Each app validates user groups
- **Token Validation**: JWT tokens verified on each request

## Data Flow

### User Authentication
```
User → Main App → Cognito → Microsoft AD → MFA → JWT Token → Application Access
```

### Inter-Application Navigation
```
Main App → Group Validation → Application Redirect → Target App → Access Control
```

## Scalability Considerations

- **Microservices Architecture**: Each app is independently deployable
- **Stateless Design**: JWT tokens eliminate server-side sessions
- **Container-based**: Easy horizontal scaling with Docker
- **CDN-ready**: Static assets can be served from CDN

## Technology Stack

### Frontend
- React Router v7 (SSR)
- TypeScript
- TailwindCSS
- OIDC Client

### Backend Services
- AWS Cognito
- Microsoft Active Directory
- PostgreSQL

### Infrastructure
- Docker & Docker Compose
- Node.js runtime
- Vite build system