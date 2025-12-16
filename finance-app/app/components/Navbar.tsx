interface NavbarProps {
  userEmail?: string;
  onSignOut: () => void;
}

export default function Navbar({ userEmail, onSignOut }: NavbarProps) {
  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h1 className="text-xl font-bold">Finance Management System</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {userEmail && (
              <span className="text-green-100">
                {userEmail}
              </span>
            )}
            <button
              onClick={onSignOut}
              className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-md transition duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}