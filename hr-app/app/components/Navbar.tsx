interface NavbarProps {
  userEmail?: string;
  onSignOut: () => void;
}

export default function Navbar({ userEmail, onSignOut }: NavbarProps) {
  return (
    <nav className="bg-red-600 text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">HR Management System</h1>
          <p className="text-blue-100 text-sm">{userEmail}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onSignOut}
            className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}