import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity, Eye, EyeOff, Lock, Mail, AlertCircle, Sparkles,
  ShieldCheck, WifiOff, Brain, ArrowRight, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData);
      toast.success('Welcome back to RetinaAI!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col lg:flex-row bg-grid-cyber relative overflow-hidden">
      {/* Background Radial Lights */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ─── LEFT PANEL: Medical AI Environment Visual ──────────────────── */}
      <div className="lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative z-10 border-b lg:border-b-0 lg:border-r border-cyan-500/15">
        {/* Brand Header */}
        <Link to="/" className="flex items-center gap-3 w-fit group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 border border-cyan-300/30 group-hover:scale-105 transition">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-white tracking-tight group-hover:text-cyan-400 transition">
                RetinaAI
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400">Clinical Screening Environment</p>
          </div>
        </Link>

        {/* Center Visual Context */}
        <div className="py-12 space-y-8">
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Ophthalmic AI</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Continue to intelligent <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                retinal screening.
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Sign in to manage patient registries, execute offline-ready fundus classifications, and track specialist referrals.
            </p>
          </div>

          {/* Three Clinical Benefits */}
          <div className="space-y-3.5 max-w-md">
            {[
              {
                icon: ShieldCheck,
                title: 'Secure Patient Records',
                desc: 'Compliant electronic health records and longitudinal progression tracking.',
              },
              {
                icon: WifiOff,
                title: 'Offline-Ready Workflow',
                desc: 'Uninterrupted screening in remote camps with automated IndexedDB cloud sync.',
              },
              {
                icon: Brain,
                title: 'Explainable AI & Grad-CAM',
                desc: 'Transparent lesion heatmaps justifying every clinical prediction.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl glass-card border border-slate-800/80"
                >
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Encrypted Session</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>Role-Based Healthcare Access</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Authentication Form ───────────────────────────── */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Card Container */}
          <div className="glass-panel-elevated rounded-3xl p-8 sm:p-10 border border-cyan-500/20 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top subtle glare */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-400">
                Access your clinical screening workspace
              </p>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="login-email"
                name="email"
                type="email"
                label="Email Address"
                required
                autoComplete="email"
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
                placeholder="clinician@hospital.org"
              />

              <Input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                required
                autoComplete="current-password"
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-200 transition p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button
                id="btn-login"
                type="submit"
                variant="cyan"
                loading={loading}
                className="w-full mt-2 py-3 text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Sign In to Platform
              </Button>
            </form>

            {/* Switch to Register */}
            <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              New to RetinaAI?{' '}
              <Link
                to="/register"
                className="font-bold text-cyan-400 hover:text-cyan-300 transition"
              >
                Create Account →
              </Link>
            </div>
          </div>

          {/* Quick Registration Reminder */}
          <div className="p-3.5 rounded-2xl glass-card border border-slate-800 text-center text-xs text-slate-400">
            Registered accounts can operate as Health Worker, Doctor, or Admin.
          </div>
        </div>
      </div>
    </div>
  );
}
