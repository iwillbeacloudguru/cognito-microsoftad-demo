# API Documentation

## Overview

The Cognito Microsoft AD Demo system uses AWS Cognito for authentication and provides REST APIs for application functionality.

## Authentication

All API requests require a valid JWT token obtained from AWS Cognito.

### Token Usage

```javascript
// Include in Authorization header
Authorization: Bearer <jwt-token>

// Or as query parameter
?access_token=<jwt-token>
```

## Base URLs

- **Development**: `http://localhost:4000/v2`
- **Production**: Configure via `REACT_APP_API_ENDPOINT`

## Endpoints

### Authentication Endpoints

#### Get User Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "groups": ["hr-users", "admin-group"],
  "name": "John Doe",
  "preferred_username": "john.doe"
}
```

#### Validate Token
```http
POST /auth/validate
Content-Type: application/json

{
  "token": "jwt-token-string"
}
```

**Response:**
```json
{
  "valid": true,
  "expires": "2024-01-01T12:00:00Z",
  "groups": ["hr-users"]
}
```

### MFA Endpoints

#### Setup TOTP
```http
POST /mfa/setup
Authorization: Bearer <token>
Content-Type: application/json

{
  "issuer": "Demo App"
}
```

**Response:**
```json
{
  "secret": "base32-secret",
  "qr_code": "data:image/png;base64,..."
}
```

#### Verify TOTP
```http
POST /mfa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

**Response:**
```json
{
  "valid": true,
  "backup_codes": ["code1", "code2"]
}
```

### HR App Endpoints

#### Get Employees
```http
GET /hr/employees
Authorization: Bearer <token>
```

**Response:**
```json
{
  "employees": [
    {
      "id": "emp-001",
      "name": "John Doe",
      "email": "john@company.com",
      "department": "Engineering",
      "status": "active"
    }
  ]
}
```

#### Submit Leave Request
```http
POST /hr/leave
Authorization: Bearer <token>
Content-Type: application/json

{
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "type": "vacation",
  "reason": "Family vacation"
}
```

**Response:**
```json
{
  "request_id": "leave-001",
  "status": "pending",
  "submitted_at": "2024-01-01T10:00:00Z"
}
```

## Error Responses

### Authentication Errors

```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token",
  "code": 401
}
```

### Authorization Errors

```json
{
  "error": "forbidden", 
  "message": "Insufficient permissions for this resource",
  "code": 403
}
```

### Validation Errors

```json
{
  "error": "validation_failed",
  "message": "Invalid request data",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  },
  "code": 400
}
```

## Rate Limiting

- **Authentication endpoints**: 10 requests per minute
- **MFA endpoints**: 5 requests per minute  
- **General endpoints**: 100 requests per minute

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## CORS Configuration

Allowed origins:
- `http://localhost:3000` (Main App)
- `http://localhost:3001` (HR App)
- Production domains (configured via environment)

## WebSocket Events (Future)

### Real-time Notifications

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:4000/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'jwt-token'
}));

// Listen for events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle notification
};
```

## SDK Usage

### JavaScript/TypeScript

```javascript
import { CognitoAuth } from './auth';

const auth = new CognitoAuth({
  userPoolId: 'us-east-1_xxxxxxxxx',
  clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
  domain: 'https://auth.nttdata-cs.com'
});

// Get authenticated user
const user = await auth.getCurrentUser();

// Make API call
const response = await fetch('/api/hr/employees', {
  headers: {
    'Authorization': `Bearer ${user.token}`
  }
});
```

## Testing

### Postman Collection

Import the provided Postman collection for testing:
- Authentication flows
- API endpoints
- Error scenarios

### cURL Examples

```bash
# Get user profile
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/v2/auth/profile

# Submit leave request
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2024-01-15","end_date":"2024-01-20","type":"vacation"}' \
  http://localhost:4000/v2/hr/leave
```