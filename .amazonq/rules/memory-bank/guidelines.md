# Development Guidelines

## Code Quality Standards

### Formatting Conventions
- **Indentation**: 2 spaces for JavaScript/JSX files
- **Semicolons**: Consistently used at statement ends
- **Quotes**: Single quotes for strings, double quotes for JSX attributes
- **Line Length**: Reasonable line breaks for readability
- **Whitespace**: Blank lines separate logical code blocks

### Naming Conventions
- **Variables/Functions**: camelCase (e.g., `totpSecret`, `registerPasskey`, `loadMfaDevices`)
- **Components**: PascalCase (e.g., `MfaSettings`, `MfaCrud`, `App`)
- **Constants**: UPPERCASE with underscores (e.g., `API_URL`, `PORT`)
- **Database Fields**: snake_case (e.g., `user_email`, `device_type`, `totp_secret`)
- **Boolean Variables**: Prefixed with `is`, `has`, `show` (e.g., `isAuthenticated`, `hasPasskey`, `showTotpSetup`)

### File Organization
- One component per file
- Component name matches filename
- Related utilities grouped in dedicated files (e.g., `api.js`)
- CSS imports at top of component files

## React Patterns

### Component Structure
```javascript
// 1. Imports
import { useState, useEffect } from 'react';
import { externalLibrary } from 'library';
import { internalUtil } from './utils';

// 2. Component Definition
function ComponentName({ prop1, prop2 }) {
  // 3. State Declarations
  const [state, setState] = useState(initialValue);
  
  // 4. Effects
  useEffect(() => {
    // effect logic
  }, [dependencies]);
  
  // 5. Event Handlers
  const handleAction = async () => {
    // handler logic
  };
  
  // 6. Render Logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// 7. Export
export default ComponentName;
```

### Hooks Usage
- **useState**: For local component state management
- **useEffect**: For side effects, API calls, and initialization
- **Custom Hooks**: Use `useAuth()` from react-oidc-context for authentication state
- **Dependency Arrays**: Always specify dependencies in useEffect

### State Management Patterns
- Multiple useState calls for independent state pieces
- Boolean flags for UI state (modals, loading, visibility)
- localStorage for client-side persistence (MFA registration status)
- Lift state up when shared between components

### Conditional Rendering
```javascript
// Early returns for loading/error states
if (auth.isLoading) {
  return <LoadingView />;
}

if (auth.error) {
  return <ErrorView />;
}

// Ternary for inline conditions
{totpRegistered ? <RemoveButton /> : <SetupButton />}

// Logical AND for conditional display
{mfaVerified && <VerificationBadge />}
```

## API Integration Patterns

