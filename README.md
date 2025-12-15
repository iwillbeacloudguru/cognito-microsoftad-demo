# Cognito MFA Demo - Code Documentation

A React-based web application demonstrating AWS Cognito authentication with TOTP MFA using amazon-cognito-identity-js.

## Features

- 🔐 AWS Cognito native authentication
- 🔑 TOTP MFA with Google Authenticator support
- 🎨 Modern, responsive UI with Tailwind CSS
- 🐳 Docker containerization
- 📱 Mobile-friendly interface
- ⚡ Real-time MFA management

## Tech Stack

- **Frontend**: React 19.2.1, Tailwind CSS 3.4.17
- **Authentication**: amazon-cognito-identity-js
- **MFA**: qrcode.react for QR code generation
- **Server**: Nginx (production)
- **Container**: Docker with multi-stage build

---

# Code Documentation

## 1. Main Application Component (`App.js`)

### State Management

```javascript
// Authentication State
const [user, setUser] = useState(null);           // Cognito user object
const [session, setSession] = useState(null);     // Cognito session with tokens
const [isLoading, setIsLoading] = useState(true); // Loading indicator
const [error, setError] = useState(null);         // Error handling
const [authStage, setAuthStage] = useState('idle'); // Authentication stage tracking

// MFA State
const [showTotpSetup, setShowTotpSetup] = useState(false);   // TOTP setup modal
const [totpSecret, setTotpSecret] = useState('');            // Generated TOTP secret
const [totpCode, setTotpCode] = useState('');                // User-entered TOTP code
const [showTotpVerify, setShowTotpVerify] = useState(false); // MFA verification modal
const [totpVerifyCode, setTotpVerifyCode] = useState('');    // MFA verification code
const [pendingMfaUser, setPendingMfaUser] = useState(null);  // User pending MFA verification

// UI State
const [showMfaSettings, setShowMfaSettings] = useState(false); // MFA settings page
const [username, setUsername] = useState('');                  // Login form username
const [password, setPassword] = useState('');                  // Login form password
```

### Session Management

```javascript
// Check for existing session on app load
useEffect(() => {
  checkCurrentSession();
}, []);

const checkCurrentSession = async () => {
  try {
    // Attempt to retrieve current Cognito session
    const { user: cognitoUser, session: cognitoSession } = await getCurrentSession();
    setUser(cognitoUser);           // Set authenticated user
    setSession(cognitoSession);     // Set session with tokens
    setAuthStage('authenticated');  // Update auth stage
  } catch (error) {
    setAuthStage('idle');          // No valid session, show login
  } finally {
    setIsLoading(false);           // Stop loading indicator
  }
};
```

### MFA Requirement Check

```javascript
// Monitor MFA device status and enforce MFA verification
useEffect(() => {
  if (user && session && hasTotpDevice !== undefined) {
    checkMfaRequired();
  }
}, [user, session, hasTotpDevice]);

const checkMfaRequired = () => {
  const mfaVerified = sessionStorage.getItem('mfa_verified');
  
  if (!hasTotpDevice) {
    // No MFA device registered - force setup
    setShowMfaSettings(true);
  } else if (!mfaVerified) {
    // MFA device exists but not verified this session
    setShowTotpVerify(true);
  }
  // If both conditions pass, user can access the app
};
```

### Authentication Functions

```javascript
// Handle user sign-in with username/password
const handleSignIn = async (e) => {
  e.preventDefault();
  if (!username || !password) {
    alert('Please enter username and password');
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const result = await signIn(username, password);
    
    if (result.totpRequired || result.mfaRequired) {
      // MFA challenge required
      setPendingMfaUser(result.user);
      setShowTotpVerify(true);
    } else {
      // Direct authentication success
      setUser(result.user);
      setSession(result.session);
      setAuthStage('authenticated');
    }
  } catch (error) {
    setError(error);
  } finally {
    setIsLoading(false);
  }
};

// Verify TOTP code during login MFA challenge
const verifyTotpLogin = async () => {
  if (totpVerifyCode.length !== 6) {
    alert('Please enter a 6-digit code');
    return;
  }

  try {
    // Submit TOTP code to complete authentication
    const session = await verifyTotpCode(pendingMfaUser, totpVerifyCode);
    setSession(session);
    setUser(pendingMfaUser);
    setPendingMfaUser(null);
    sessionStorage.setItem('mfa_verified', 'true');
    setShowTotpVerify(false);
    setTotpVerifyCode('');
    setAuthStage('authenticated');
  } catch (error) {
    alert('Invalid TOTP code. Please try again.');
  }
};

// Sign out user and clear session
const handleSignOut = async () => {
  try {
    await globalSignOut();         // Global sign out from all devices
    setUser(null);
    setSession(null);
    setAuthStage('idle');
    sessionStorage.removeItem('mfa_verified');
  } catch (error) {
    console.error('Sign out error:', error);
    signOut();                     // Fallback to local sign out
    setUser(null);
    setSession(null);
    setAuthStage('idle');
  }
};
```

### TOTP MFA Setup

