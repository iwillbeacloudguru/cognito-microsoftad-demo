export const getTotpUri = (secret, email, issuer = process.env.REACT_APP_TOTP_ISSUER || 'CognitoMFADemo') => {
  return `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
};