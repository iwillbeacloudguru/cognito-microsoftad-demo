# API Documentation

## Base URL

Configure in `.env` file:
```
REACT_APP_API_URL=https://api.nttdata-cs.com/v2
```

- **Production**: `https://api.nttdata-cs.com/v2`
- **Local Development**: `http://localhost:4000/v2`

## Endpoints

### 1. Create/Update User
**POST** `/api/users`

**Request Body:**
```json
{
  "email": "user@example.com",
  "cognito_sub": "cognito-user-id"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "cognito_sub": "cognito-user-id",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST https://api.nttdata-cs.com/v2/users \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","cognito_sub":"abc123"}'
```

---

### 2. Register MFA Device
**POST** `/api/mfa/register`

**Request Body:**
```json
{
  "user_email": "user@example.com",
  "device_type": "totp",
  "device_name": "Authenticator App",
  "totp_secret": "JBSWY3DPEHPK3PXP",
  "passkey_credential_id": null
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "device_type": "totp",
  "device_name": "Authenticator App",
  "totp_secret": "JBSWY3DPEHPK3PXP",
  "passkey_credential_id": null,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "last_used_at": null
}
```

**cURL Example:**
```bash
curl -X POST https://api.nttdata-cs.com/v2/mfa/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_email":"user@example.com",
    "device_type":"totp",
    "device_name":"Google Authenticator",
    "totp_secret":"JBSWY3DPEHPK3PXP",
    "passkey_credential_id":null
  }'
```

---

### 3. Get User MFA Devices
**GET** `/api/mfa/:email`

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "device_type": "totp",
    "device_name": "Authenticator App",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_used_at": "2024-01-02T00:00:00.000Z"
  }
]
```

**cURL Example:**
```bash
curl https://api.nttdata-cs.com/v2/mfa/user@example.com
```

---

### 4. Update MFA Device Name
**PUT** `/api/mfa/:id`

**Request Body:**
```json
{
  "device_name": "New Device Name"
}
```

**Response:**
```json
{
  "id": 1,
  "device_name": "New Device Name",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X PUT https://api.nttdata-cs.com/v2/mfa/1 \
  -H "Content-Type: application/json" \
  -d '{"device_name":"My Authenticator"}'
```

---

### 5. Update MFA Device Last Used
**PUT** `/api/mfa/:id/used`

**Response:**
```json
{
  "id": 1,
  "last_used_at": "2024-01-01T00:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X PUT https://api.nttdata-cs.com/v2/mfa/1/used
```

---

### 6. Delete MFA Device
**DELETE** `/api/mfa/:id`

**Response:**
```json
{
  "message": "MFA device removed"
}
```

**cURL Example:**
```bash
curl -X DELETE https://api.nttdata-cs.com/v2/mfa/1
```

---

## React Integration

Import API functions:
```javascript
import { 
  createUser, 
  registerMfaDevice, 
  getMfaDevices, 
  updateMfaUsed, 
  deleteMfaDevice 
} from './api';
```

**Usage Examples:**

```javascript
// Create user
await createUser('user@example.com', 'cognito-sub-123');

// Register TOTP
await registerMfaDevice(
  'user@example.com',
  'totp',
  'Google Authenticator',
  'JBSWY3DPEHPK3PXP',
  null
);

// Register Passkey
await registerMfaDevice(
  'user@example.com',
  'passkey',
  'Biometric Device',
  null,
  'credential-id-xyz'
);

// Get devices
const devices = await getMfaDevices('user@example.com');

// Update last used
await updateMfaUsed(1);

// Delete device
await deleteMfaDevice(1);
```

---

## Testing with Postman

1. Import collection from `postman_collection.json`
2. Set base URL: `https://api.nttdata-cs.com/v2`
3. Test all endpoints

---

## Error Responses

**404 Not Found:**
```json
{
  "error": "User not found"
}
```

**500 Server Error:**
```json
{
  "error": "Database connection failed"
}
```
