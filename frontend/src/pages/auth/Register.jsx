import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, Eye, EyeOff, Lock, Mail, User, Phone, Building2,
  Shield, AlertCircle, CheckCircle, Sparkles, Stethoscope, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const ROLES = [
  {
    value: 'healthworker',
    label: 'Health Worker',
    description: 'Frontline screening, camp outreach, patient registration',
    icon: UserCheck,
    color: '#06b6d4',
  },
  {
    value: 'doctor',
    label: 'Doctor / Specialist',
    description: 'Review high-risk referrals, confirmed diagnosis & treatment',
    icon: Stethoscope,
    color: '#3b82f6',
  },
  {
    value: 'admin',
    label: 'System Admin',
    description: 'Manage clinical users, camp allocations & macro analytics',
    icon: Shield,
    color: '#8b5cf6',
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'healthworker',
    phone: '',
    organization: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData);
      toast.success('Account created! Welcome to RetinaAI.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check the entered information.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (() => {
    const p = formData.password;
    if (p.length === 0) return null;
    if (p.length < 6) return { level: 'weak', label: 'Too short (min 6)', color: 'bg-red-500', width: 'w-1/3' };
    if (p.length < 10) return { level: 'medium', label: 'Adequate', color: 'bg-amber-500', width: 'w-2/3' };
    return { level: 'strong', label: 'Strong Security', color: 'bg-emerald-500', width: 'w-full' };
  })();

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-8 bg-grid-cyber relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed top-1/3 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 border border-cyan-300/30 group-hover:scale-105 transition">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">RetinaAI</span>
          </Link>
        </div>

        {/* Register Card */}
        <div className="glass-panel-elevated rounded-3xl p-8 sm:p-10 border border-cyan-500/20 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top glare line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clinician Enrollment</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Create Your Account
            </h2>
            <p className="text-xs text-slate-400">
              Join the explainable retinal screening network
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Select Your Healthcare Role *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.value;
                  return (
                    <label
                      key={role.value}
                      className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 block relative ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-400/60 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={isSelected}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: `${role.color}15`,
                            color: role.color,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <p className="font-bold text-xs text-white">{role.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{role.description}</p>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="name"
                name="name"
                type="text"
                label="Full Name"
                required
                icon={User}
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. Rajesh Kumar"
              />

              <Input
                id="reg-email"
                name="email"
                type="email"
                label="Email Address"
                required
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
                placeholder="rajesh@phc-rural.org"
              />
            </div>

            {/* Phone and Organization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="phone"
                name="phone"
                type="tel"
                label="Contact Phone (Optional)"
                icon={Phone}
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
              />

              <Input
                id="organization"
                name="organization"
                type="text"
                label="Health Centre / Organization"
                icon={Building2}
                value={formData.organization}
                onChange={handleChange}
                placeholder="Channapatna Primary Health Centre"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Account Password"
                required
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
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

              {/* Password Strength Meter */}
              {passwordStrength && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color} ${passwordStrength.width}`}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <Button
              id="btn-register"
              type="submit"
              variant="cyan"
              loading={loading}
              className="w-full py-3 text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] mt-2"
            >
              Create Clinician Account
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-cyan-400 hover:text-cyan-300 transition"
            >
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
