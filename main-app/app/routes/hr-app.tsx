import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/hr-app";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HR Management System" },
    { name: "description", content: "Human Resources Management Application" },
  ];
}

export default function HRApp() {
  const auth = useAuth();
  const navigate = useNavigate();

  // Function to check if user has HR access
  const hasHRAccess = () => {
    if (!auth.user?.profile) return false;

    // Check if user is from ADFS
    const isAdfsUser = auth.user?.profile['cognito:groups']?.some((group: string) => 
      group.includes('ap-southeast-1_gYsQnwNf1_ms-adfs')
    );

    if (isAdfsUser) {
      // ADFS user - check if they match HR patterns
      const userEmail = auth.user?.profile.email || '';
      const username = auth.user?.profile['cognito:username'] || '';
      const userText = `${userEmail} ${username}`.toLowerCase();
      
      return userText.includes('hr-') || userText.includes('human-resource');
    } else {
      // Cognito user - check for HR groups
      return auth.user?.profile['cognito:groups']?.some((group: string) => 
        ['hr-users', 'admin-group'].includes(group)
      );
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated && !hasHRAccess()) {
      // Redirect to home if user doesn't have HR access
      navigate('/');
    }
  }, [auth.isAuthenticated, navigate]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">Access Denied</h3>
            <p className="text-red-600 mb-4">Please sign in to access this application.</p>
            <button 
              onClick={() => auth.signinRedirect()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasHRAccess()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <svg className="h-16 w-16 mx-auto mb-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-red-900 mb-2">Access Denied</h3>
            <p className="text-red-600 mb-4">You don't have permission to access the HR Management System.</p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">HR Management System</h1>
                  <p className="text-blue-100">Employee records and HR processes</p>
                </div>
                <button 
                  onClick={() => navigate('/')}
                  className="bg-white bg-opacity-20 text-blue px-4 py-2 rounded-md hover:bg-opacity-30 transition duration-200"
                >
                  Back to Home
                </button>
              </div>
            </div>
            
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
                    <p className="text-sm text-gray-600">Email: {auth.user?.profile.email}</p>
                    <p className="text-sm text-gray-600">
                      Authentication: {auth.user?.profile.identities ? 'Microsoft AD' : 'Cognito'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Groups:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {auth.user?.profile['cognito:groups']?.map((group: string) => (
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