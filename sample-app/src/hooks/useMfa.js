import { useState, useEffect } from 'react';
import { getMFAOptions } from '../api';

export const useMfa = (username) => {
  const [mfaOptions, setMfaOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMfaOptions = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const options = await getMFAOptions(username);
      setMfaOptions(options || []);
    } catch (error) {
      console.error('Failed to load MFA options:', error);
      setMfaOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasTotpDevice = mfaOptions.some(option => 
    option.DeliveryMedium === 'SOFTWARE_TOKEN_MFA' || 
    option.AttributeName === 'SOFTWARE_TOKEN_MFA'
  );

  useEffect(() => {
    loadMfaOptions();
  }, [username]);

  return {
    mfaOptions,
    loading,
    hasTotpDevice,
    loadMfaOptions
  };
};