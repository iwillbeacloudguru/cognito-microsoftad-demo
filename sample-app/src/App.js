import { useAuth } from "react-oidc-context";

function App() {
  const auth = useAuth();

  const handleLogin = () => {
    const cognitoDomain = "https://auth.nttdata-cs.com";
    const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
    const redirectUri = encodeURIComponent(window.location.origin);
    const loginUrl = `${cognitoDomain}/login/continue?client_id=${clientId}&response_type=code&scope=aws.cognito.signin.user.admin+email+openid&redirect_uri=${redirectUri}`;
    window.location.href = loginUrl;
  };

  const Header = () => (
    <div style={{backgroundColor: '#0066cc', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <h2 style={{margin: 0}}>NTT DATA Demo</h2>
      {auth.isAuthenticated ? (
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <span>Welcome, {auth.user?.profile.email}</span>
          <button 
            onClick={() => auth.removeUser()}
            style={{backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          style={{backgroundColor: '#28a745', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
        >
          Sign In
        </button>
      )}
    </div>
  );

  if (auth.isLoading) {
    return (
      <div>
        <Header />
        <div style={{padding: '20px'}}>Loading...</div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div>
        <Header />
        <div style={{padding: '20px'}}>Encountering error... {auth.error.message}</div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <div style={{fontFamily: 'Arial, sans-serif'}}>
        <Header />
        <div style={{padding: '20px'}}>
          <h1>Dashboard</h1>
          <div style={{backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
            <h3>User Information</h3>
            <p><strong>Email:</strong> {auth.user?.profile.email}</p>
            <p><strong>Name:</strong> {auth.user?.profile.name || 'N/A'}</p>
            <p><strong>Subject:</strong> {auth.user?.profile.sub}</p>
          </div>
          
          <div style={{backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
            <h3>Tokens</h3>
            <div style={{marginBottom: '10px'}}>
              <strong>ID Token:</strong>
              <textarea readOnly value={auth.user?.id_token} style={{width: '100%', height: '80px', fontSize: '10px'}} />
            </div>
            <div style={{marginBottom: '10px'}}>
              <strong>Access Token:</strong>
              <textarea readOnly value={auth.user?.access_token} style={{width: '100%', height: '80px', fontSize: '10px'}} />
            </div>
            <div style={{marginBottom: '10px'}}>
              <strong>Refresh Token:</strong>
              <textarea readOnly value={auth.user?.refresh_token} style={{width: '100%', height: '80px', fontSize: '10px'}} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{fontFamily: 'Arial, sans-serif'}}>
      <Header />
      <div style={{padding: '20px', textAlign: 'center'}}>
        <h2>Welcome to NTT DATA Demo</h2>
        <p>Please sign in to access the application.</p>
      </div>
    </div>
  );
}

export default App;