import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, LayoutDashboard, PlusCircle,
  FileText, User, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard',         label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/grievances/submit', label: 'Submit Grievance', icon: PlusCircle },
  { to: '/grievances',        label: 'My Grievances',    icon: FileText },
  { to: '/profile',           label: 'Profile',          icon: User },
];

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary-900 text-white flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-primary-700">
          <ShieldCheck className="w-7 h-7 text-primary-300 shrink-0" />
          <span className="font-bold text-lg leading-tight">Campus Guardian</span>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-primary-700">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-primary-300 capitalize">{user?.role}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isActive ? 'bg-primary-600 text-white' : 'text-primary-200 hover:bg-primary-800 hover:text-white'}`
              }>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-primary-700">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-primary-200 hover:bg-primary-800 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-800 ml-auto hidden sm:block">
            Welcome, {user?.name?.split(' ')[0]}
          </span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
