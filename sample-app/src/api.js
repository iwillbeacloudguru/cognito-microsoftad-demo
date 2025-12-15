import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID
});

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
        resolve({ user: cognitoUser, totpRequired: true, codeDeliveryDetails });
      },
      mfaRequired: (challengeName, challengeParameters) => {
        resolve({ user: cognitoUser, mfaRequired: true, challengeName, challengeParameters });
      }
    });
  });
};

export const verifyTotpCode = async (cognitoUser, totpCode) => {
  return new Promise((resolve, reject) => {
    cognitoUser.sendMFACode(totpCode, {
      onSuccess: (session) => {
        resolve(session);
      },
      onFailure: (err) => {
        reject(err);
      }
    });
  });
};

export const getCurrentUser = () => {
  return userPool.getCurrentUser();
};

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

export const signOut = () => {
  const cognitoUser = getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
};

export const globalSignOut = async () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCurrentUser();
    if (!cognitoUser) {
      resolve();
      return;
    }

    cognitoUser.globalSignOut({
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      }
    });
  });
};

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
        resolve({ secretCode });
      }
    });
  });
};

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

export const getMFAOptions = async (username) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });

    cognitoUser.getMFAOptions((err, mfaOptions) => {
      if (err) {
        reject(err);
      } else {
        resolve(mfaOptions);
      }
    });
  });
};

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
