import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cognito Microsoft AD Demo" },
    { name: "description", content: "AWS Cognito with Microsoft AD integration" },
  ];
}

export default function Home() {
  const auth = useAuth();
  const [showTokens, setShowTokens] = useState(false);

  useEffect(() => {
    if (auth.error && auth.error.message.includes("No matching state found")) {
      window.history.replaceState({}, document.title, window.location.pathname);
      auth.clearStaleState();
    }
  }, [auth.error]);

  const signOutRedirect = () => {
    auth.removeUser();
    const cognitoDomain = "https://auth.nttdata-cs.com";
    const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
    const logoutUri = "https://demo.nttdata-cs.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    if (auth.error.message.includes("No matching state found")) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Authentication Error</h3>
            <p className="text-red-600">{auth.error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Application-Group mapping configuration
  const appConfig = {
    "hr-system": {
      "name": "HR Management",
      "description": "Employee records and HR processes",
      "gradient": "from-green-500 to-green-700",
      "requiredGroups": ["hr-users"],
      "adfsGroups": ["HR Department"],
      "adfsProvider": "ms-adfs"
    },
    "finance-dashboard": {
      "name": "Finance Dashboard",
      "description": "Financial analytics and reporting",
      "gradient": "from-yellow-500 to-yellow-700",
      "requiredGroups": ["finance-team"],
      "adfsGroups": ["Finance Department"],
      "adfsProvider": "ms-adfs"
    }
  };

  // Function to check if user has access to an application
  const hasAccess = (appKey: string) => {
    const app = appConfig[appKey as keyof typeof appConfig];
    if (!app) return false;

    // Check if user is from ADFS
    const isAdfsUser = auth.user?.profile['cognito:groups']?.some((group: string) => 
      group.includes('ms-adfs')
    );

    if (isAdfsUser) {
      // For ADFS users, grant access if they have the ADFS provider group
      // This simulates having the required ADFS groups
      return app.adfsGroups.length > 0;
    } else {
      // For Cognito users, check specific required groups
      return app.requiredGroups.some(group => 
        auth.user?.profile['cognito:groups']?.includes(group)
      );
    }
  };

  if (auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Welcome!</h1>
                    <p className="text-blue-100">Successfully authenticated with Microsoft AD</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-blue-100 text-sm">Connected</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
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
                              <span key={group} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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
                                  <span key={group} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
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

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Applications</h2>
                  <div className="grid gap-4">
                    {Object.entries(appConfig).map(([appKey, app]) => {
                      const userHasAccess = hasAccess(appKey);
                      
                      return userHasAccess ? (
                        <div key={appKey} className={`bg-gradient-to-r ${app.gradient} rounded-lg p-6 text-white`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold mb-2">{app.name}</h3>
                              <p className="text-blue-100 mb-4">{app.description}</p>
                              <button className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition duration-200">
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
                            <p className="text-sm">Access restricted - requires: {app.requiredGroups.join(', ')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Authentication Tokens</h2>
                    <button
                      onClick={() => setShowTokens(!showTokens)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      {showTokens ? 'Hide' : 'Show'} Tokens
                    </button>
                  </div>
                  
                  {showTokens && (
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
                  )}
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => signOutRedirect()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-8">
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
