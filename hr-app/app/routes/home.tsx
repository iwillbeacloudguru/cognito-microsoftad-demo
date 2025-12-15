import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HR Management System" },
    { name: "description", content: "Human Resources Management Application" },
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

  // Function to check if user has HR access
  const hasHRAccess = () => {
    const profile = userProfile || auth.user?.profile;
    console.log('HR Access Check - Profile:', profile);
    if (!profile) return false;

    // Check if user is from ADFS
    const isAdfsUser = profile['cognito:groups']?.some((group: string) => 
      group.includes('ap-southeast-1_gYsQnwNf1_ms-adfs')
    );
    console.log('Is ADFS User:', isAdfsUser);

    if (isAdfsUser) {
      // ADFS user - check if they match HR patterns
      const userEmail = profile.email || '';
      const username = profile['cognito:username'] || '';
      const userText = `${userEmail} ${username}`.toLowerCase();
      console.log('User text for pattern matching:', userText);
      
      const hasHRPattern = userText.includes('hr-') || userText.includes('human-resource');
      console.log('Has HR pattern:', hasHRPattern);
      return hasHRPattern;
    } else {
      // Cognito user - check for HR groups
      const hasHRGroup = profile['cognito:groups']?.some((group: string) => 
        ['hr-users', 'admin-group'].includes(group)
      );
      console.log('Has HR group:', hasHRGroup);
      return hasHRGroup;
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
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated && !tokenFromUrl) {
    // Redirect to main app for authentication
    window.location.href = 'https://demo.nttdata-cs.com';
    return null;
  }

  if (!hasHRAccess()) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <svg className="h-16 w-16 mx-auto mb-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-red-900 mb-2">Access Denied</h3>
            <p className="text-red-600 mb-4">You don't have permission to access the HR Management System.</p>
            <button 
              onClick={() => window.location.href = 'https://demo.nttdata-cs.com'}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
            >
              Back to Main Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50">
      <Navbar 
        userEmail={(userProfile || auth.user?.profile)?.email}
        onSignOut={signOutRedirect}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Employee Directory</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Manage employee profiles and contact information</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                    View Directory
                  </button>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Leave Management</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Process leave requests and manage time off</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200">
                    Manage Leaves
                  </button>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="h-8 w-8 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Payroll</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Manage salary and compensation data</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200">
                    View Payroll
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
                    {tokenFromUrl && <p className="text-sm text-blue-600">Session shared from Main App</p>}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Groups:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(userProfile || auth.user?.profile)?.['cognito:groups']?.map((group: string) => (
                        <span key={group} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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