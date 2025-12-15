import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from './components/Modal';
import { setupMFA, verifyMFASetup, setMFAPreference, getMFAOptions } from './api';
import { getTotpUri } from './utils/totp';

function MfaSettings({ user, onBack }) {
  const [totpRegistered, setTotpRegistered] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    loadMfaDevices();
  }, []);

  const loadMfaDevices = async () => {
    try {
      if (user?.isFederated) {
        // Check localStorage for federated users
        const mfaData = localStorage.getItem(`mfa_${user.email}`);
        const hasTOTP = mfaData ? JSON.parse(mfaData).enabled : false;
        setTotpRegistered(hasTOTP);
      } else {
        const options = await getMFAOptions(user?.email);
        setDevices(options || []);
        const hasTOTP = options?.some(option => 
          option.DeliveryMedium === 'SOFTWARE_TOKEN_MFA' || 
          option.AttributeName === 'SOFTWARE_TOKEN_MFA'
        );
        setTotpRegistered(hasTOTP || false);
      }
    } catch (error) {
      console.error('Failed to load MFA options:', error);
    }
  };





  const setupTotp = async () => {
    try {
      if (user?.isFederated) {
        // Generate TOTP secret for federated users
        const secret = generateTotpSecret();
        setTotpSecret(secret);
        setShowTotpSetup(true);
      } else {
        const result = await setupMFA(user?.email);
        setTotpSecret(result.secretCode);
        setShowTotpSetup(true);
      }
    } catch (error) {
      console.error('Failed to setup MFA:', error);
      alert('Failed to setup MFA. Please try again.');
    }
  };

  const generateTotpSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const verifyAndRegisterTotp = async () => {
    if (totpCode.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    try {
      if (user?.isFederated) {
        // Store MFA in localStorage for federated users
        localStorage.setItem(`mfa_${user.email}`, JSON.stringify({
          secret: totpSecret,
          enabled: true,
          timestamp: new Date().toISOString()
        }));
      } else {
        await verifyMFASetup(user?.email, totpCode);
        await setMFAPreference(user?.email, true);
      }
      
      setShowTotpSetup(false);
      setTotpCode('');
      loadMfaDevices();
      onBack();
    } catch (error) {
      console.error('Failed to verify TOTP:', error);
      alert('Invalid code. Please try again.');
    }
  };

  const removeTotpMfa = async () => {
    if (window.confirm('Are you sure you want to remove TOTP MFA?')) {
      try {
        if (user?.isFederated) {
          // Remove from localStorage for federated users
          localStorage.removeItem(`mfa_${user.email}`);
        } else {
          await setMFAPreference(user?.email, false);
        }
        loadMfaDevices();
      } catch (error) {
        console.error('Failed to remove TOTP:', error);
      }
    }
  };







  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">MFA Settings</h1>
              {totpRegistered && (
                <button onClick={onBack} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  ← Back
                </button>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Authenticator App (TOTP)</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Use Google Authenticator, Microsoft Authenticator, or Authy
                      </p>
                    </div>
                    {totpRegistered && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    {totpRegistered ? (
                      <button
                        onClick={removeTotpMfa}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove TOTP
                      </button>
                    ) : (
                      <button
                        onClick={setupTotp}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Setup Authenticator
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>

      <Modal isOpen={showTotpSetup} onClose={() => { setShowTotpSetup(false); setTotpCode(''); }} title="Setup Authenticator App">
        <p className="text-sm text-gray-500 mb-4">
          Scan this QR code with your authenticator app
        </p>
        <div className="bg-white p-4 border border-gray-200 rounded-md mb-4 flex justify-center">
          <QRCodeSVG value={getTotpUri(totpSecret, user?.email)} size={200} />
        </div>
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Or enter this secret key manually:</p>
          <p className="font-mono text-sm text-gray-900 break-all">{totpSecret}</p>
        </div>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          maxLength="6"
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-lg font-mono"
        />
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            onClick={verifyAndRegisterTotp}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
          >
            Verify & Register
          </button>
          <button
            onClick={() => { setShowTotpSetup(false); setTotpCode(''); }}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </Modal>


    </div>
  );
}

export default MfaSettings;
