import './App.css';
import { useAuth } from "react-oidc-context";

function App() {
  const auth = useAuth();
  
  const signOutRedirect = () => {
    const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
    const logoutUri = "<logout uri>";
    const cognitoDomain = "https://ap-southeast-1gysqnwnf1.auth.ap-southeast-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return (
      <div className="App">
        <div className="loading-spinner">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="App">
        <div className="auth-card">
          <div className="error-message">
            <h5>⚠️ Authentication Error</h5>
            <p className="mb-0">{auth.error.message}</p>
          </div>
          <button className="btn btn-custom btn-primary-custom mt-3" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <div className="App">
        <div className="auth-card">
          <div className="auth-header">
            <h1>✓ Authenticated</h1>
            <p>Welcome back to your secure session</p>
          </div>

          <div className="user-info">
            <div className="user-email">
              <span>👤</span>
              <span>{auth.user?.profile.email}</span>
              <span className="badge-success ms-auto">Active</span>
            </div>

            <div className="token-section">
              <div className="token-item">
                <div className="token-label">ID Token</div>
                <div className="token-value">{auth.user?.id_token}</div>
              </div>
              <div className="token-item">
                <div className="token-label">Access Token</div>
                <div className="token-value">{auth.user?.access_token}</div>
              </div>
              <div className="token-item">
                <div className="token-label">Refresh Token</div>
                <div className="token-value">{auth.user?.refresh_token}</div>
              </div>
            </div>
          </div>

          <button className="btn btn-custom btn-danger-custom" onClick={() => auth.removeUser()}>
            🚪 Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Secure Login</h1>
          <p>Sign in with your Microsoft AD credentials</p>
        </div>
        <button className="btn btn-custom btn-primary-custom" onClick={() => auth.signinRedirect()}>
          Sign In with Cognito
        </button>
      </div>
    </div>
  );
}

export default App;
