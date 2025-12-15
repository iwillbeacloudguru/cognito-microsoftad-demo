import './App.css';
import { useState, useEffect } from 'react';
import { signIn, verifyTotpCode, getCurrentSession, signOut, globalSignOut } from './api';
import { setupLogger } from './utils/logger';

setupLogger();

function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authStage, setAuthStage] = useState('idle');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [pendingMfaUser, setPendingMfaUser] = useState(null);

  useEffect(() => {
    checkCurrentSession();
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      setIsLoading(true);
      try {
        // Exchange authorization code for tokens
        const cognitoDomain = process.env.REACT_APP_COGNITO_DOMAIN;
        const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID;
        const redirectUri = window.location.origin;
        
        const tokenResponse = await fetch(`${cognitoDomain}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            code: code,
            redirect_uri: redirectUri
          })
        });
        
        if (tokenResponse.ok) {
          const tokens = await tokenResponse.json();
          
          // Extract user info from ID token
          const payload = JSON.parse(atob(tokens.id_token.split('.')[1]));
          const username = payload['cognito:username'] || payload.sub;
          const email = payload.email;
          
          // Create a simple user object for federated users
          const federatedUser = {
            getUsername: () => username,
            getEmail: () => email,
            isFederated: true
          };
          
          // Create session object
          const sessionData = {
            getIdToken: () => ({ getJwtToken: () => tokens.id_token }),
            getAccessToken: () => ({ getJwtToken: () => tokens.access_token }),
            getRefreshToken: () => ({ getToken: () => tokens.refresh_token })
          };
          
          setUser(federatedUser);
          setSession(sessionData);
          setAuthStage('authenticated');
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

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










  


  const handleSignOut = async () => {
    try {
      await globalSignOut();
      setUser(null);
      setSession(null);
      setAuthStage('idle');
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
          <p className="text-lg font-medium text-gray-900">Authenticating...</p>
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

  // MFA Required for username/password users
  if (authStage === 'mfa_required') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">MFA Required</h1>
                <p className="text-gray-500">Enter the 6-digit code from your authenticator app</p>
              </div>
              
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="000000"
                  maxLength="6"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-2xl font-mono tracking-widest"
                  autoFocus
                />
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={verifyMfaCode}
                  disabled={totpCode.length !== 6 || isLoading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
                <button
                  onClick={() => {
                    setTotpCode('');
                    setPendingMfaUser(null);
                    setAuthStage('idle');
                  }}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && session && authStage === 'authenticated') {
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                  </div>
                </div>

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

              <div className="mt-6">
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
      </div>
    );
  }

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
        setAuthStage('mfa_required');
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

  const verifyMfaCode = async () => {
    if (totpCode.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const session = await verifyTotpCode(pendingMfaUser, totpCode);
      setSession(session);
      setUser(pendingMfaUser);
      setPendingMfaUser(null);
      setTotpCode('');
      setAuthStage('authenticated');
    } catch (error) {
      alert('Invalid TOTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleADFSLogin = () => {
    const cognitoDomain = process.env.REACT_APP_COGNITO_DOMAIN;
    const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin);
    const adfsLoginUrl = `${cognitoDomain}/oauth2/authorize?client_id=${clientId}&response_type=code&scope=openid+email+profile&redirect_uri=${redirectUri}`;
    
    window.location.href = adfsLoginUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Secure Login</h1>
              <p className="text-gray-500">Choose your authentication method</p>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={handleADFSLogin}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In with ADFS (Microsoft AD)
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
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
                  {isLoading ? 'Signing In...' : 'Sign In with Cognito'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

export default App;
