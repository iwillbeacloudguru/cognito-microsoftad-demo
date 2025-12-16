import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import { theme } from "../styles/theme";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Finance Management System" },
    { name: "description", content: "Financial Management Application" },
  ];
}

export default function Home() {
  const auth = useAuth();
  const [tokenFromUrl, setTokenFromUrl] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Check for token in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setTokenFromUrl(token);
      // Decode JWT token to get user profile
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded token payload:', payload);
        setUserProfile(payload);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // Function to check if user has Finance access
  const hasFinanceAccess = () => {
    const profile = userProfile || auth.user?.profile;
    console.log('Finance Access Check - Profile:', profile);
    if (!profile) return false;

    // Check if user is from ADFS
    const isAdfsUser = profile['cognito:groups']?.some((group: string) => 
      group.includes('ap-southeast-1_gYsQnwNf1_ms-adfs')
    );
    console.log('Is ADFS User:', isAdfsUser);

    if (isAdfsUser) {
      // ADFS user - check if they match Finance patterns
      const userEmail = profile.email || '';
      const username = profile['cognito:username'] || '';
      const userText = `${userEmail} ${username}`.toLowerCase();
      console.log('User text for pattern matching:', userText);
      
      const hasFinancePattern = userText.includes('finance-') || userText.includes('accounting') || userText.includes('treasury');
      console.log('Has Finance pattern:', hasFinancePattern);
      return hasFinancePattern;
    } else {
      // Cognito user - check for Finance groups
      const hasFinanceGroup = profile['cognito:groups']?.some((group: string) => 
        ['finance-users', 'accounting-group', 'admin-group'].includes(group)
      );
      console.log('Has Finance group:', hasFinanceGroup);
      return hasFinanceGroup;
    }
  };

  const signOutRedirect = async () => {
    try {
      // Clear local session first
      await auth.removeUser();
      
      // Revoke tokens at Cognito
      const cognitoDomain = "https://auth.nttdata-cs.com";
      const clientId = "5tai0tc43qpu5fq4l8hukmh9q3";
      const logoutUri = "https://demo.nttdata-cs.com";
      
      // Use Cognito's logout endpoint which revokes sessions
      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}&response_type=code`;
    } catch (error) {
      console.error('Error during signout:', error);
      // Fallback to direct redirect
      window.location.href = "https://demo.nttdata-cs.com";
    }
  };

  if (auth.isLoading) {
    return (
      <div className={theme.layout.pageGreen}>
        <div className="animate-pulse">
          <div className="bg-green-600 h-16 mb-8"></div>
          <div className={theme.layout.container}>
            <div className="max-w-6xl mx-auto">
              <div className={theme.card}>
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="h-40 bg-gray-200 rounded"></div>
                  <div className="h-40 bg-gray-200 rounded"></div>
                  <div className="h-40 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated && !tokenFromUrl) {
    // Redirect to main app for authentication
    window.location.href = 'https://demo.nttdata-cs.com';
    return null;
  }

  if (!hasFinanceAccess()) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <svg className="h-16 w-16 mx-auto mb-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-green-900 mb-2">Access Denied</h3>
            <p className="text-green-600 mb-4">You don't have permission to access the Finance Management System.</p>
            <button 
              onClick={() => window.location.href = 'https://demo.nttdata-cs.com'}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
            >
              Back to Main Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.layout.pageGreen}>
      <Navbar 
        userEmail={(userProfile || auth.user?.profile)?.email}
        onSignOut={signOutRedirect}
      />
      <div className={theme.layout.container}>
        <div className="max-w-6xl mx-auto">
          <div className={theme.card}>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Financial Reports</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Generate and view financial statements and reports</p>
                  <button className={theme.button.primary}>
                    View Reports
                  </button>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Budget Management</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Plan and track departmental budgets and expenses</p>
                  <button className={theme.button.success}>
                    Manage Budgets
                  </button>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Expense Tracking</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Monitor and approve company expenses</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200">
                    Track Expenses
                  </button>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Investment Portfolio</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Manage company investments and assets</p>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition duration-200">
                    View Portfolio
                  </button>
                </div>

                <div className="bg-indigo-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-indigo-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Tax Management</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Handle tax calculations and compliance</p>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200">
                    Manage Taxes
                  </button>
                </div>

                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Risk Analysis</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Assess financial risks and compliance</p>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200">
                    Analyze Risks
                  </button>
                </div>
              </div>

              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Access Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email: {(userProfile || auth.user?.profile)?.email}</p>
                    <p className="text-sm text-gray-600">
                      Authentication: {(userProfile || auth.user?.profile)?.identities ? 'Microsoft AD' : 'Cognito'}
                    </p>
                    {tokenFromUrl && <p className="text-sm text-green-600">Session shared from Main App</p>}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Groups:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(userProfile || auth.user?.profile)?.['cognito:groups']?.map((group: string) => (
                        <span key={group} className={theme.badge.green}>
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}