# Cognito Microsoft AD MFA Demo

A React-based web application demonstrating authentication using AWS Cognito with OpenID Connect (OIDC) and Microsoft Active Directory integration with multiple MFA options.

## Features

- 🔐 AWS Cognito authentication with OIDC
- 🏢 Microsoft Active Directory integration
- 🔑 Multiple MFA options:
  - 📱 Virtual MFA (TOTP) - Google Authenticator, Microsoft Authenticator, Authy
  - 🔒 WebAuthn/Passkeys - Biometric authentication (Face ID, Touch ID, Windows Hello)
  - 💬 SMS MFA (via Cognito)
- 🎨 Modern, responsive UI with Tailwind CSS
- 🐳 Docker containerization with Nginx
- 🔄 OAuth 2.0 authorization code flow
- 📱 Mobile-friendly interface
- ⚡ Real-time MFA status detection

## Tech Stack

- **Frontend**: React 19.2.1, Tailwind CSS 3.4.17
- **Authentication**: react-oidc-context, oidc-client-ts
- **MFA**: qrcode.react, WebAuthn API
- **Server**: Nginx (production)
- **Container**: Docker with multi-stage build

## Prerequisites

- Node.js 18+ (for local development)
- Docker (for containerized deployment)
- AWS Cognito User Pool configured with Microsoft AD

## Configuration

### OIDC Configuration

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

### AWS Cognito Setup

1. **User Pool Configuration:**
   - Enable Microsoft AD as identity provider
   - Configure MFA settings (Optional or Required)
   - Enable TOTP software token MFA
   - Enable SMS MFA (optional)

2. **App Client Settings:**
   - Enable Authorization code grant
   - Set callback URLs
   - Configure OAuth scopes: `email`, `openid`

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

## MFA Options

### 1. Virtual MFA (TOTP)

**Setup Process:**
1. Sign in with Cognito
2. Click "Setup Authenticator" button
3. Scan QR code with authenticator app:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - 1Password
   - Any TOTP-compatible app
4. Enter 6-digit verification code
5. MFA is now enabled

**Features:**
- QR code generation for easy setup
- Manual secret key entry option
- Time-based one-time passwords (TOTP)
- Works offline

### 2. WebAuthn/Passkeys

**Setup Process:**
1. Sign in with Cognito
2. Click "Register Passkey" button
3. Follow browser prompt for biometric authentication
4. Passkey is registered

**Supported Methods:**
- Face ID (iOS/macOS)
- Touch ID (iOS/macOS)
- Windows Hello
- Fingerprint sensors
- Hardware security keys (YubiKey, etc.)

**Features:**
- Passwordless authentication
- Biometric verification
- Platform authenticator support
- Enhanced security

### 3. SMS MFA (Cognito-managed)

- Configured at AWS Cognito User Pool level
- Automatic SMS delivery
- No client-side setup required

## Authentication Flow

1. User clicks "Sign In with Cognito"
2. Redirects to AWS Cognito hosted UI
3. Cognito authenticates via Microsoft AD
4. MFA challenge (if enabled):
   - SMS code entry (Cognito UI)
   - TOTP code entry (Cognito UI)
5. Redirects back with authorization code
6. App exchanges code for tokens
7. Optional: Register additional MFA methods (TOTP/Passkey)
8. Displays user info, tokens, and MFA status

## MFA Status Detection

The app automatically detects MFA status from:
- JWT token claims (`amr` field)
- Cognito user profile attributes
- Local storage (for client-side MFA)

**Supported MFA Methods:**
- `mfa` - Generic MFA
- `otp` - One-time password
- `sms` - SMS verification
- `totp` - Time-based OTP
- `passkey` - WebAuthn/Passkey

## Environment Variables

No environment variables required. Configuration is hardcoded in `index.js` and `App.js`.

For production, consider using environment variables:
- `REACT_APP_COGNITO_AUTHORITY`
- `REACT_APP_COGNITO_CLIENT_ID`
- `REACT_APP_REDIRECT_URI`

## Dependencies

```json
{
  "qrcode.react": "^4.1.0",
  "react-oidc-context": "^3.3.0",
  "oidc-client-ts": "^3.4.1",
  "tailwindcss": "^3.4.17"
}
```

## Security Notes

- Tokens are displayed for demo purposes only
- In production, never expose tokens in the UI
- Use HTTPS for all production deployments
- Configure proper CORS settings in Cognito
- TOTP secrets stored in localStorage (demo only)
- Passkey credentials use browser's secure storage
- Always verify TOTP codes server-side in production
- Implement rate limiting for MFA attempts

## Browser Compatibility

**WebAuthn/Passkeys:**
- Chrome 67+
- Firefox 60+
- Safari 13+
- Edge 18+

**TOTP (Virtual MFA):**
- All modern browsers

## Troubleshooting

**"Invalid scope" error:**
- Ensure Cognito app client has correct OAuth scopes enabled
- Use only `email openid` scopes

**Passkey registration fails:**
- Check browser compatibility
- Ensure HTTPS is enabled (required for WebAuthn)
- Verify platform authenticator is available

**TOTP not working:**
- Ensure device time is synchronized
- Check authenticator app is configured correctly
- Verify 6-digit code is entered correctly

## License

NTT DATA - Internal Use
