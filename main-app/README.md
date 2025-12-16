# Main App - Authentication Portal

The main authentication application that serves as the entry point for the Cognito Microsoft AD Demo system.

## Overview

This application provides:
- AWS Cognito authentication with Microsoft AD integration
- Application launcher with group-based access control
- User profile and token display
- OIDC authentication flow

## Features

- 🔐 Microsoft Active Directory integration via AWS Cognito
- 🚀 Application launcher dashboard
- 👤 User profile management
- 🎫 JWT token display and validation
- 🔒 Group-based access control
- 📱 Responsive design with TailwindCSS

## Technology Stack

- **Framework**: React Router v7 with SSR
- **Authentication**: AWS Cognito + OIDC
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18+
- AWS Cognito User Pool configured with Microsoft AD

### Installation

```bash
cd main-app
npm install
```

### Development

```bash
npm run dev
```

Application runs on `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Configuration

Set up your Cognito configuration in the application:
- User Pool ID
- Client ID  
- Custom Domain
- Redirect URIs

## Access Control

- Open to all authenticated users
- Shows available applications based on user groups
- Redirects to appropriate applications based on permissions

## Docker Support

```bash
# Build image
docker build -t main-app .

# Run container
docker run -p 3000:3000 main-app
```

## Related Applications

- [HR App](../hr-app/README.md) - HR Management System
- [Project Root](../README.md) - Main project documentation