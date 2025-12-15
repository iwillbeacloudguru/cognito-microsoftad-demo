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
        // Check backend for federated user MFA
        const response = await fetch(`${process.env.REACT_APP_API_URL}/mfa/${encodeURIComponent(username)}`);
        if (response.ok) {
          const data = await response.json();
          setMfaOptions(data.devices || []);
        } else {
          setMfaOptions([]);
        }
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
    ? mfaOptions.some(option => option.device_type === 'totp' && option.is_active)
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