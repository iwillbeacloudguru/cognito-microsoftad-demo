import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_gYsQnwNf1",
  client_id: "5tai0tc43qpu5fq4l8hukmh9q3",
  redirect_uri: "https://demo.nttdata-cs.com",
  response_type: "code",
  scope: "aws.cognito.signin.user.admin email openid",
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
