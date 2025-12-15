import { useState, useEffect } from 'react';
import { getMFAOptions } from '../api';

export const useMfa = (user) => {
  const [mfaOptions, setMfaOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMfaOptions = async () => {
    if (!user) return;
    
    const username = typeof user === 'string' ? user : user.getUsername();
    if (!username) return;
    
    setLoading(true);
    try {
      if (user.isFederated) {
        // For federated users, assume no MFA initially (will be set up via app)
        setMfaOptions([]);
      } else {
        const options = await getMFAOptions(username);
        setMfaOptions(options || []);
      }
    } catch (error) {
      console.error('Failed to load MFA options:', error);
      setMfaOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasTotpDevice = user?.isFederated 
    ? (() => {
        const mfaData = localStorage.getItem(`mfa_${user.getUsername()}`);
        return mfaData ? JSON.parse(mfaData).enabled : false;
      })()
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