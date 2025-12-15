import { useAuth } from "react-oidc-context";
import { useState } from "react";

function App() {
  const auth = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const signOutRedirect = () => {
    const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
    const logoutUri = "https://adfs.nttdata-cs.com";
    const cognitoDomain = "https://ap-southeast-1gysqnwnf1.auth.ap-southeast-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  const handleUsernameLogin = async (e) => {
    e.preventDefault();
    const cognitoDomain = "https://auth.nttdata-cs.com";
    const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
    const redirectUri = encodeURIComponent(window.location.origin);
    
    const loginUrl = `${cognitoDomain}/login/continue?client_id=${clientId}&response_type=code&scope=aws.cognito.signin.user.admin+email+openid&redirect_uri=${redirectUri}`;
    window.location.href = loginUrl;
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
        <h1>Welcome to NTT DATA Demo</h1>
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
        
        <button 
          onClick={() => auth.removeUser()} 
          style={{backgroundColor: '#dc3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div>
        <h2>Login Options</h2>
        <button onClick={() => auth.signinRedirect()}>Sign in with ADFS</button>
        <br /><br />
        <button onClick={handleUsernameLogin}>Sign in with Username/Password</button>
        <br /><br />
        <button onClick={() => setShowLogin(false)}>Back</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setShowLogin(true)}>Sign in</button>
    </div>
  );
}

export default App;