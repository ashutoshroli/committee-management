import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiUsers, FiDollarSign, FiCalendar, FiSettings, FiUserCheck, FiLogOut } from 'react-icons/fi';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: FiHome, label: 'Dashboard' },
    { to: '/members', icon: FiUsers, label: 'Members' },
    { to: '/loans', icon: FiDollarSign, label: 'Loans' },
    { to: '/instalments', icon: FiCalendar, label: 'Instalments' },
    { to: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  // Only show Users page for superadmin and admin
  if (user?.role === 'superadmin' || user?.role === 'admin') {
    navItems.push({ to: '/users', icon: FiUserCheck, label: 'Users' });
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-4 border-b border-indigo-700">
          <h1 className="text-xl font-bold">Committee Mgmt</h1>
          <p className="text-indigo-300 text-sm mt-1">{user?.name}</p>
          <span className="text-xs bg-indigo-700 px-2 py-1 rounded mt-1 inline-block capitalize">{user?.role}</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-indigo-200 hover:bg-indigo-800 w-full transition"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
