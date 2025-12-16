/**
 * Main Home component for the Cognito Microsoft AD Demo application
 * Handles authentication flow, user session management, and application access control
 */
import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import { CognitoIdentityProviderClient, AssociateSoftwareTokenCommand, VerifySoftwareTokenCommand, SetUserMFAPreferenceCommand, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import Navbar from "../components/Navbar";
import { theme } from "../styles/theme";

// Meta information for the page
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cognito Microsoft AD Demo" },
    { name: "description", content: "AWS Cognito with Microsoft AD integration" },
  ];
}

export default function Home() {
  // Authentication and UI state management
  const auth = useAuth(); // OIDC authentication context
  const [showTokens, setShowTokens] = useState(false); // Toggle token visibility
  const [mfaSetup, setMfaSetup] = useState({ show: false, qrCode: '', secret: '', verificationCode: '' }); // MFA setup flow
  const [mfaEnabled, setMfaEnabled] = useState(false); // MFA status from Cognito
  const [showMfaManage, setShowMfaManage] = useState(false); // MFA management UI
  const [currentView, setCurrentView] = useState('home'); // SPA navigation (home/mfa)
  const [loading, setLoading] = useState(true); // Loading state for async operations

  // Authentication error handling - clears stale OIDC state
  useEffect(() => {
    if (auth.error && auth.error.message.includes("No matching state found")) {
      window.history.replaceState({}, document.title, window.location.pathname);
      auth.clearStaleState();
    }
  }, [auth.error]);

  // Cross-tab logout synchronization via localStorage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logout-event') {
        auth.removeUser();
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [auth]);

  // Fetch MFA status from Cognito on authentication
  useEffect(() => {
    const checkMfaStatus = async () => {
      if (auth.isAuthenticated && auth.user?.access_token) {
        try {
          const client = new CognitoIdentityProviderClient({ region: 'ap-southeast-1' });
          const command = new GetUserCommand({ AccessToken: auth.user.access_token });
          const response = await client.send(command);
          
          // Check if TOTP MFA is enabled
          const userMfaEnabled = response.UserMFASettingList?.includes('SOFTWARE_TOKEN_MFA');
          if (userMfaEnabled || (response.MFAOptions || []).length > 0) {
            setMfaEnabled(true);
          }
        } catch (error) {
          console.error('Error checking MFA status:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    checkMfaStatus();
  }, [auth.isAuthenticated, auth.user]);

  // Complete logout: local session + Cognito token revocation + cross-tab sync
  const signOutRedirect = async () => {
    try {
      // Notify other tabs of logout
      localStorage.setItem('logout-event', Date.now().toString());
      localStorage.removeItem('logout-event');
      
      await auth.removeUser(); // Clear local OIDC session
      
      // Redirect to Cognito logout endpoint for server-side session cleanup
      const cognitoDomain = "https://auth.nttdata-cs.com";
      const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
      const logoutUri = "https://demo.nttdata-cs.com";
      
      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}&response_type=code`;
    } catch (error) {
      console.error('Error during signout:', error);
      window.location.href = "https://demo.nttdata-cs.com"; // Fallback redirect
    }
  };

  // Loading skeleton while OIDC initializes
  if (auth.isLoading) {
    return (
      <div className={theme.layout.page}>
        <div className="animate-pulse">
          <div className="bg-blue-600 h-16 mb-8"></div>
          <div className={theme.layout.container}>
            <div className="max-w-4xl mx-auto">
              <div className={theme.card}>
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid gap-4">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authentication error states with user-friendly messages
  if (auth.error) {
    // Expired/invalid OIDC session
    if (auth.error.message.includes("No matching state found")) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Session Expired</h3>
              <p className="text-gray-600 mb-6">Your session has expired. Please sign in again to continue.</p>
              <button 
                onClick={() => auth.signinRedirect()}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }
    // Generic authentication errors
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Authentication Error</h3>
            <p className="text-red-600">{auth.error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Application access control matrix: maps apps to required groups/patterns
  const appConfig = {
    "hr-system": {
      "name": "HR Management",
      "description": "Employee records and HR processes",
      "color": "bg-red-600",
      "cognitoGroups": ["hr-users", "admin-group"],
      "adfsUserPatterns": ["hr-", "human-resource"],
      "adfsGroups": ["HR Department", "Human Resources"]
    },
    "finance-dashboard": {
      "name": "Finance Dashboard",
      "description": "Financial analytics and reporting",
      "color": "bg-blue-800",
      "cognitoGroups": ["finance-team", "admin-group"],
      "adfsUserPatterns": ["finance-", "accounting-", "application-user"],
      "adfsGroups": ["Finance Department", "Accounting"]
    },
    "it-portal": {
      "name": "IT Portal",
      "description": "System administration and IT support",
      "color": "bg-blue-800",
      "cognitoGroups": ["it-support", "admin-group"],
      "adfsUserPatterns": ["it-", "admin-", "tech-"],
      "adfsGroups": ["IT Department", "System Administrators"]
    }
  };

  // Access control logic: ADFS users by email patterns, Cognito users by groups
  const hasAccess = (appKey: string) => {
    const app = appConfig[appKey as keyof typeof appConfig];
    if (!app) return false;

    // Detect ADFS vs Cognito user by group identifier
    const isAdfsUser = auth.user?.profile['cognito:groups']?.some((group: string) => 
      group.includes('ap-southeast-1_gYsQnwNf1_ms-adfs')
    );

    if (isAdfsUser) {
      // ADFS: Check email/username patterns
      const userEmail = auth.user?.profile.email || '';
      const username = auth.user?.profile['cognito:username'] || '';
      const userText = `${userEmail} ${username}`.toLowerCase();
      
      const matchesPattern = app.adfsUserPatterns?.some(pattern => 
        userText.includes(pattern.toLowerCase())
      );
      
      const hasAdfsGroup = app.adfsGroups?.some(adfsGroup => 
        auth.user?.profile['custom:adfs_groups']?.includes(adfsGroup)
      );
      
      return matchesPattern || hasAdfsGroup;
    } else {
      // Cognito: Check assigned groups
      return app.cognitoGroups?.some(group => 
        auth.user?.profile['cognito:groups']?.includes(group)
      ) || false;
    }
  };

  // MFA requirement check: Cognito users without MFA enabled
  const needsMfaSetup = auth.isAuthenticated && 
    !auth.user?.profile['cognito:groups']?.some((group: string) => group.includes('ms-adfs')) &&
    !mfaEnabled;

  // TOTP MFA setup: generates secret and QR code for authenticator apps
  const setupMFA = async () => {
    console.log('Starting MFA setup...');
    console.log('Access token available:', !!auth.user?.access_token);
    try {
      const client = new CognitoIdentityProviderClient({ region: 'ap-southeast-1' });
      console.log('Cognito client created');
      
      const command = new AssociateSoftwareTokenCommand({
        AccessToken: auth.user?.access_token
      });
      console.log('Sending AssociateSoftwareToken command...');
      
      const response = await client.send(command);
      console.log('MFA setup response:', response);
      
      const secret = response.SecretCode;
      const qrCode = `otpauth://totp/CognitoDemo:${auth.user?.profile.email}?secret=${secret}&issuer=CognitoDemo`;
      
      console.log('Generated secret:', secret);
      console.log('Generated QR code URL:', qrCode);
      
      setMfaSetup({ show: true, qrCode, secret: secret || '', verificationCode: '' });
    } catch (error) {
      console.error('MFA setup error:', error);
    }
  };

  // MFA verification: validates TOTP code and enables MFA preference
  const verifyMFA = async () => {
    console.log('Starting MFA verification...');
    console.log('Verification code:', mfaSetup.verificationCode);
    try {
      const client = new CognitoIdentityProviderClient({ region: 'ap-southeast-1' });
      
      // Verify the TOTP code
      const verifyCommand = new VerifySoftwareTokenCommand({
        AccessToken: auth.user?.access_token,
        UserCode: mfaSetup.verificationCode
      });
      console.log('Sending VerifySoftwareToken command...');
      
      const verifyResponse = await client.send(verifyCommand);
      console.log('Verification response:', verifyResponse);
      
      // Enable TOTP as preferred MFA
      const preferenceCommand = new SetUserMFAPreferenceCommand({
        AccessToken: auth.user?.access_token,
        SoftwareTokenMfaSettings: { Enabled: true, PreferredMfa: true }
      });
      console.log('Setting MFA preference...');
      
      const preferenceResponse = await client.send(preferenceCommand);
      console.log('MFA preference response:', preferenceResponse);
      
      setMfaSetup({ show: false, qrCode: '', secret: '', verificationCode: '' });
      setMfaEnabled(true);
      console.log('MFA setup completed successfully!');
      alert('MFA setup completed successfully!');
    } catch (error) {
      console.error('MFA verification error:', error);
      alert('Invalid verification code. Please try again.');
    }
  };

  // Main authenticated UI with SPA navigation between home and MFA views
  if (auth.isAuthenticated) {
    return (
      <div className={theme.layout.page}>
        <Navbar 
          mfaEnabled={mfaEnabled}
          showMfaManage={false}
          setShowMfaManage={() => {}}
          showTokens={showTokens}
          setShowTokens={setShowTokens}
          onSignOut={signOutRedirect}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        <div className={theme.layout.container}>
          <div className="max-w-4xl mx-auto">
            <div className={theme.card}>
              
              <div className="p-6">
                {/* MFA Management View */}
                {currentView === 'mfa' && (
                  <div>
                    <div className="flex items-center mb-6">
                      <button onClick={() => setCurrentView('home')} className="mr-4 text-blue-600 hover:text-blue-800">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h1 className="text-2xl font-bold text-gray-900">Multi-Factor Authentication</h1>
                    </div>
                    
                    {loading && (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                        <div className="h-32 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    )}
                    
                    {!loading && !mfaEnabled && !mfaSetup.show && (
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

                    {!loading && mfaEnabled && (
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
                )}

                {/* Home Dashboard View */}
                {currentView === 'home' && (
                  <div>
                    {/* MFA Status Indicator */}
                    {mfaEnabled && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Multi-Factor Authentication</h2>
                    <div className={theme.alert.success}>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-green-800">MFA is Active</h3>
                          <p className="text-sm text-green-700">Your account is protected with TOTP authentication</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Profile Information */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">User Information</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{auth.user?.profile.email || 'User'}</p>
                        <p className="text-sm text-gray-500">
                          {auth.user?.profile.identities ? 'Authenticated via Microsoft AD' : 'Authenticated via Cognito'}
                        </p>
                        <div className="mt-2">
                          <p className="text-xs text-gray-400">Groups:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {/* Cognito Groups */}
                            {auth.user?.profile['cognito:groups']?.map((group: string) => (
                              <span key={group} className={theme.badge.blue}>
                                {group}
                              </span>
                            ))}
                            {/* ADFS Groups */}
                            {(() => {
                              const adfsGroups = auth.user?.profile['custom:adfs_groups'];
                              // console.log('ADFS Groups for display:', adfsGroups);
                              if (!adfsGroups) return null;
                              
                              // Handle both string and array formats
                              const groupsArray: string[] = typeof adfsGroups === 'string' 
                                ? adfsGroups.split(',').map(g => g.trim())
                                : Array.isArray(adfsGroups) ? adfsGroups : [];
                              
                              return groupsArray.map((group: string) => {
                                const decodedGroup = decodeURIComponent(group).replace(/.*\\/, '');
                                return (
                                  <span key={group} className={theme.badge.green}>
                                    {decodedGroup}
                                  </span>
                                );
                              });
                            })()}
                            {(!auth.user?.profile['cognito:groups'] && !auth.user?.profile['custom:adfs_groups']) && 
                              <span className="text-xs text-gray-400">No groups assigned</span>
                            }
                          </div>
                          {/* Debug: Show all profile attributes */}
                          {(() => {
                            // console.log('Full User Profile:', auth.user?.profile);
                            // console.log('All Profile Keys:', Object.keys(auth.user?.profile || {}));
                            
                            const adfsGroups = auth.user?.profile['custom:adfs_groups'];
                            // console.log('custom:adfs_groups:', adfsGroups);
                            
                            // Check for other possible group attributes
                            const possibleGroupKeys = Object.keys(auth.user?.profile || {}).filter(key => 
                              key.toLowerCase().includes('group') || key.toLowerCase().includes('adfs')
                            );
                            // console.log('Possible group keys:', possibleGroupKeys);
                            
                            return (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <p className="text-yellow-700 font-medium">Debug - All Profile Attributes:</p>
                                <p className="text-yellow-600 break-all text-xs">{JSON.stringify(auth.user?.profile, null, 2)}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Application Launcher with Access Control */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Applications</h2>
                  <div className="grid gap-4">
                    {Object.entries(appConfig).map(([appKey, app]) => {
                      const userHasAccess = hasAccess(appKey);
                      
                      return userHasAccess ? (
                        <div key={appKey} className={`${app.color} rounded-lg p-6 text-white`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold mb-2">{app.name}</h3>
                              <p className="text-blue-100 mb-4">{app.description}</p>
                              <button 
                                onClick={() => {
                                  const token = auth.user?.id_token;
                                  if (appKey === 'hr-system') {
                                    window.open(`https://hr.nttdata-cs.com?token=${token}`, '_blank');
                                  } else if (appKey === 'finance-dashboard') {
                                    window.open(`https://finance.nttdata-cs.com?token=${token}`, '_blank');
                                  }
                                }}
                                className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition duration-200"
                              >
                                Launch {app.name.split(' ')[0]}
                              </button>
                            </div>
                            <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div key={appKey} className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
                          <div className="text-center text-gray-500">
                            <svg className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h3 className="text-lg font-medium mb-2">{app.name}</h3>
                            <p className="text-sm">Access restricted - requires: {app.cognitoGroups?.join(', ') || 'specific permissions'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Authentication Tokens Display */}
                {showTokens && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Tokens</h2>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">ID Token</h3>
                        <div className="bg-white p-3 rounded border text-xs font-mono break-all text-gray-600">
                          {auth.user?.id_token}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Access Token</h3>
                        <div className="bg-white p-3 rounded border text-xs font-mono break-all text-gray-600">
                          {auth.user?.access_token}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Refresh Token</h3>
                        <div className="bg-white p-3 rounded border text-xs font-mono break-all text-gray-600">
                          {auth.user?.refresh_token}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login screen for unauthenticated users
  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-indigo-600 px-6 py-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Cognito Microsoft AD Demo</h1>
              <p className="text-indigo-100">Secure authentication with Microsoft Active Directory</p>
            </div>
          </div>
          
          <div className="px-6 py-8">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome</h2>
              <p className="text-gray-600">Sign in with your Microsoft AD credentials to access the application.</p>
            </div>
            
            <button 
              onClick={() => auth.signinRedirect()}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition duration-200 flex items-center justify-center space-x-2 font-medium"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign In with Cognito</span>
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">Powered by AWS Cognito & Microsoft Active Directory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
