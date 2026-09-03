import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users, ScanEye, AlertTriangle, GitBranch,
  TrendingUp, Clock, MapPin, UserPlus, Eye, RefreshCw,
  Activity, ArrowRight, ShieldCheck, CheckCircle2, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { analyticsService } from '../../services/entities.service';
import MetricCard from '../../components/ui/MetricCard';
import GlassCard from '../../components/ui/GlassCard';
import SectionHeading from '../../components/ui/SectionHeading';
import StatusBadge from '../../components/ui/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import ChatWidget from '../../components/common/ChatWidget';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = {
  'No DR': '#10b981',
  Mild: '#f59e0b',
  Moderate: '#f97316',
  Severe: '#ef4444',
  'Proliferative DR': '#a855f7',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getDashboard();
      setData(res.data);
    } catch {
      // Graceful fallback keeping existing data shape
      setData({
        totalPatients: 0,
        totalScreenings: 0,
        screeningsToday: 0,
        highRiskCases: 0,
        pendingReferrals: 0,
        completedReferrals: 0,
        severityDistribution: [
          { name: 'No DR', count: 0, percentage: 0 },
          { name: 'Mild', count: 0, percentage: 0 },
          { name: 'Moderate', count: 0, percentage: 0 },
          { name: 'Severe', count: 0, percentage: 0 },
          { name: 'Proliferative DR', count: 0, percentage: 0 },
        ],
        screeningsOverTime: [],
        recentScreenings: [],
        urgentCases: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const severityChartData = data?.severityDistribution || [];
  const trendChartData = data?.screeningsOverTime || [];
  const recentScreenings = data?.recentScreenings || [];
  const urgentCases = data?.urgentCases || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ─── Command Center Welcome Header ─────────────────────────────── */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-cyan-500/20 shadow-2xl relative overflow-hidden">
        {/* Subtle top glare */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>RETINA COMMAND CENTER • HUD ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {user?.role === 'doctor'
                ? 'Review specialist referrals, confirm clinical diagnoses, and manage hospital queues.'
                : user?.role === 'admin'
                ? 'System operational overview, screening camp outreach, and macro population analytics.'
                : 'Perform explainable retinal fundus screenings and register rural patients for triage.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="md"
              icon={UserPlus}
              onClick={() => navigate('/patients/new')}
            >
              Register Patient
            </Button>

            <Button
              variant="cyan"
              size="md"
              icon={ScanEye}
              onClick={() => navigate('/screenings/new')}
              className="shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              New Screening
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Live Dynamic Setup Notice (shown when registry is empty) ───── */}
      {!loading && (data?.totalPatients ?? 0) === 0 && (data?.totalScreenings ?? 0) === 0 && (
        <div className="glass-panel-elevated rounded-3xl p-6 border border-cyan-500/30 bg-cyan-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Clinical Environment Active</h3>
              <p className="text-xs text-slate-400">All metrics and charts update dynamically. Register your first patient to begin screening.</p>
            </div>
          </div>
          <Button variant="cyan" size="sm" icon={UserPlus} onClick={() => navigate('/patients/new')}>
            Register Patient
          </Button>
        </div>
      )}

      {/* ─── Real Dynamic KPI Metrics Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <Skeleton count={4} variant="card" />
        ) : (
          <>
            <MetricCard
              icon={Users}
              label="Total Patients"
              value={data?.totalPatients ?? 0}
              subtext="Enrolled in Clinical Registry"
              color="cyan"
              to="/patients"
            />
            <MetricCard
              icon={ScanEye}
              label="Total Screenings"
              value={data?.totalScreenings ?? 0}
              subtext={`${data?.screeningsToday ?? 0} evaluated today`}
              color="blue"
              to="/screenings"
            />
            <MetricCard
              icon={AlertTriangle}
              label="High Risk Cases"
              value={data?.highRiskCases ?? 0}
              subtext="Severe NPDR & Proliferative DR"
              color="red"
              to="/referrals"
            />
            <MetricCard
              icon={GitBranch}
              label="Pending Referrals"
              value={data?.pendingReferrals ?? 0}
              subtext={`${data?.completedReferrals ?? 0} completed`}
              color="amber"
              to="/referrals"
            />
          </>
        )}
      </div>

      {/* ─── Visual Charts Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DR Severity Distribution Chart */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 space-y-4 border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Diabetic Retinopathy Distribution</h2>
              <p className="text-[11px] text-slate-400">Grad-CAM verified severity breakdown</p>
            </div>
            <Link to="/analytics" className="text-xs font-mono font-semibold text-cyan-400 hover:underline">
              Detailed Analytics →
            </Link>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {severityChartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0f1d',
                      borderColor: 'rgba(56,189,248,0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val, name, item) => [`${val} screenings (${item.payload.percentage}%)`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {severityChartData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/40">
                <ScanEye className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-300">No Retinal Screenings Yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Severity distribution across 5 clinical stages will compute live when fundus screenings are evaluated.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Activity Trend Chart */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 space-y-4 border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Screening Volume (Past 7 Days)</h2>
              <p className="text-[11px] text-slate-400">Mobile camp and PHC daily activity stream</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {trendChartData.some((d) => d.screenings > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyberScreenings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0f1d',
                      borderColor: 'rgba(56,189,248,0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="screenings"
                    name="Screenings"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cyberScreenings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/40">
                <Activity className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-300">No Activity in Past 7 Days</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Daily screening throughput and high-risk case counts will update here dynamically in real time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tables: Recent Screenings & Urgent Triage Queue ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Screenings Feed */}
        <div className="glass-panel rounded-3xl border border-slate-800/90 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <ScanEye className="w-4 h-4 text-cyan-400" />
              Recent Screenings
            </h2>
            <Link to="/screenings" className="text-xs font-mono font-semibold text-cyan-400 hover:underline">
              View All ({data?.totalScreenings || 0}) →
            </Link>
          </div>

          {recentScreenings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No recent screenings recorded in current dataset.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {recentScreenings.map((s) => (
                <div key={s._id} className="p-4 hover:bg-slate-900/60 flex items-center justify-between transition">
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs sm:text-sm text-white">{s.patient?.name || 'Patient'}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      {s.patient?.patientId} • <span className="text-slate-300 font-semibold">{s.prediction}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskBadge riskLevel={s.riskLevel} />
                    <Link
                      to={`/screenings/${s._id}`}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-xl transition"
                      title="Inspect Screening Assessment"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent Triage Queue Feed */}
        <div className="glass-panel rounded-3xl border border-red-500/20 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-red-950/20">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              Urgent Cases Requiring Action
            </h2>
            <Link to="/referrals" className="text-xs font-mono font-semibold text-red-400 hover:underline">
              Referral Pipeline →
            </Link>
          </div>

          {urgentCases.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All high-risk cases have active specialist referrals!</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {urgentCases.map((s) => (
                <div key={s._id} className="p-4 hover:bg-red-950/20 flex items-center justify-between transition">
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-white">{s.patient?.name}</p>
                    <p className="text-xs text-red-400 font-bold">{s.prediction}</p>
                  </div>
                  <Link
                    to={`/screenings/${s._id}`}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-red-500/25 transition"
                  >
                    Refer to Doctor →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Health Assistant */}
      <ChatWidget />
    </div>
  );
}
