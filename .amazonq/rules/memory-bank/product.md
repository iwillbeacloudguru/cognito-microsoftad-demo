# Product Overview

## Purpose
A full-stack demonstration application showcasing enterprise authentication with AWS Cognito, Microsoft Active Directory integration, and comprehensive multi-factor authentication (MFA) options. Built for NTT DATA internal use to demonstrate secure authentication patterns.

## Value Proposition
- **Enterprise-Ready Authentication**: Production-grade integration with AWS Cognito and Microsoft AD
- **Multiple MFA Options**: Supports TOTP (Virtual MFA), WebAuthn/Passkeys, and SMS MFA
- **Modern Architecture**: React frontend with Node.js backend and PostgreSQL database
- **Container-Ready**: Full Docker Compose orchestration for easy deployment
- **OAuth 2.0 Compliant**: Implements authorization code flow with OIDC

## Key Features

### Authentication & Authorization
- AWS Cognito OIDC integration with hosted UI
- Microsoft Active Directory federation
- OAuth 2.0 authorization code flow
- JWT token management and validation
- Automatic MFA status detection from token claims

### Multi-Factor Authentication
- **Virtual MFA (TOTP)**: QR code generation for authenticator apps (Google Authenticator, Microsoft Authenticator, Authy)
- **WebAuthn/Passkeys**: Biometric authentication (Face ID, Touch ID, Windows Hello)
- **SMS MFA**: Cognito-managed SMS verification
- Real-time MFA status tracking and display

### User Experience
- Modern, responsive UI with Tailwind CSS
- Mobile-friendly interface
- Real-time token and user info display
- MFA setup wizards with QR codes
- Passkey registration flow

### Infrastructure
- Three-tier architecture: Frontend (React) + Backend (Node.js) + Database (PostgreSQL)
- Nginx reverse proxy for production
- Docker containerization with multi-stage builds
- Docker Compose orchestration
- Health checks and service dependencies

## Target Users
- **Enterprise Developers**: Learning AWS Cognito and Microsoft AD integration patterns
- **Security Engineers**: Evaluating MFA implementation strategies
- **Solution Architects**: Understanding OAuth 2.0 and OIDC flows
- **DevOps Teams**: Deploying containerized authentication solutions

## Use Cases
1. **Authentication Demo**: Showcase enterprise SSO with Microsoft AD
2. **MFA Evaluation**: Compare TOTP, WebAuthn, and SMS MFA approaches
3. **Training Material**: Teach OAuth 2.0 and OIDC implementation
4. **Proof of Concept**: Validate authentication architecture before production
5. **Integration Testing**: Test Cognito configuration and MFA flows
