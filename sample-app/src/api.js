const API_URL = process.env.REACT_APP_API_URL || 'https://api.nttdata-cs.com/api';

console.log('🔗 API URL:', API_URL);

export const createUser = async (email, cognitoSub) => {
  console.log('📤 API Call: POST /users', { email, cognitoSub });
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, cognito_sub: cognitoSub }),
  });
  return response.json();
};

export const registerMfaDevice = async (userEmail, deviceType, deviceName, totpSecret, passkeyCredentialId) => {
  console.log('📤 API Call: POST /mfa/register', { userEmail, deviceType, deviceName });
  const response = await fetch(`${API_URL}/mfa/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_email: userEmail,
      device_type: deviceType,
      device_name: deviceName,
      totp_secret: totpSecret,
      passkey_credential_id: passkeyCredentialId,
    }),
  });
  return response.json();
};

export const getMfaDevices = async (email) => {
  console.log('📤 API Call: GET /mfa/' + email);
  const response = await fetch(`${API_URL}/mfa/${email}`);
  return response.json();
};

export const updateMfaUsed = async (deviceId) => {
  console.log('📤 API Call: PUT /mfa/' + deviceId + '/used');
  const response = await fetch(`${API_URL}/mfa/${deviceId}/used`, {
    method: 'PUT',
  });
  return response.json();
};

export const deleteMfaDevice = async (deviceId) => {
  console.log('📤 API Call: DELETE /mfa/' + deviceId);
  const response = await fetch(`${API_URL}/mfa/${deviceId}`, {
    method: 'DELETE',
  });
  return response.json();
};
