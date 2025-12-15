import './App.css';
import { useAuth } from "react-oidc-context";
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import MfaSettings from './MfaSettings';
import { createUser, registerMfaDevice, getMfaDevices, updateMfaUsed } from './api';

// Override console to send logs to backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const originalConsole = { ...console };
console.log = (...args) => {
  originalConsole.log(...args);
  fetch(`${API_URL.replace('/v2', '')}/api/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'log', message: args.join(' '), timestamp: new Date().toISOString() })
  }).catch(() => {});
};
console.error = (...args) => {
  originalConsole.error(...args);
  fetch(`${API_URL.replace('/v2', '')}/api/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'error', message: args.join(' '), timestamp: new Date().toISOString() })
  }).catch(() => {});
};

function App() {
  const auth = useAuth();
  const [authStage, setAuthStage] = useState('idle');
  const [mfaInfo, setMfaInfo] = useState(null);

  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpRegistered, setTotpRegistered] = useState(false);
  const [showTotpVerify, setShowTotpVerify] = useState(false);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [showMfaSettings, setShowMfaSettings] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    console.log('[DEBUG] App mounted, URL params:', Object.fromEntries(urlParams));
    if (!urlParams.has('code') && !urlParams.has('state')) {
      console.log('[DEBUG] Clearing mfa_verified flag');
      sessionStorage.removeItem('mfa_verified');
    } else {
      console.log('[DEBUG] OAuth callback detected, keeping mfa_verified flag');
    }
  }, []);

  useEffect(() => {
    console.log('[DEBUG] Auth state changed:', { isAuthenticated: auth.isAuthenticated, email: auth.user?.profile?.email });
    if (auth.isAuthenticated && auth.user?.profile?.email) {
      console.log('[DEBUG] User authenticated, starting MFA check flow');
      syncUserToBackend();
      loadMfaDevicesFromBackend();
      checkMfaRequired();
    }
  }, [auth.isAuthenticated]);

  const checkMfaRequired = async () => {
    try {
      console.log('[DEBUG] Checking MFA requirements for:', auth.user.profile.email);
      const devices = await getMfaDevices(auth.user.profile.email);
      console.log('[DEBUG] MFA devices found:', devices);
      const hasTOTP = devices.some(d => d.device_type === 'totp' && d.is_active);
      const mfaVerified = sessionStorage.getItem('mfa_verified');
      console.log('[DEBUG] MFA status:', { hasTOTP, mfaVerified });
      
      if (!hasTOTP) {
        console.log('[DEBUG] No TOTP found, showing MFA settings');
        setShowMfaSettings(true);
      } else if (!mfaVerified) {
        console.log('[DEBUG] TOTP found but not verified, showing TOTP verify modal');
        setShowTotpVerify(true);
      } else {
        console.log('[DEBUG] MFA already verified, proceeding to app');
      }
    } catch (error) {
      console.error('[ERROR] Failed to check MFA:', error);
    }
  };

  const syncUserToBackend = async () => {
    try {
      await createUser(auth.user.profile.email, auth.user.profile.sub);
    } catch (error) {
      console.error('Failed to sync user:', error);
    }
  };

  const loadMfaDevicesFromBackend = async () => {
    try {
      const devices = await getMfaDevices(auth.user.profile.email);
      const hasTOTP = devices.some(d => d.device_type === 'totp' && d.is_active);
      if (hasTOTP) setTotpRegistered(true);
    } catch (error) {
      console.error('Failed to load MFA devices:', error);
    }
  };

  const checkTotpRegistration = async () => {
    if (auth.user?.profile?.email) {
      try {
        const devices = await getMfaDevices(auth.user.profile.email);
        const hasTOTP = devices.some(d => d.device_type === 'totp' && d.is_active);
        setTotpRegistered(hasTOTP);
      } catch (error) {
        console.error('Failed to check TOTP:', error);
      }
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

  const setupTotp = () => {
    const secret = generateTotpSecret();
    setTotpSecret(secret);
    setShowTotpSetup(true);
  };

  const generateTOTP = (secret) => {
    const base32Decode = (str) => {
      const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let bits = '';
      for (let i = 0; i < str.length; i++) {
        const val = base32Chars.indexOf(str.charAt(i).toUpperCase());
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
      }
      const bytes = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substr(i, 8), 2));
      }
      return new Uint8Array(bytes);
    };

    const hmacSha1 = async (key, message) => {
      const cryptoKey = await crypto.subtle.importKey(
        'raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
      );
      return await crypto.subtle.sign('HMAC', cryptoKey, message);
    };

    return (async () => {
      const epoch = Math.floor(Date.now() / 1000);
      const time = Math.floor(epoch / 30);
      const timeBytes = new ArrayBuffer(8);
      const timeView = new DataView(timeBytes);
      timeView.setUint32(4, time, false);

      const keyBytes = base32Decode(secret);
      const hmac = await hmacSha1(keyBytes, timeBytes);
      const hmacArray = new Uint8Array(hmac);
      
      const offset = hmacArray[hmacArray.length - 1] & 0x0f;
      const code = (
        ((hmacArray[offset] & 0x7f) << 24) |
        ((hmacArray[offset + 1] & 0xff) << 16) |
        ((hmacArray[offset + 2] & 0xff) << 8) |
        (hmacArray[offset + 3] & 0xff)
      ) % 1000000;
      
      return code.toString().padStart(6, '0');
    })();
  };

  const verifyAndRegisterTotp = async () => {
    if (totpCode.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    const validCode = await generateTOTP(totpSecret);
    if (totpCode !== validCode) {
      alert('Invalid code. Please try again.');
      return;
    }

    try {
      await registerMfaDevice(
        auth.user?.profile?.email,
        'totp',
        'Authenticator App',
        totpSecret,
        null
      );
      setTotpRegistered(true);
      setShowTotpSetup(false);
      setTotpCode('');
      setMfaInfo({
        enabled: true,
        method: 'totp',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save TOTP to backend:', error);
      alert('Failed to register TOTP. Please try again.');
    }
  };

  const getTotpUri = () => {
    const issuer = 'CognitoMFADemo';
    const accountName = auth.user?.profile?.email || 'user@example.com';
    return `otpauth://totp/${issuer}:${accountName}?secret=${totpSecret}&issuer=${issuer}`;
  };

  useEffect(() => {
    if (auth.isLoading) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('code')) {
        setAuthStage('mfa');
      } else {
        setAuthStage('authenticating');
      }
    } else if (auth.isAuthenticated) {
      setAuthStage('authenticated');
      detectMfaStatus();
    } else {
      setAuthStage('idle');
    }
  }, [auth.isLoading, auth.isAuthenticated]);



  const detectMfaStatus = () => {
    if (!auth.user) return;

    const profile = auth.user.profile;
    const idToken = auth.user.id_token;
    
    // Decode JWT to check for MFA claims
    let mfaEnabled = false;
    let mfaMethod = null;
    
    try {
      // Check various MFA indicators
      if (profile?.['cognito:mfa_enabled']) {
        mfaEnabled = true;
      }
      
      // Check AMR (Authentication Methods References)
      if (profile?.amr) {
        const amrArray = Array.isArray(profile.amr) ? profile.amr : [profile.amr];
        if (amrArray.includes('mfa') || amrArray.includes('otp') || amrArray.includes('sms')) {
          mfaEnabled = true;
          mfaMethod = amrArray.find(m => ['mfa', 'otp', 'sms', 'totp'].includes(m));
        }
      }

      // Decode ID token for additional MFA claims
      if (idToken) {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        if (payload.amr) {
          const amrArray = Array.isArray(payload.amr) ? payload.amr : [payload.amr];
          if (amrArray.includes('mfa') || amrArray.includes('otp') || amrArray.includes('sms')) {
            mfaEnabled = true;
            mfaMethod = amrArray.find(m => ['mfa', 'otp', 'sms', 'totp'].includes(m));
          }
        }
      }
    } catch (error) {
      console.error('Error detecting MFA status:', error);
    }

    setMfaInfo({
      enabled: mfaEnabled,
      method: mfaMethod,
      timestamp: new Date().toISOString()
    });
  };
  
  const signOutRedirect = async () => {
    console.log('[DEBUG] Sign out initiated');
    localStorage.clear();
    sessionStorage.clear();
    console.log('[DEBUG] Storage cleared, removing OIDC user');
    await auth.removeUser();
    const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
    const logoutUri = "https://demo.nttdata-cs.com";
    const cognitoDomain = "https://ap-southeast-1gysqnwnf1.auth.ap-southeast-1.amazoncognito.com";
    const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}&prompt=login`;
    console.log('[DEBUG] Redirecting to logout URL:', logoutUrl);
    window.location.href = logoutUrl;
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900">
            {authStage === 'mfa' ? 'Verifying MFA...' : 'Authenticating...'}
          </p>
          {authStage === 'mfa' && (
            <p className="text-sm mt-2 text-gray-500">Please complete MFA verification</p>
          )}
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="rounded-md bg-yellow-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Authentication Error</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{auth.error.message}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    if (showMfaSettings) {
      return <MfaSettings user={auth.user?.profile} onBack={() => setShowMfaSettings(false)} />;
    }

    const mfaVerified = mfaInfo?.enabled;
    
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">Authenticated</h1>
                <p className="text-gray-500">Welcome back to your secure session</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-gray-900">{auth.user?.profile.email}</span>
                  </div>
                  <div className="flex gap-2">
                    {mfaVerified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        MFA {mfaInfo?.method && `(${mfaInfo.method.toUpperCase()})`}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                  </div>
                </div>

                {mfaVerified && (
                  <div className="rounded-md bg-blue-50 p-3 mb-4">
                    <p className="text-xs text-blue-800">
                      Multi-Factor Authentication verified at {new Date(mfaInfo.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                )}

                <div className="space-y-3 mt-4">
                  <div className="bg-white border border-gray-200 rounded-md p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">ID Token</div>
                    <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">{auth.user?.id_token}</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-md p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Access Token</div>
                    <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">{auth.user?.access_token}</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-md p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Refresh Token</div>
                    <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">{auth.user?.refresh_token}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button 
                  onClick={() => setShowMfaSettings(true)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  MFA Settings & Devices
                </button>
                <button 
                  onClick={signOutRedirect}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {showTotpSetup && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Setup Authenticator App</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Scan this QR code with your authenticator app
                  </p>
                  <div className="bg-white p-4 border border-gray-200 rounded-md mb-4 flex justify-center">
                    <QRCodeSVG value={getTotpUri()} size={200} />
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
                </div>
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
              </div>
            </div>
          </div>
        )}


      </div>
    );
  }

  const verifyTotpLogin = async () => {
    console.log('[DEBUG] TOTP verification attempt with code:', totpVerifyCode);
    if (totpVerifyCode.length !== 6) {
      console.log('[DEBUG] Invalid code length:', totpVerifyCode.length);
      alert('Please enter a 6-digit code');
      return;
    }

    try {
      const email = auth.user?.profile?.email;
      console.log('[DEBUG] Verifying TOTP for user:', email);
      if (!email) {
        console.log('[ERROR] No email found in user profile');
        alert('User not authenticated');
        return;
      }

      const devices = await getMfaDevices(email);
      const totpDevice = devices.find(d => d.device_type === 'totp' && d.is_active);
      console.log('[DEBUG] TOTP device found:', totpDevice);
      
      if (!totpDevice || !totpDevice.totp_secret) {
        console.log('[ERROR] No TOTP device or secret found');
        alert('TOTP not configured for this user');
        return;
      }

      const validCode = await generateTOTP(totpDevice.totp_secret);
      console.log('[DEBUG] Generated valid code:', validCode, 'User entered:', totpVerifyCode);
      if (totpVerifyCode !== validCode) {
        console.log('[ERROR] TOTP code mismatch');
        alert('Invalid code. Please check your authenticator app.');
        return;
      }

      console.log('[DEBUG] TOTP verification successful');
      await updateMfaUsed(totpDevice.id);
      sessionStorage.setItem('mfa_verified', 'true');
      console.log('[DEBUG] MFA verified flag set, hiding modal');
      setShowTotpVerify(false);
      setTotpVerifyCode('');
    } catch (error) {
      console.error('[ERROR] Failed to verify TOTP:', error);
      alert('Failed to verify TOTP. Please try again.');
    }
  };

  const handleSignIn = async () => {
    console.log('[DEBUG] Sign in initiated, clearing MFA verification');
    sessionStorage.removeItem('mfa_verified');
    console.log('[DEBUG] Redirecting to Cognito for authentication');
    auth.signinRedirect();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Secure Login</h1>
              <p className="text-gray-500">Sign in with Microsoft AD (ADFS SSO)</p>
              <div className="mt-4 rounded-md bg-blue-50 p-3">
                <p className="text-xs text-blue-800 text-center">
                  MFA Required After SSO
                </p>
              </div>
            </div>
            <button 
              onClick={handleSignIn}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In with ADFS SSO
            </button>
          </div>
        </div>
      </div>

      {showTotpVerify && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">MFA Required</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Email: <strong>{auth.user?.profile?.email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Enter the 6-digit code from your authenticator app
                </p>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength="6"
                  value={totpVerifyCode}
                  onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-2xl font-mono tracking-widest"
                  autoFocus
                />
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  onClick={verifyTotpLogin}
                  disabled={totpVerifyCode.length !== 6}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed sm:col-start-2 sm:text-sm"
                >
                  Verify & Sign In
                </button>
                <button
                  onClick={() => {
                    setShowTotpVerify(false);
                    setTotpVerifyCode('');
                    auth.removeUser();
                    window.location.href = '/';
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel & Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
