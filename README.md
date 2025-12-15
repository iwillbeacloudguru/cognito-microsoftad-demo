# Cognito Microsoft AD Demo

A React application demonstrating AWS Cognito integration with Microsoft Active Directory using OIDC authentication.

## Features

- AWS Cognito User Pool integration
- Microsoft Active Directory authentication
- OIDC-based sign-in/sign-out flow
- Custom domain support
- Token display (ID, Access, Refresh)

## Tech Stack

- **Frontend**: React Router v7
- **Authentication**: AWS Cognito + OIDC
- **Libraries**: `react-oidc-context`, `oidc-client-ts`
- **Containerization**: Docker

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (optional)
- AWS Cognito User Pool configured with Microsoft AD

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd cognito-microsoftad-demo
```

2. Install dependencies
```bash
cd main-app
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your Cognito settings
```

### Development

```bash
# Run locally
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build and run with Docker
./docker-run.sh
```

## Configuration

### Cognito Settings

Update `app/root.tsx` with your Cognito configuration:

```typescript
const cognitoAuthConfig = {
  authority: "https://cognito-idp.region.amazonaws.com/user-pool-id",
  client_id: "your-client-id",
  redirect_uri: "https://your-domain.com/callback",
  // ... other settings
};
```

### Required Cognito App Client Settings

- **Callback URLs**: `https://your-domain.com/callback`
- **Sign-out URLs**: `https://your-domain.com`
- **Allowed OAuth Flows**: Authorization code grant
- **Allowed OAuth Scopes**: `openid`, `email`, `aws.cognito.signin.user.admin`

## Project Structure

```
main-app/
├── app/
│   ├── routes/
│   │   ├── home.tsx          # Main authentication page
│   │   └── callback.tsx      # OIDC callback handler
│   ├── root.tsx              # App root with AuthProvider
│   └── routes.ts             # Route configuration
├── Dockerfile                # Multi-stage Docker build
└── package.json              # Dependencies
```

## Authentication Flow

1. User clicks "Sign in" button
2. Redirects to Cognito/Microsoft AD login
3. After authentication, returns to `/callback`
4. Callback processes tokens and redirects to home
5. User sees profile information and tokens
6. "Sign out" clears session and redirects to logout

## Troubleshooting

### Common Issues

- **CORS errors**: Verify authority URL points to correct Cognito endpoint
- **Redirect mismatch**: Ensure callback URL is configured in Cognito app client
- **State errors**: Clear browser storage and try again

### Error Handling

The app includes automatic error recovery for:
- Stale authentication state
- Missing OIDC state parameters
- Network connectivity issues

## Environment Variables

```bash
# Cognito Configuration
REACT_APP_COGNITO_USER_POOL_ID=your-user-pool-id
REACT_APP_COGNITO_CLIENT_ID=your-client-id
REACT_APP_COGNITO_DOMAIN=https://your-custom-domain.com
```

## License

MIT License