```javascript
// Initialize TOTP setup process
const setupTotp = async () => {
  try {
    // Request TOTP secret from Cognito
    const result = await setupMFA(user?.getUsername());
    setTotpSecret(result.secretCode);  // Store secret for QR code generation
    setShowTotpSetup(true);            // Show setup modal
  } catch (error) {
    console.error('Failed to setup MFA:', error);
    alert('Failed to setup MFA. Please try again.');
  }
};

// Verify and register TOTP device
const verifyAndRegisterTotp = async () => {
  if (totpCode.length !== 6) {
    alert('Please enter a 6-digit code');
    return;
  }

  try {
    // Verify TOTP code with Cognito
    await verifyMFASetup(user?.getUsername(), totpCode);
    // Set TOTP as preferred MFA method
    await setMFAPreference(user?.getUsername(), true);
    
    // Update UI state
    setShowTotpSetup(false);
    setTotpCode('');
    loadMfaOptions();              // Refresh MFA status
    setMfaInfo({
      enabled: true,
      method: 'totp',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to verify TOTP:', error);
    alert('Invalid code. Please try again.');
  }
};
```

## 2. API Layer (`api.js`)

### Cognito Configuration

```javascript
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';

// Initialize Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: 'ap-southeast-1_gYsQnwNf1',  // AWS Cognito User Pool ID
  ClientId: '5tai0tc43qpu5fq4l8hukmh9q3'    // App Client ID
});
```

### Authentication Functions

```javascript
// Sign in with username and password
export const signIn = async (username, password) => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        resolve({ user: cognitoUser, session });
      },
      onFailure: (err) => {
        reject(err);
      },
      totpRequired: (codeDeliveryDetails) => {
        // TOTP MFA challenge required
        resolve({ user: cognitoUser, totpRequired: true, codeDeliveryDetails });
      },
      mfaRequired: (challengeName, challengeParameters) => {
        // Other MFA challenge required
        resolve({ user: cognitoUser, mfaRequired: true, challengeName, challengeParameters });
      }
    });
  });
};

// Verify TOTP code during authentication
export const verifyTotpCode = async (cognitoUser, totpCode) => {
  return new Promise((resolve, reject) => {
    cognitoUser.sendMFACode(totpCode, {
      onSuccess: (session) => {
        resolve(session);  // Return authenticated session
      },
      onFailure: (err) => {
        reject(err);
      }
    });
  });
};

// Get current authenticated user
export const getCurrentUser = () => {
  return userPool.getCurrentUser();
};

// Get current session with token refresh
export const getCurrentSession = async () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCurrentUser();
    if (!cognitoUser) {
      reject(new Error('No current user'));
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err) {
        reject(err);
      } else {
        resolve({ user: cognitoUser, session });
      }
    });
  });
};
```

### MFA Management Functions

```javascript
// Setup TOTP MFA device
export const setupMFA = async (username) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });

    cognitoUser.associateSoftwareToken({
      onSuccess: (result) => {
        resolve(result);
      },
      onFailure: (err) => {
        reject(err);
      },
      associateSecretCode: (secretCode) => {
        // Return the secret code for QR generation
        resolve({ secretCode });
      }
    });
  });
};

// Verify TOTP setup with code
export const verifyMFASetup = async (username, totpCode) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });

    cognitoUser.verifySoftwareToken(totpCode, 'TOTP Device', {
      onSuccess: (result) => {
        resolve(result);
      },
      onFailure: (err) => {
        reject(err);
      }
    });
  });
};

// Set MFA preferences
export const setMFAPreference = async (username, totpEnabled = true) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });

    const mfaSettings = {
      SMSMfaSettings: {
        Enabled: false,
        PreferredMfa: false
      },
      SoftwareTokenMfaSettings: {
        Enabled: totpEnabled,
        PreferredMfa: totpEnabled
      }
    };

    cognitoUser.setUserMfaPreference(mfaSettings, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
```

## 3. Custom Hooks (`hooks/useMfa.js`)

```javascript
import { useState, useEffect } from 'react';
import { getMFAOptions } from '../api';

// Custom hook for MFA state management
export const useMfa = (username) => {
  const [mfaOptions, setMfaOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user's MFA options from Cognito
  const loadMfaOptions = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const options = await getMFAOptions(username);
      setMfaOptions(options || []);
    } catch (error) {
      console.error('Failed to load MFA options:', error);
      setMfaOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has TOTP device registered
  const hasTotpDevice = mfaOptions.some(option => 
    option.DeliveryMedium === 'SOFTWARE_TOKEN_MFA' || 
    option.AttributeName === 'SOFTWARE_TOKEN_MFA'
  );

  // Load MFA options when username changes
  useEffect(() => {
    loadMfaOptions();
  }, [username]);

  return {
    mfaOptions,
    loading,
    hasTotpDevice,
    loadMfaOptions
  };
};
```

## 4. Utility Functions

### TOTP URI Generation (`utils/totp.js`)

