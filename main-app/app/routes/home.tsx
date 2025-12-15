import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cognito Microsoft AD Demo" },
    { name: "description", content: "AWS Cognito with Microsoft AD integration" },
  ];
}

export default function Home() {
  const auth = useAuth();

  useEffect(() => {
    // Clear URL params if auth error with state mismatch
    if (auth.error && auth.error.message.includes("No matching state found")) {
      window.history.replaceState({}, document.title, window.location.pathname);
      auth.clearStaleState();
    }
  }, [auth.error]);

  const signOutRedirect = () => {
    const adfsServer = "https://adfs.nttdata-cs.com";
    const returnUrl = "https://demo.nttdata-cs.com";
    window.location.href = `${adfsServer}/adfs/ls/?wa=wsignout1.0&wreply=${encodeURIComponent(returnUrl)}`;
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    if (auth.error.message.includes("No matching state found")) {
      return (
        <div>
          <p>Session expired. Please sign in again.</p>
          <button onClick={() => auth.signinRedirect()}>Sign in</button>
        </div>
      );
    }
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

  return (
    <div>
      <button onClick={() => auth.signinRedirect()}>Sign in</button>
      <button onClick={() => signOutRedirect()}>Sign out</button>
    </div>
  );
}
