import { useState } from 'react';
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom';
import { prefetchProps } from '../lib/prefetch';
import {
  Activity, LayoutDashboard, Users, ScanEye, ClipboardList,
  GitBranch, Tent, BarChart3, FileText, Bot, Settings,
  LogOut, Menu, X, ChevronRight, Globe, Wifi, WifiOff, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import OfflineBanner from '../components/common/OfflineBanner';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', key: 'dashboard', icon: LayoutDashboard, roles: ['healthworker', 'doctor', 'admin'] },
  { to: '/patients', label: 'Patients', key: 'patients', icon: Users, roles: ['healthworker', 'doctor', 'admin'] },
  { to: '/screenings/new', label: 'New Screening', key: 'newScreening', icon: ScanEye, roles: ['healthworker'] },
  { to: '/screenings', label: 'Screenings', key: 'screenings', icon: ClipboardList, roles: ['healthworker', 'doctor', 'admin'] },
  { to: '/referrals', label: 'Referrals', key: 'referrals', icon: GitBranch, roles: ['healthworker', 'doctor', 'admin'] },
  { to: '/camps', label: 'Screening Camps', key: 'camps', icon: Tent, roles: ['healthworker', 'admin'] },
  { to: '/analytics', label: 'Analytics', key: 'analytics', icon: BarChart3, roles: ['doctor', 'admin'] },
  { to: '/reports', label: 'Reports', key: 'reports', icon: FileText, roles: ['healthworker', 'doctor', 'admin'] },
  { to: '/assistant', label: 'AI Assistant', key: 'assistant', icon: Bot, roles: ['healthworker', 'doctor', 'admin'] },
  { to: '/settings', label: 'Settings', key: 'settings', icon: Settings, roles: ['healthworker', 'doctor', 'admin'] },
];

const ROLE_BADGE = {
  healthworker: { label: 'Health Worker', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' },
  doctor: { label: 'Doctor / Specialist', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/30' },
  admin: { label: 'Admin', color: 'bg-purple-500/10 text-purple-400 border border-purple-500/30' },
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t, currentLang, changeLanguage, languages } = useLanguage();
  const { isOnline, pendingCount } = useOffline();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/login');
    } catch {
      toast.error('Logout failed.');
    }
  };

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user?.role || 'healthworker'));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#060b17] border-r border-slate-800/80">
      {/* Brand Logo Header */}
      <Link to="/" className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 border border-cyan-300/30 group-hover:scale-105 transition-transform">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-black text-base tracking-tight group-hover:text-cyan-400 transition-colors">
              RetinaAI
            </span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              HUD
            </span>
          </div>
          <p className="text-slate-400 text-[10px]">Explainable Clinical Platform</p>
        </div>
      </Link>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              {...prefetchProps(item.to)}
              end={item.to === '/screenings'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-transparent text-white border border-cyan-500/40 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  <span className="flex-1 tracking-wide">{t(item.key) || item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 opacity-80" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile at bottom */}
      <div className="border-t border-slate-800/80 p-4 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow-md">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{user?.name || 'Clinician'}</p>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-semibold mt-0.5 ${ROLE_BADGE[user?.role]?.color || ROLE_BADGE.healthworker.color}`}>
              {ROLE_BADGE[user?.role]?.label || 'Health Worker'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#030712] text-slate-100 overflow-hidden font-sans bg-grid-cyber">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 relative z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 flex flex-col w-64 shadow-2xl">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-[#060b17]/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
          <button
            className="lg:hidden text-slate-400 hover:text-white transition p-1.5 rounded-lg bg-slate-900 border border-slate-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {user?.organization || 'Rural Health Centre'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Multilingual Quick Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl">
              <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer pr-1"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.native}
                  </option>
                ))}
              </select>
            </div>

            {/* Network / Offline Status Pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
              {pendingCount > 0 && (
                <span className="bg-cyan-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1">
                  {pendingCount} queued
                </span>
              )}
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Offline Banner if disconnected or pending queue */}
        <OfflineBanner />

        {/* Page Content Stream with spacious breathing room */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#030712]/70">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
