import './App.css';
import { useAuth } from "react-oidc-context";
import { useState, useEffect } from 'react';

function App() {
  const auth = useAuth();
  const [authStage, setAuthStage] = useState('idle');
  const [mfaInfo, setMfaInfo] = useState(null);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  
  useEffect(() => {
    checkPasskeySupport();
    checkPasskeyRegistration();
  }, []);

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

          <button 
            className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => auth.removeUser()}
          >
            🚪 Sign Out
          </button>
        </div>

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

  const handleSignIn = async () => {
    if (passkeyRegistered) {
      const passkeyAuth = await authenticateWithPasskey();
      if (passkeyAuth) {
        auth.signinRedirect();
      }
    } else {
      auth.signinRedirect();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🔐 Secure Login</h1>
          <p className="text-gray-600">Sign in with your Microsoft AD credentials</p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 flex items-center justify-center gap-2">
              <span>🔒</span>
              <span>MFA-Protected Authentication</span>
            </p>
          </div>
          {passkeySupported && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-800 flex items-center justify-center gap-2">
                <span>🔑</span>
                <span>{passkeyRegistered ? 'Passkey Enabled' : 'Passkey Available'}</span>
              </p>
            </div>
          )}
        </div>
        <button 
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          onClick={handleSignIn}
        >
          {passkeyRegistered ? '🔑 Sign In with Passkey' : 'Sign In with Cognito'}
        </button>
      </div>
    </div>
  );
}

export default App;
