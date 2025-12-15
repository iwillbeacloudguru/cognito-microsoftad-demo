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
    const cognitoDomain = "https://ap-southeast-1gysqnwnf1.auth.ap-southeast-1.amazoncognito.com";
    const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
    const redirectUri = encodeURIComponent(window.location.origin);
    
    const loginUrl = `${cognitoDomain}/login?client_id=${clientId}&response_type=code&scope=openid+email+profile&redirect_uri=${redirectUri}`;
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
      <div>
        <pre> Hello: {auth.user?.profile.email} </pre>
        <pre> ID Token: {auth.user?.id_token} </pre>
        <pre> Access Token: {auth.user?.access_token} </pre>
        <pre> Refresh Token: {auth.user?.refresh_token} </pre>

        <button onClick={() => auth.removeUser()}>Sign out</button>
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