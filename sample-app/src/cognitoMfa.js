import { CognitoIdentityProviderClient, AssociateSoftwareTokenCommand, VerifySoftwareTokenCommand, SetUserMFAPreferenceCommand, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({
  region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-1'
});

export const setupMFAForFederatedUser = async (accessToken) => {
  const command = new AssociateSoftwareTokenCommand({
    AccessToken: accessToken
  });
  
  const response = await client.send(command);
  return { secretCode: response.SecretCode };
};

export const verifyMFAForFederatedUser = async (accessToken, userCode) => {
  const command = new VerifySoftwareTokenCommand({
    AccessToken: accessToken,
    UserCode: userCode,
    FriendlyDeviceName: 'TOTP Device'
  });
  
  await client.send(command);
};

export const setMFAPreferenceForFederatedUser = async (accessToken) => {
  const command = new SetUserMFAPreferenceCommand({
    AccessToken: accessToken,
    SoftwareTokenMfaSettings: {
      Enabled: true,
      PreferredMfa: true
    }
  });
  
  await client.send(command);
};

export const getUserMFAStatus = async (accessToken) => {
  const command = new GetUserCommand({
    AccessToken: accessToken
  });
  
  const response = await client.send(command);
  return response.UserMFASettingList || [];
};