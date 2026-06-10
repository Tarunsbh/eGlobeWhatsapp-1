import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, LayoutDashboard, Building2, Users, CreditCard,
  FileText, Activity, ClipboardList, LogOut, Menu, X, ChevronRight,
  Bell, Settings, Tag,
} from 'lucide-react';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

const navItems = [
  { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/hotels', icon: Building2, label: 'Hotels' },
  { to: '/super-admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/super-admin/billing', icon: FileText, label: 'Billing' },
  { to: '/super-admin/pricing', icon: Tag, label: 'Pricing' },
  { to: '/super-admin/monitoring', icon: Activity, label: 'Monitoring' },
  { to: '/super-admin/audit', icon: ClipboardList, label: 'Audit Logs' },
];

export default function SuperAdminLayout() {
  const { admin, logout } = useSuperAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/super-admin/login'); };

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'} flex-shrink-0 bg-[#0d1226] border-r border-gray-800/60 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Master Control</p>
            <p className="text-[10px] text-indigo-400">Platform Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={linkCls}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Admin info */}
        <div className="p-3 border-t border-gray-800/60">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-300 text-xs font-bold">
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-500 truncate">{admin?.role || 'super_admin'}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-[#0d1226] border-b border-gray-800/60 flex items-center gap-4 px-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen((s) => !s)}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>System Online</span>
          </div>

          <button className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <Bell size={16} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
