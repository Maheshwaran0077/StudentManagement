import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, LayoutDashboard, FileText, Network,
  Zap, BarChart2, Users, ClipboardList, Search,
  LogOut, Menu, X, Bell,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/admin/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/admin/grievances',  label: 'Grievances',      icon: FileText },
  { to: '/admin/patterns',    label: 'Patterns',        icon: Network },
  { to: '/admin/actions',     label: 'Actions',         icon: Zap },
  { to: '/admin/outcomes',    label: 'Outcomes',        icon: BarChart2 },
  { to: '/admin/search',      label: 'Semantic Search', icon: Search },
  { to: '/admin/users',       label: 'Users',           icon: Users },
  { to: '/admin/audit',       label: 'Audit Log',       icon: ClipboardList },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
          <ShieldCheck className="w-7 h-7 text-primary-400 shrink-0" />
          <div className="leading-tight">
            <p className="font-bold text-base">Campus Guardian</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-700">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
              }>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="font-semibold text-gray-700 text-lg">Admin Panel</h2>
          <div className="ml-auto flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">{user?.name}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
