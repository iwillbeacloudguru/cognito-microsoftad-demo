import { useAuth } from "react-oidc-context";
import { useState } from "react";

interface NavbarProps {
  mfaEnabled: boolean;
  showMfaManage: boolean;
  setShowMfaManage: (show: boolean) => void;
  showTokens: boolean;
  setShowTokens: (show: boolean) => void;
  onSignOut: () => void;
}

export default function Navbar({ 
  mfaEnabled, 
  showMfaManage, 
  setShowMfaManage, 
  showTokens, 
  setShowTokens, 
  onSignOut 
}: NavbarProps) {
  const auth = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="bg-blue-600 text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Cognito Microsoft AD Demo</h1>
          <p className="text-blue-100 text-sm">{auth.user?.profile.email}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center text-blue-100 hover:text-white text-sm"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Menu
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <a href="/mfa" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile & MFA
                  </a>
                  <button
                    onClick={() => { setShowTokens(!showTokens); setShowDropdown(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {showTokens ? 'Hide' : 'Show'} Tokens
                  </button>
                  <button
                    onClick={() => { onSignOut(); setShowDropdown(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}