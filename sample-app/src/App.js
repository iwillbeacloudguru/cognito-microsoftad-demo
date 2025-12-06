import './App.css';
import { useAuth } from "react-oidc-context";
import { useState, useEffect } from 'react';

function App() {
  const auth = useAuth();
  const [authStage, setAuthStage] = useState('idle');
  
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
    }
  }, [auth.isLoading, auth.isAuthenticated]);
  
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
    const mfaVerified = auth.user?.profile?.['cognito:mfa_enabled'] || auth.user?.profile?.amr?.includes('mfa');
    
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
                    🔒 MFA
                  </span>
                )}
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">Active</span>
              </div>
            </div>

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
      </div>
    );
  }

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
        </div>
        <button 
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          onClick={() => auth.signinRedirect()}
        >
          Sign In with Cognito
        </button>
      </div>
    </div>
  );
}

export default App;
