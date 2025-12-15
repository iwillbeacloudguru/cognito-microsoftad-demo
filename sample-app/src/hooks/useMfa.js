import { useState, useEffect } from 'react';
import { getMFAOptions } from '../api';

export const useMfa = (user, session) => {
  const [mfaOptions, setMfaOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMfaOptions = async () => {
    if (!user) return;
    
    const username = typeof user === 'string' ? user : user.getUsername();
    if (!username) return;
    
    setLoading(true);
    try {
      if (user.isFederated && session) {
        // Use AWS SDK for federated users
        const { getUserMFAStatus } = await import('../cognitoMfa');
        const accessToken = session.getAccessToken()?.getJwtToken();
        const mfaStatus = await getUserMFAStatus(accessToken);
        setMfaOptions(mfaStatus);
      } else if (!user.isFederated) {
        const options = await getMFAOptions(username);
        setMfaOptions(options || []);
      } else {
        setMfaOptions([]);
      }
    } catch (error) {
      console.error('Failed to load MFA options:', error);
      setMfaOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasTotpDevice = user?.isFederated 
    ? mfaOptions.includes('SOFTWARE_TOKEN_MFA')
    : mfaOptions.some(option => 
        option.DeliveryMedium === 'SOFTWARE_TOKEN_MFA' || 
        option.AttributeName === 'SOFTWARE_TOKEN_MFA'
      );

  useEffect(() => {
    loadMfaOptions();
  }, [user]);

  return {
    mfaOptions,
    loading,
    hasTotpDevice,
    loadMfaOptions
  };
};