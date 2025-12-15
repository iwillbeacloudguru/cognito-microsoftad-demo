import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Callback() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isAuthenticated, navigate]);

  if (auth.error) {
    return (
      <div>
        <p>Authentication failed: {auth.error.message}</p>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  return <div>Processing authentication...</div>;
}