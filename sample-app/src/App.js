import './App.css';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import MfaSettings from './MfaSettings';
import Modal from './components/Modal';
import { setupMFA, verifyMFASetup, setMFAPreference, signIn, verifyTotpCode, getCurrentSession, signOut, globalSignOut } from './api';
import { getTotpUri } from './utils/totp';
import { setupLogger } from './utils/logger';
import { useMfa } from './hooks/useMfa';

setupLogger();

function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authStage, setAuthStage] = useState('idle');
  const [mfaInfo, setMfaInfo] = useState(null);

  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const [showTotpVerify, setShowTotpVerify] = useState(false);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [showMfaSettings, setShowMfaSettings] = useState(false);
  const [pendingMfaUser, setPendingMfaUser] = useState(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { hasTotpDevice, loadMfaOptions } = useMfa(user?.getUsername());

  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    try {
      const { user: cognitoUser, session: cognitoSession } = await getCurrentSession();
      setUser(cognitoUser);
      setSession(cognitoSession);
      setAuthStage('authenticated');
    } catch (error) {
      setAuthStage('idle');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && session && hasTotpDevice !== undefined) {
      checkMfaRequired();
    }
  }, [user, session, hasTotpDevice]);

  const checkMfaRequired = () => {
    const mfaVerified = sessionStorage.getItem('mfa_verified');
    
    if (!hasTotpDevice) {
      setShowMfaSettings(true);
    } else if (!mfaVerified) {
      setShowTotpVerify(true);
    }
  };







  const setupTotp = async () => {
    try {
      const result = await setupMFA(user?.getUsername());
      setTotpSecret(result.secretCode);
      setShowTotpSetup(true);
    } catch (error) {
      console.error('Failed to setup MFA:', error);
      alert('Failed to setup MFA. Please try again.');
    }
  };



  const verifyAndRegisterTotp = async () => {
    if (totpCode.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    try {
      await verifyMFASetup(user?.getUsername(), totpCode);
      await setMFAPreference(user?.getUsername(), true);
      setShowTotpSetup(false);
      setTotpCode('');
      loadMfaOptions();
      setMfaInfo({
        enabled: true,
        method: 'totp',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to verify TOTP:', error);
      alert('Invalid code. Please try again.');
    }
  };








  


  const handleSignOut = async () => {
    try {
      await globalSignOut();
      setUser(null);
      setSession(null);
      setAuthStage('idle');
      sessionStorage.removeItem('mfa_verified');
    } catch (error) {
      console.error('Sign out error:', error);
      signOut();
      setUser(null);
      setSession(null);
      setAuthStage('idle');
    }
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="rounded-md bg-yellow-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Authentication Error</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{error.message}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setError(null)}
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

  if (user && session) {
    if (showMfaSettings) {
      return <MfaSettings user={{ email: user.getUsername() }} onBack={() => setShowMfaSettings(false)} />;
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
                    <span className="text-lg font-medium text-gray-900">{user?.getUsername()}</span>
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
                    <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">{session?.getIdToken()?.getJwtToken()}</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-md p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Access Token</div>
                    <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">{session?.getAccessToken()?.getJwtToken()}</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-md p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Refresh Token</div>
                    <div className="font-mono text-xs text-gray-700 break-all leading-relaxed">{session?.getRefreshToken()?.getToken()}</div>
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
                  onClick={handleSignOut}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        <Modal isOpen={showTotpSetup} onClose={() => { setShowTotpSetup(false); setTotpCode(''); }} title="Setup Authenticator App">
          <p className="text-sm text-gray-500 mb-4">
            Scan this QR code with your authenticator app
          </p>
          <div className="bg-white p-4 border border-gray-200 rounded-md mb-4 flex justify-center">
            <QRCodeSVG value={getTotpUri(totpSecret, user?.getUsername())} size={200} />
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

  const verifyTotpLogin = async () => {
    if (totpVerifyCode.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    try {
      const session = await verifyTotpCode(pendingMfaUser, totpVerifyCode);
      setSession(session);
      setUser(pendingMfaUser);
      setPendingMfaUser(null);
      sessionStorage.setItem('mfa_verified', 'true');
      setShowTotpVerify(false);
      setTotpVerifyCode('');
      setAuthStage('authenticated');
    } catch (error) {
      alert('Invalid TOTP code. Please try again.');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(username, password);
      
      if (result.totpRequired || result.mfaRequired) {
        setPendingMfaUser(result.user);
        setShowTotpVerify(true);
      } else {
        setUser(result.user);
        setSession(result.session);
        setAuthStage('authenticated');
      }
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Secure Login</h1>
              <p className="text-gray-500">Sign in with Cognito MFA</p>
            </div>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Modal isOpen={showTotpVerify} onClose={() => {}} title="MFA Required">
        <p className="text-sm text-gray-500 mb-2">
          Email: <strong>{user?.getUsername()}</strong>
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
              setPendingMfaUser(null);
              setAuthStage('idle');
            }}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
          >
            Cancel & Sign Out
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
