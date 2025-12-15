import { useAuth } from "react-oidc-context";

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

  return (
    <nav className="bg-blue-600 text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Cognito Microsoft AD Demo</h1>
          <p className="text-blue-100 text-sm">{auth.user?.profile.email}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <a href="/mfa" className="text-blue-100 hover:text-white text-sm">
            Profile
          </a>
          
          <button
            onClick={() => setShowTokens(!showTokens)}
            className="text-blue-100 hover:text-white text-sm"
          >
            Tokens
          </button>
          
          <button 
            onClick={onSignOut}
            className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}