### Centralized API Client
- All API calls abstracted in `api.js`
- Named exports for each endpoint function
- Consistent error handling approach
- Environment-based URL configuration

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const functionName = async (params) => {
  const response = await fetch(`${API_URL}/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};
```

### Error Handling
- Try-catch blocks for async operations
- Console.error for logging failures
- User-friendly alerts for critical errors
- Graceful degradation when backend unavailable

```javascript
try {
  await apiCall();
} catch (error) {
  console.error('Failed to perform action:', error);
  // Optional: alert user or update UI state
}
```

## Backend Patterns (Express)

### Route Structure
- RESTful endpoint design
- Consistent HTTP methods (GET, POST, PUT, DELETE)
- Descriptive route paths
- Proper status codes in responses

```javascript
// Create/Update
app.post('/api/resource', async (req, res) => { /* ... */ });

// Read
app.get('/api/resource/:id', async (req, res) => { /* ... */ });

// Update
app.put('/api/resource/:id', async (req, res) => { /* ... */ });

// Delete (soft delete pattern)
app.delete('/api/resource/:id', async (req, res) => {
  await pool.query('UPDATE table SET is_active = false WHERE id = $1', [id]);
  res.json({ message: 'Resource removed' });
});
```

### Database Patterns
- PostgreSQL with pg Pool for connection management
- Parameterized queries to prevent SQL injection
- Soft deletes using `is_active` flag
- Timestamps for audit trails (`created_at`, `last_used_at`)
- ON CONFLICT for upsert operations

```javascript
const result = await pool.query(
  'INSERT INTO table (col1, col2) VALUES ($1, $2) ON CONFLICT (col1) DO UPDATE SET col2 = $2 RETURNING *',
  [value1, value2]
);
```

### Middleware Configuration
- CORS enabled for cross-origin requests
- body-parser for JSON request parsing
- dotenv for environment variables
- Error responses with consistent structure

## Authentication & Security Patterns

### OIDC Integration
- react-oidc-context provider wraps entire app
- useAuth hook for accessing auth state
- Automatic token management
- Redirect-based authentication flow

```javascript
const auth = useAuth();

// Check authentication status
if (auth.isAuthenticated) {
  // Access user profile
  const email = auth.user?.profile?.email;
  const token = auth.user?.id_token;
}

// Trigger sign-in
auth.signinRedirect();

// Sign out
auth.removeUser();
```

### MFA Implementation Patterns

#### TOTP (Time-based One-Time Password)
- Client-side secret generation (32-character base32)
- QR code generation with `qrcode.react`
- HMAC-SHA1 algorithm for code generation
- 30-second time window
- 6-digit codes

```javascript
const generateTotpSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};
```

#### WebAuthn/Passkeys
- Feature detection before registration
- Platform authenticator preference
- Challenge-based authentication
- Credential ID storage for future authentication

```javascript
const passkeySupported = window.PublicKeyCredential !== undefined && 
                         navigator.credentials !== undefined;

const credential = await navigator.credentials.create({
  publicKey: publicKeyCredentialCreationOptions
});
```

### Token Handling
- JWT tokens decoded for MFA status detection
- AMR (Authentication Methods References) claim inspection
- Token display for demo purposes (avoid in production)

## UI/UX Patterns

### Tailwind CSS Conventions
- Utility-first approach
- Gradient backgrounds: `bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500`
- Rounded corners: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Shadows: `shadow-2xl` for elevated cards
- Hover effects: `hover:bg-color`, `hover:-translate-y-0.5`
- Transitions: `transition-all duration-200`

### Component Styling Patterns
```javascript
// Card container
<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">

// Button primary
<button className="bg-indigo-500 text-white py-3 rounded-lg font-medium hover:bg-indigo-600 transition-colors">

// Status badge
<span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">

// Modal overlay
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
```

### Modal Pattern
- Fixed overlay with semi-transparent background
- Centered modal with max-width constraint
- Action buttons in flex layout
- Cancel/close functionality

### Loading States
- Spinner with descriptive text
- Stage-based messaging (authenticating, verifying MFA)
- Full-screen loading overlays

### Form Inputs
- Controlled components with onChange handlers
- Input validation (e.g., 6-digit code length check)
- Placeholder text for guidance
- Disabled states for incomplete inputs

## Code Idioms

### Async/Await Pattern
- Prefer async/await over promise chains
- Always use try-catch for error handling
- Return early from async functions when appropriate

### Array Methods
- `.map()` for rendering lists
- `.filter()` for conditional filtering
- `.find()` for single item lookup
- `.some()` for existence checks

```javascript
const hasTOTP = devices.some(d => d.device_type === 'totp' && d.is_active);
const totpDevice = devices.find(d => d.device_type === 'totp' && d.is_active);
```

### Optional Chaining
- Use `?.` for safe property access
- Common with user profile data: `auth.user?.profile?.email`

### Nullish Coalescing
- Use `||` for default values: `process.env.PORT || 4000`

### Template Literals
- For string interpolation: `` `${API_URL}/endpoint` ``
- For multi-line strings

## Testing Considerations
- Testing library setup included (@testing-library/react)
- Component testing with user-event simulation
- Jest DOM matchers for assertions
- Test files co-located with components (*.test.js)

## Environment Configuration
- Frontend: Environment variables prefixed with `REACT_APP_`
- Backend: dotenv for .env file loading
- Fallback defaults for local development
- Docker environment variables in docker-compose.yml

## Documentation Standards
- Inline comments for complex logic (TOTP generation, WebAuthn)
- User-facing text with emoji for visual clarity
- README with comprehensive setup instructions
- API endpoint documentation in comments

## Common Annotations & Metadata
- `// 1. Section Label` for code organization
- `/* ... */` for multi-line explanations
- JSDoc-style comments for complex functions (when needed)
- TODO comments for future improvements (if applicable)
