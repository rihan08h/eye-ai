import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ScanEye, ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'Technology', href: '#technology' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Platform', href: '#platform' },
  { label: 'Impact', href: '#impact' },
  { label: 'About', href: '#about' },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('Home');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl border-b shadow-lg py-3'
          : 'py-5'
      }`}
      style={{
        background: scrolled ? 'rgba(7,13,30,0.85)' : 'transparent',
        borderBottomColor: scrolled ? 'rgba(148,163,184,0.1)' : 'transparent',
        boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between gap-6">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-black text-white tracking-tight">RetinaAI</div>
            <div className="text-[9px] text-slate-500 font-medium leading-none">See Clearly. Act Early.</div>
          </div>
        </Link>

        {/* ── Desktop Nav Links ──────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setActiveLink(link.label)}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all relative ${
                activeLink === link.label
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {link.label}
              {activeLink === link.label && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-400" />
              )}
            </a>
          ))}
        </nav>

        {/* ── Right Actions ──────────────────────────────────────────────── */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 20px rgba(6,182,212,0.35)' }}
            >
              <ScanEye className="w-4 h-4" />
              Command Center
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-800/60 transition-all"
              >
                Sign In
              </Link>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* ── Mobile Hamburger ──────────────────────────────────────────── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-slate-800 transition"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile Menu ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 py-5 border-t space-y-4"
          style={{ background: 'rgba(7,13,30,0.97)', borderColor: 'rgba(148,163,184,0.1)' }}
        >
          <nav className="space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => { setActiveLink(link.label); setMobileOpen(false); }}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={() => { setMobileOpen(false); navigate('/dashboard'); }}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
              >
                Go to Command Center
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-3 rounded-2xl text-sm font-semibold text-slate-300 bg-slate-800/80 border border-slate-700"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); navigate('/login'); }}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
