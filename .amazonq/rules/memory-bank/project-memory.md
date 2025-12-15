# Cognito Microsoft AD Demo - Memory Bank

## Project Overview
This is a demonstration project showcasing AWS Cognito integration with Microsoft Active Directory, featuring Multi-Factor Authentication (MFA) capabilities.

## Architecture Components
- **Frontend**: React application with Cognito authentication
- **Backend**: API server (port 4000)
- **Database**: PostgreSQL for MFA demo data
- **Authentication**: AWS Cognito User Pool with Microsoft AD integration
- **MFA**: TOTP (Time-based One-Time Password) implementation

## Environment Configuration
### Database Settings
- Database: `mfa_demo`
- User: `mfa_user`
- Password: Configured via environment variables

### Cognito Configuration
- User Pool ID: Set via `REACT_APP_COGNITO_USER_POOL_ID`
- Client ID: Set via `REACT_APP_COGNITO_CLIENT_ID`
- Custom Domain: Set via `REACT_APP_COGNITO_DOMAIN`
- API Endpoint: `http://localhost:4000/v2`
- TOTP Issuer: Configurable app name

## Key Technologies
- React (Frontend framework)
- AWS Cognito (Authentication service)
- PostgreSQL (Database)
- Docker Compose (Container orchestration)
- TOTP (Multi-factor authentication)

## Development Setup
1. Copy `.env.example` to `.env` and configure values
2. Set up Cognito User Pool with Microsoft AD integration
3. Configure database connection
4. Start services via Docker Compose

## Security Features
- Microsoft Active Directory integration
- Multi-factor authentication with TOTP
- Secure password handling
- Environment-based configuration

## API Structure
- Base URL: `http://localhost:4000/v2`
- Authentication via Cognito tokens
- MFA verification endpoints

## File Structure Notes
- Environment variables in `.env` (not tracked in git)
- Docker configuration for easy deployment
- Separate frontend and backend components
- Modular authentication system