import { useAuth } from "react-oidc-context";
import { useState, useEffect } from "react";
import { CognitoIdentityProviderClient, AssociateSoftwareTokenCommand, VerifySoftwareTokenCommand, SetUserMFAPreferenceCommand } from "@aws-sdk/client-cognito-identity-provider";
import Navbar from "../components/Navbar";
import { theme } from "../styles/theme";
import type { Route } from "./+types/mfa";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MFA Setup - Cognito Microsoft AD Demo" },
    { name: "description", content: "Multi-Factor Authentication Setup" },
  ];
}

export default function MFA() {
  const auth = useAuth();
  const [mfaSetup, setMfaSetup] = useState({ show: false, qrCode: '', secret: '', verificationCode: '' });
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    console.log('MFA Status Check:');
    console.log('User profile:', auth.user?.profile);
    console.log('phone_number_verified:', auth.user?.profile.phone_number_verified);
    console.log('All profile keys:', Object.keys(auth.user?.profile || {}));
    
    if (auth.isAuthenticated) {
      // Check multiple possible MFA indicators
      const phoneVerified = auth.user?.profile.phone_number_verified;
      const mfaEnabled = auth.user?.profile['custom:mfa_enabled'];
      const softwareTokenMfa = auth.user?.profile['software_token_mfa_enabled'];
      
      console.log('MFA indicators:', { phoneVerified, mfaEnabled, softwareTokenMfa });
      
      if (phoneVerified || mfaEnabled || softwareTokenMfa) {
        setMfaEnabled(true);
      }
    }
  }, [auth.isAuthenticated, auth.user]);

  const setupMFA = async () => {
    console.log('Starting MFA setup...');
    try {
      const client = new CognitoIdentityProviderClient({ region: 'ap-southeast-1' });
      const command = new AssociateSoftwareTokenCommand({
        AccessToken: auth.user?.access_token
      });
      const response = await client.send(command);
      
      const secret = response.SecretCode;
      const qrCode = `otpauth://totp/CognitoDemo:${auth.user?.profile.email}?secret=${secret}&issuer=CognitoDemo`;
      
      setMfaSetup({ show: true, qrCode, secret: secret || '', verificationCode: '' });
    } catch (error) {
      console.error('MFA setup error:', error);
    }
  };

  const verifyMFA = async () => {
    console.log('Starting MFA verification...');
    try {
      const client = new CognitoIdentityProviderClient({ region: 'ap-southeast-1' });
      
      const verifyCommand = new VerifySoftwareTokenCommand({
        AccessToken: auth.user?.access_token,
        UserCode: mfaSetup.verificationCode
      });
      await client.send(verifyCommand);
      
      const preferenceCommand = new SetUserMFAPreferenceCommand({
        AccessToken: auth.user?.access_token,
        SoftwareTokenMfaSettings: { Enabled: true, PreferredMfa: true }
      });
      await client.send(preferenceCommand);
      
      setMfaSetup({ show: false, qrCode: '', secret: '', verificationCode: '' });
      setMfaEnabled(true);
      alert('MFA setup completed successfully!');
    } catch (error) {
      console.error('MFA verification error:', error);
      alert('Invalid verification code. Please try again.');
    }
  };

  if (!auth.isAuthenticated) {
    return <div>Please sign in to access MFA settings.</div>;
  }

  return (
    <div className={theme.layout.page}>
      <Navbar 
        mfaEnabled={mfaEnabled}
        showMfaManage={false}
        setShowMfaManage={() => {}}
        showTokens={false}
        setShowTokens={() => {}}
        onSignOut={() => {}}
      />
      <div className={theme.layout.container}>
        <div className="max-w-2xl mx-auto">
          <div className={theme.card}>
            <div className="flex items-center mb-6">
              <a href="/" className="mr-4 text-blue-600 hover:text-blue-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h1 className="text-2xl font-bold text-gray-900">Multi-Factor Authentication</h1>
            </div>
            
            {!mfaEnabled && !mfaSetup.show && (
              <div className="text-center">
                <div className="mb-6">
                  <svg className="h-16 w-16 mx-auto text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Multi-Factor Authentication</h2>
                  <p className="text-gray-600 mb-6">Secure your account with TOTP authentication</p>
                </div>
                <button
                  onClick={setupMFA}
                  className={`${theme.button.primary} px-6 py-3 text-lg`}
                >
                  Setup MFA
                </button>
              </div>
            )}

            {mfaSetup.show && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Setup TOTP Authentication</h2>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">1. Scan QR Code</h3>
                  <p className="text-gray-600 mb-4">Scan this QR code with your authenticator app:</p>
                  <div className="bg-white p-4 rounded border inline-block">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaSetup.qrCode)}`} alt="QR Code" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">2. Manual Entry</h3>
                  <p className="text-gray-600 mb-2">Or enter this secret manually:</p>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm block">{mfaSetup.secret}</code>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">3. Verify Setup</h3>
                  <p className="text-gray-600 mb-4">Enter the 6-digit code from your authenticator app:</p>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={mfaSetup.verificationCode}
                      onChange={(e) => setMfaSetup({...mfaSetup, verificationCode: e.target.value})}
                      placeholder="123456"
                      className={`${theme.input} w-32`}
                      maxLength={6}
                    />
                    <button
                      onClick={verifyMFA}
                      disabled={mfaSetup.verificationCode.length !== 6}
                      className={`${theme.button.success} disabled:opacity-50`}
                    >
                      Verify & Enable
                    </button>
                    <button
                      onClick={() => setMfaSetup({ show: false, qrCode: '', secret: '', verificationCode: '' })}
                      className={theme.button.secondary}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mfaEnabled && (
              <div>
                <div className={`${theme.alert.success} mb-6`}>
                  <div className="flex items-center space-x-3">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h2 className="text-lg font-semibold text-green-800">MFA is Active</h2>
                      <p className="text-green-700">Your account is protected with TOTP authentication</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">MFA Details</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Method</p>
                        <p className="text-sm text-gray-600">TOTP (Time-based One-Time Password)</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Status</p>
                        <p className="text-sm text-green-600">Enabled & Active</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Account</p>
                        <p className="text-sm text-gray-600">{auth.user?.profile.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Issuer</p>
                        <p className="text-sm text-gray-600">CognitoDemo</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Security Information</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Your account requires MFA for all sign-ins</li>
                      <li>• TOTP codes refresh every 30 seconds</li>
                      <li>• Use your authenticator app to generate codes</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}