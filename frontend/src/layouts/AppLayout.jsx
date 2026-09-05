import { useState } from 'react';
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom';
import { prefetchProps } from '../lib/prefetch';
import {
  LayoutDashboard, Users, ScanEye, ClipboardList,
  GitBranch, Tent, BarChart3, FileText, Bot, Settings,
  LogOut, Menu, X, Globe
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
  healthworker: { label: 'Health Worker', color: 'bg-[#34c98c]/10 text-[#34c98c] border border-[#34c98c]/25' },
  doctor: { label: 'Doctor / Specialist', color: 'bg-[#3d6ee8]/10 text-[#3d6ee8] border border-[#3d6ee8]/25' },
  admin: { label: 'Admin', color: 'bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/25' },
};

const Mark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M2 16c4.4-6.7 8.9-10 13.6-10S24.9 9.3 30 16c-4.7 6.7-9.4 10-14.2 10S6.4 22.7 2 16Z"
      stroke="#18b8d4" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="16" cy="16" r="5.1" stroke="#18b8d4" strokeWidth="1.6" />
    <circle cx="16" cy="16" r="1.9" fill="#3d6ee8" />
  </svg>
);

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
    <div className="flex flex-col h-full bg-[#071014] border-r border-white/[0.085]">
      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.085] group transition-opacity hover:opacity-90">
        <Mark size={28} />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#f2f6f7] font-bold text-base tracking-tight">
              Retina<em className="text-[#18b8d4] not-italic">AI</em>
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-[#18b8d4]/10 text-[#18b8d4] border border-[#18b8d4]/20">
              CLINICAL
            </span>
          </div>
          <p className="text-[#6f8188] text-[11px] font-medium tracking-wide">Explainable Screening</p>
        </div>
      </Link>

      {/* Navigation Links */}
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
                    ? 'bg-[#18b8d4]/10 text-[#18b8d4] border border-[#18b8d4]/25'
                    : 'text-[#a3b1b7] hover:text-[#f2f6f7] hover:bg-white/[0.04] border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#18b8d4]' : 'text-[#6f8188] group-hover:text-[#a3b1b7]'
                    }`}
                  />
                  <span className="flex-1 tracking-wide">{t(item.key) || item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#18b8d4] shrink-0" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile at Bottom */}
      <div className="border-t border-white/[0.085] p-4 bg-[#0a161b]/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f1d23] border border-white/[0.12] text-[#18b8d4] font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#f2f6f7] text-xs font-semibold truncate">{user?.name || 'Clinician'}</p>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-medium mt-0.5 ${ROLE_BADGE[user?.role]?.color || ROLE_BADGE.healthworker.color}`}>
              {ROLE_BADGE[user?.role]?.label || 'Health Worker'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#a3b1b7] hover:text-[#ef5b5b] hover:bg-[#ef5b5b]/10 transition text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#071014] text-[#f2f6f7] overflow-hidden font-sans bg-grid-cyber">
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
              className="absolute top-4 right-4 text-[#a3b1b7] hover:text-[#f2f6f7] p-1"
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
        <header className="h-16 bg-[#071014]/90 backdrop-blur-md border-b border-white/[0.085] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
          <button
            className="lg:hidden text-[#a3b1b7] hover:text-[#f2f6f7] transition p-1.5 rounded-lg bg-[#0f1d23] border border-white/[0.085]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium text-[#f2f6f7] bg-[#0f1d23] border border-white/[0.085] px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#34c98c] shadow-[0_0_8px_#34c98c]" />
              {user?.organization || 'District Hospital'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Multilingual Selector */}
            <div className="flex items-center gap-1.5 bg-[#0f1d23] border border-white/[0.085] px-2.5 py-1.5 rounded-full">
              <Globe className="w-3.5 h-3.5 text-[#18b8d4]" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-xs font-medium text-[#f2f6f7] focus:outline-none cursor-pointer pr-1"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0f1d23] text-white">
                    {l.native}
                  </option>
                ))}
              </select>
            </div>

            {/* Network Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-[#34c98c]/10 text-[#34c98c] border-[#34c98c]/25'
                : 'bg-[#ef5b5b]/10 text-[#ef5b5b] border-[#ef5b5b]/25'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#34c98c]' : 'bg-[#ef5b5b]'}`} />
              <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
              {pendingCount > 0 && (
                <span className="bg-[#18b8d4] text-[#03212a] text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1">
                  {pendingCount} queued
                </span>
              )}
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#0f1d23] border border-white/[0.12] flex items-center justify-center text-[#18b8d4] font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Offline Notification Banner */}
        <OfflineBanner />

        {/* Page View Stream */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#071014]">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
