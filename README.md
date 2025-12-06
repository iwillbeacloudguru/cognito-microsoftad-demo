# Cognito Microsoft AD MFA Demo

A React-based web application demonstrating authentication using AWS Cognito with OpenID Connect (OIDC) and Microsoft Active Directory integration with MFA support.

## Features

- 🔐 AWS Cognito authentication with OIDC
- 🏢 Microsoft Active Directory integration
- 🔑 Multi-Factor Authentication (MFA) support
- 🎨 Modern, responsive UI with gradient design
- 🐳 Docker containerization with Nginx
- 🔄 OAuth 2.0 authorization code flow
- 📱 Mobile-friendly interface

## Tech Stack

- **Frontend**: React 19.2.1, Bootstrap 5.3.8
- **Authentication**: react-oidc-context, oidc-client-ts
- **Server**: Nginx (production)
- **Container**: Docker with multi-stage build

## Prerequisites

- Node.js 18+ (for local development)
- Docker (for containerized deployment)
- AWS Cognito User Pool configured with Microsoft AD

## Configuration

Update the following in `sample-app/src/index.js`:

```javascript
const cognitoAuthConfig = {
  authority: "https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_gYsQnwNf1",
  client_id: "5tai0tc43qpu5fq4l8hukmh9q3",
  redirect_uri: "https://demo.nttdata-cs.com",
  response_type: "code",
  scope: "email openid",
};
```

## Local Development

```bash
cd sample-app
npm install
npm start
```

App runs at `http://localhost:3000`

## Docker Deployment

### Quick Start

```bash
chmod +x docker.sh
./docker.sh
```

### Manual Build

```bash
docker build -t sample-app .
docker run -d -p 3000:3000 --name sample-app-container sample-app
```

Access at `http://localhost:3000`

## Project Structure

```
.
├── sample-app/          # React application
│   ├── src/
│   │   ├── App.js      # Main component with auth logic
│   │   ├── App.css     # Custom styling
│   │   └── index.js    # OIDC configuration
│   └── package.json
├── Dockerfile          # Multi-stage Docker build
├── nginx.conf          # Nginx configuration
└── docker.sh           # Deployment script
```

## Authentication Flow

1. User clicks "Sign In with Cognito"
2. Redirects to AWS Cognito hosted UI
3. Cognito authenticates via Microsoft AD
4. MFA challenge (if enabled)
5. Redirects back with authorization code
6. App exchanges code for tokens
7. Displays user info and tokens

## Environment Variables

No environment variables required. Configuration is hardcoded in `index.js` and `App.js`.

For production, consider using environment variables:
- `REACT_APP_COGNITO_AUTHORITY`
- `REACT_APP_COGNITO_CLIENT_ID`
- `REACT_APP_REDIRECT_URI`

## Security Notes

- Tokens are displayed for demo purposes only
- In production, never expose tokens in the UI
- Use HTTPS for all production deployments
- Configure proper CORS settings in Cognito

## License

NTT DATA - Internal Use