```javascript
// Generate TOTP URI for QR code
export const getTotpUri = (secret, email, issuer = 'CognitoMFADemo') => {
  return `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
};
```

### Logger Setup (`utils/logger.js`)

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Send logs to backend for Docker visibility
const sendLog = (level, message) => {
  fetch(`${API_URL.replace('/v2', '')}/api/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, timestamp: new Date().toISOString() })
  }).catch(() => {});
};

// Override console methods to send logs to backend
export const setupLogger = () => {
  const originalConsole = { ...console };
  
  console.log = (...args) => {
    originalConsole.log(...args);
    sendLog('log', args.join(' '));
  };
  
  console.error = (...args) => {
    originalConsole.error(...args);
    sendLog('error', args.join(' '));
  };
};
```

## 5. Reusable Components

### Modal Component (`components/Modal.js`)

```javascript
// Reusable modal component with overlay
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        {/* Modal Content */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Authentication Flow

1. **App Initialization**: Check for existing Cognito session
2. **Login Form**: Username/password authentication
3. **MFA Challenge**: TOTP verification if required
4. **MFA Setup**: Force TOTP registration if not configured
5. **Session Management**: Token refresh and validation
6. **Sign Out**: Global or local session termination

## Security Features

- **Session Validation**: Automatic token refresh
- **MFA Enforcement**: Required TOTP verification
- **Secure Storage**: Cognito handles token storage
- **Global Sign Out**: Terminates all device sessions
- **Error Handling**: Graceful authentication failures

## Prerequisites

- Node.js 18+
- AWS Cognito User Pool with TOTP MFA enabled
- Docker (for containerized deployment)

## Environment Configuration

### 1. Copy Environment Files

```bash
# Root configuration (Docker Compose)
cp .env.example .env

# Frontend configuration
cp sample-app/.env.example sample-app/.env
```

### 2. Update Environment Variables

Edit `.env` file with your AWS Cognito configuration:

```env
# Docker Compose Environment Variables
POSTGRES_DB=mfa_demo
POSTGRES_USER=mfa_user
POSTGRES_PASSWORD=your-secure-password

# Frontend Environment
REACT_APP_COGNITO_USER_POOL_ID=your-user-pool-id
REACT_APP_COGNITO_CLIENT_ID=your-client-id
REACT_APP_API_URL=http://localhost:4000/v2
REACT_APP_TOTP_ISSUER=YourAppName
```

### 3. AWS Cognito Setup

**Required Cognito Configuration:**
- User Pool with TOTP MFA enabled
- App Client with authentication flows:
  - `ALLOW_USER_SRP_AUTH`
  - `ALLOW_REFRESH_TOKEN_AUTH`
  - `ALLOW_USER_PASSWORD_AUTH`
- OAuth scopes: `aws.cognito.signin.user.admin`

## Local Development

```bash
cd sample-app
npm install
npm start
```

## Docker Deployment

```bash
./docker.sh
```

## Environment Variables Reference

### Frontend Variables (REACT_APP_*)

| Variable | Description | Example |
|----------|-------------|----------|
| `REACT_APP_COGNITO_USER_POOL_ID` | AWS Cognito User Pool ID | `us-east-1_ABC123DEF` |
| `REACT_APP_COGNITO_CLIENT_ID` | Cognito App Client ID | `1a2b3c4d5e6f7g8h9i0j` |
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:4000/v2` |
| `REACT_APP_TOTP_ISSUER` | TOTP QR Code Issuer Name | `MyApp` |

### Backend Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `PORT` | Backend server port | `4000` |
| `DB_HOST` | PostgreSQL host | `postgres` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `mfa_demo` |
| `DB_USER` | Database user | `mfa_user` |
| `DB_PASSWORD` | Database password | `mfa_password` |

## Configuration Examples

### Development Environment
```env
REACT_APP_API_URL=http://localhost:4000/v2
REACT_APP_TOTP_ISSUER=DevApp
```

### Production Environment
```env
REACT_APP_API_URL=https://api.yourdomain.com/v2
REACT_APP_TOTP_ISSUER=YourProductionApp
POSTGRES_PASSWORD=secure-production-password
```

### Docker Environment Variables

The `docker-compose.yml` automatically uses variables from `.env`:

```yaml
services:
  postgres:
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  
  app:
    environment:
      - REACT_APP_COGNITO_USER_POOL_ID=${REACT_APP_COGNITO_USER_POOL_ID}
      - REACT_APP_COGNITO_CLIENT_ID=${REACT_APP_COGNITO_CLIENT_ID}
      - REACT_APP_API_URL=${REACT_APP_API_URL}
      - REACT_APP_TOTP_ISSUER=${REACT_APP_TOTP_ISSUER}
```

## Troubleshooting

**Environment Variables Not Loading:**
- Ensure `.env` files are in correct locations
- Restart development server after changing variables
- Check variable names start with `REACT_APP_` for frontend

**Cognito Authentication Errors:**
- Verify User Pool ID and Client ID are correct
- Ensure App Client has required authentication flows enabled
- Check OAuth scopes include `aws.cognito.signin.user.admin`

**Docker Issues:**
- Run `docker-compose down && docker-compose up --build` to rebuild with new environment variables
- Check `.env` file exists in root directory

## License

NTT DATA - Internal Use
