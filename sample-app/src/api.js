const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const createUser = async (email, cognitoSub) => {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, cognito_sub: cognitoSub }),
  });
  return response.json();
};

export const registerMfaDevice = async (userEmail, deviceType, deviceName, totpSecret, passkeyCredentialId) => {
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
  const response = await fetch(`${API_URL}/mfa/${email}`);
  return response.json();
};

export const updateMfaUsed = async (deviceId) => {
  const response = await fetch(`${API_URL}/mfa/${deviceId}/used`, {
    method: 'PUT',
  });
  return response.json();
};

export const deleteMfaDevice = async (deviceId) => {
  const response = await fetch(`${API_URL}/mfa/${deviceId}`, {
    method: 'DELETE',
  });
  return response.json();
};
