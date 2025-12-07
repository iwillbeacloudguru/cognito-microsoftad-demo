import './App.css';
import { useAuth } from "react-oidc-context";
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import MfaSettings from './MfaSettings';
import MfaCrud from './MfaCrud';
import { createUser, registerMfaDevice, getMfaDevices, updateMfaUsed } from './api';

function App() {
  const auth = useAuth();
  const [authStage, setAuthStage] = useState('idle');
  const [mfaInfo, setMfaInfo] = useState(null);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpRegistered, setTotpRegistered] = useState(false);
  const [showTotpVerify, setShowTotpVerify] = useState(false);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [showMfaSettings, setShowMfaSettings] = useState(false);
  const [showMfaCrud, setShowMfaCrud] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  
  useEffect(() => {
    checkPasskeySupport();
    checkPasskeyRegistration();
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.profile?.email) {
      syncUserToBackend();
      loadMfaDevicesFromBackend();
      checkMfaRequired();
    }
  }, [auth.isAuthenticated]);

  const checkMfaRequired = async () => {
    try {
      const devices = await getMfaDevices(auth.user.profile.email);
      const hasTOTP = devices.some(d => d.device_type === 'totp' && d.is_active);
      
      if (hasTOTP && !sessionStorage.getItem('mfa_verified')) {
        setShowTotpVerify(true);
      }
    } catch (error) {
      console.error('Failed to check MFA:', error);
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
      const hasPasskey = devices.some(d => d.device_type === 'passkey' && d.is_active);
      if (hasTOTP) setTotpRegistered(true);
      if (hasPasskey) setPasskeyRegistered(true);
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

  const checkPasskeySupport = () => {
    const supported = window.PublicKeyCredential !== undefined && 
                     navigator.credentials !== undefined;
    setPasskeySupported(supported);
  };

  const checkPasskeyRegistration = () => {
    const registered = localStorage.getItem('passkey_registered') === 'true';
    setPasskeyRegistered(registered);
  };

  const registerPasskey = async () => {
    if (!passkeySupported) {
      alert('Passkeys are not supported in this browser');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Cognito MFA Demo",
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16),
          name: auth.user?.profile?.email || "user@example.com",
          displayName: auth.user?.profile?.email || "User",
        },
        pubKeyCredParams: [{alg: -7, type: "public-key"}],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (credential) {
        localStorage.setItem('passkey_registered', 'true');
        localStorage.setItem('passkey_credential_id', credential.id);
        setPasskeyRegistered(true);
        setShowPasskeySetup(false);
        setMfaInfo({
          enabled: true,
          method: 'passkey',
          timestamp: new Date().toISOString()
        });

        try {
          await registerMfaDevice(
            auth.user?.profile?.email,
            'passkey',
            'Biometric Device',
            null,
            credential.id
          );
        } catch (error) {
          console.error('Failed to save passkey to backend:', error);
        }
      }
    } catch (error) {
      console.error('Passkey registration failed:', error);
      alert('Passkey registration failed: ' + error.message);
    }
  };

  const authenticateWithPasskey = async () => {
    if (!passkeyRegistered) {
      alert('No passkey registered. Please register first.');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credentialId = localStorage.getItem('passkey_credential_id');
      
      const publicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: "required",
        allowCredentials: credentialId ? [{
          id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
          type: 'public-key',
        }] : []
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (assertion) {
        setMfaInfo({
          enabled: true,
          method: 'passkey',
          timestamp: new Date().toISOString()
        });
        return true;
      }
    } catch (error) {
      console.error('Passkey authentication failed:', error);
      alert('Passkey authentication failed: ' + error.message);
      return false;
    }
  };

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
  
  const signOutRedirect = () => {
    const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
    const logoutUri = "<logout uri>";
    const cognitoDomain = "https://ap-southeast-1gysqnwnf1.auth.ap-southeast-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-lg font-medium">
            {authStage === 'mfa' ? 'Verifying MFA...' : 'Authenticating...'}
          </p>
          {authStage === 'mfa' && (
            <p className="text-sm mt-2 opacity-90">Please complete MFA verification</p>
          )}
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h5 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Authentication Error</h5>
            <p className="text-yellow-700 text-sm">{auth.error.message}</p>
          </div>
          <button 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    if (showMfaCrud) {
      return <MfaCrud user={auth.user?.profile} onBack={() => setShowMfaCrud(false)} />;
    }
    
    if (showMfaSettings) {
      return <MfaSettings user={auth.user?.profile} onBack={() => setShowMfaSettings(false)} />;
    }

    const mfaVerified = mfaInfo?.enabled;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">✓ Authenticated</h1>
            <p className="text-gray-600">Welcome back to your secure session</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                <span className="text-lg font-medium text-gray-800">{auth.user?.profile.email}</span>
              </div>
              <div className="flex gap-2">
                {mfaVerified && (
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    🔒 MFA {mfaInfo?.method && `(${mfaInfo.method.toUpperCase()})`}
                  </span>
                )}
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">Active</span>
              </div>
            </div>

            {mfaVerified && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  ✓ Multi-Factor Authentication verified at {new Date(mfaInfo.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}

            {!totpRegistered && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-800 mb-2">📱 Setup Virtual MFA (Authenticator App)</p>
                <button
                  onClick={setupTotp}
                  className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                >
                  Setup Authenticator
                </button>
              </div>
            )}

            {passkeySupported && !passkeyRegistered && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-purple-800 mb-2">🔑 Enhance your security with Passkey</p>
                <button
                  onClick={() => setShowPasskeySetup(true)}
                  className="text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition-colors"
                >
                  Register Passkey
                </button>
              </div>
            )}

            <div className="space-y-3 mt-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">ID Token</div>
                <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">{auth.user?.id_token}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Access Token</div>
                <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">{auth.user?.access_token}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Refresh Token</div>
                <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">{auth.user?.refresh_token}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <button 
                className="flex-1 bg-indigo-500 text-white py-3 rounded-lg font-medium hover:bg-indigo-600 hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => setShowMfaSettings(true)}
              >
                ⚙️ MFA Settings
              </button>
              <button 
                className="flex-1 bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => setShowMfaCrud(true)}
              >
                📋 Manage Devices
              </button>
            </div>
            <button 
              className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                auth.removeUser();
                window.location.href = '/';
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        {showTotpSetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📱 Setup Authenticator App</h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.)
              </p>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 flex justify-center">
                <QRCodeSVG value={getTotpUri()} size={200} />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 mb-1">Or enter this secret key manually:</p>
                <p className="font-mono text-sm text-gray-800 break-all">{totpSecret}</p>
              </div>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                maxLength="6"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-center text-lg font-mono"
              />
              <div className="flex gap-3">
                <button
                  onClick={verifyAndRegisterTotp}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Verify & Register
                </button>
                <button
                  onClick={() => { setShowTotpSetup(false); setTotpCode(''); }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showPasskeySetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🔑 Register Passkey</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use your device's biometric authentication (fingerprint, face ID) or security key as a second factor.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={registerPasskey}
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Register Now
                </button>
                <button
                  onClick={() => setShowPasskeySetup(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const verifyTotpLogin = async () => {
    if (totpVerifyCode.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    try {
      const email = auth.user?.profile?.email;
      if (!email) {
        alert('User not authenticated');
        return;
      }

      const devices = await getMfaDevices(email);
      const totpDevice = devices.find(d => d.device_type === 'totp' && d.is_active);
      
      if (!totpDevice || !totpDevice.totp_secret) {
        alert('TOTP not configured for this user');
        return;
      }

      const validCode = await generateTOTP(totpDevice.totp_secret);
      if (totpVerifyCode !== validCode) {
        alert('Invalid code. Please check your authenticator app.');
        return;
      }

      await updateMfaUsed(totpDevice.id);
      sessionStorage.setItem('mfa_verified', 'true');
      setShowTotpVerify(false);
      setTotpVerifyCode('');
    } catch (error) {
      console.error('Failed to verify TOTP:', error);
      alert('Failed to verify TOTP. Please try again.');
    }
  };

  const handleSignIn = async () => {
    auth.signinRedirect();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🔐 Secure Login</h1>
          <p className="text-gray-600">Sign in with Microsoft AD (ADFS SSO)</p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 flex items-center justify-center gap-2">
              <span>🔒</span>
              <span>MFA Required After SSO</span>
            </p>
          </div>
        </div>
        <button 
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          onClick={handleSignIn}
        >
          🏢 Sign In with ADFS SSO
        </button>
      </div>

      {showTotpVerify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📱 MFA Required</h3>
            <p className="text-sm text-gray-600 mb-2">
              Email: <strong>{auth.user?.profile?.email}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app
            </p>
            <input
              type="text"
              placeholder="000000"
              maxLength="6"
              value={totpVerifyCode}
              onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 mb-4 text-center text-2xl font-mono tracking-widest focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={verifyTotpLogin}
                disabled={totpVerifyCode.length !== 6}
                className="flex-1 bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel & Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
