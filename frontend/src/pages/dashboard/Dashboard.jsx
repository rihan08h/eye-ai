import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users, ScanEye, AlertTriangle, GitBranch,
  RefreshCw, UserPlus, ArrowRight, Activity, Eye, CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { analyticsService } from '../../services/entities.service';
import MetricCard from '../../components/ui/MetricCard';
import StatusBadge from '../../components/ui/StatusBadge';
import RiskBadge from '../../components/common/RiskBadge';
import ChatWidget from '../../components/common/ChatWidget';
import Skeleton from '../../components/ui/Skeleton';

const SEVERITY_COLORS = {
  'No DR': '#34c98c',
  Mild: '#f5b942',
  Moderate: '#e08a3c',
  Severe: '#ef5b5b',
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
    <div className="space-y-8">
      {/* ─── Clinical Header Banner ────────────────────────────────────── */}
      <div className="bg-[#0f1d23] rounded-3xl p-6 sm:p-8 border border-white/[0.085] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Subtle top sheen */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#18b8d4]/30 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-white/[0.085] bg-white/[0.03] text-[#a3b1b7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18b8d4] shadow-[0_0_8px_#18b8d4]" />
              <span>Clinical Workspace · Active Telemetry</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#f2f6f7] tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#18b8d4] to-[#3d6ee8]">{user?.name?.split(' ')[0]}</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#a3b1b7] max-w-2xl leading-relaxed">
              {user?.role === 'doctor'
                ? 'Review high-risk referrals, verify Grad-CAM lesion maps, and manage specialist clinical queues.'
                : user?.role === 'admin'
                ? 'Operational population analytics, camp allocations, and frontline clinical screening yield.'
                : 'Frontline fundus acquisition, explainable lesion heatmaps, and automated referral triage.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/patients/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.14] bg-white/[0.03] text-[#f2f6f7] hover:border-[#18b8d4] hover:text-[#18b8d4] transition text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Register Patient
            </button>

            <button
              onClick={() => navigate('/screenings/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#18b8d4] text-[#03212a] hover:bg-[#3fd0e8] transition text-xs sm:text-sm font-semibold shadow-[0_8px_24px_-10px_rgba(24,184,212,0.8)] cursor-pointer"
            >
              <ScanEye className="w-4 h-4" />
              New Screening <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── KPI Metrics Grid ──────────────────────────────────────────── */}
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

      {/* ─── Visual Analytics Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DR Severity Distribution Chart */}
        <div className="lg:col-span-6 bg-[#0f1d23] rounded-3xl p-6 space-y-4 border border-white/[0.085] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between border-b border-white/[0.085] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#f2f6f7] tracking-tight">Diabetic Retinopathy Distribution</h2>
              <p className="text-[11px] text-[#6f8188]">Grad-CAM verified severity classification</p>
            </div>
            <Link to="/analytics" className="text-xs font-semibold text-[#18b8d4] hover:underline flex items-center gap-1">
              Detailed Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {severityChartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#6f8188" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6f8188" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a161b',
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                      color: '#f2f6f7',
                      fontSize: '12px',
                    }}
                    formatter={(val, name, item) => [`${val} screenings (${item.payload.percentage}%)`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {severityChartData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#18b8d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
                <div className="w-10 h-10 rounded-full bg-[#18b8d4]/10 border border-[#18b8d4]/20 flex items-center justify-center text-[#18b8d4] mb-2">
                  <ScanEye className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#f2f6f7]">No Retinal Screenings Yet</p>
                <p className="text-[11px] text-[#6f8188] mt-1 max-w-xs">
                  Severity distribution across 5 ICDR clinical stages will render in real time when fundus scans are evaluated.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Activity Trend Chart */}
        <div className="lg:col-span-6 bg-[#0f1d23] rounded-3xl p-6 space-y-4 border border-white/[0.085] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between border-b border-white/[0.085] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#f2f6f7] tracking-tight">Screening Volume (Past 7 Days)</h2>
              <p className="text-[11px] text-[#6f8188]">Daily throughput across clinical sessions</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="p-1.5 text-[#a3b1b7] hover:text-[#18b8d4] rounded-lg hover:bg-white/[0.04] transition cursor-pointer"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18b8d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#18b8d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#6f8188" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6f8188" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a161b',
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      color: '#f2f6f7',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#18b8d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#cyanArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
                <div className="w-10 h-10 rounded-full bg-[#3d6ee8]/10 border border-[#3d6ee8]/20 flex items-center justify-center text-[#3d6ee8] mb-2">
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#f2f6f7]">No Activity in Past 7 Days</p>
                <p className="text-[11px] text-[#6f8188] mt-1 max-w-xs">
                  Daily screening throughput and high-risk case counts will update here dynamically.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Lower Activity & Queues Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Screenings Feed */}
        <div className="bg-[#0f1d23] rounded-3xl p-6 space-y-4 border border-white/[0.085]">
          <div className="flex items-center justify-between border-b border-white/[0.085] pb-3">
            <h2 className="text-sm font-bold text-[#f2f6f7] flex items-center gap-2">
              <ScanEye className="w-4 h-4 text-[#18b8d4]" />
              Recent Screenings
            </h2>
            <Link to="/screenings" className="text-xs font-semibold text-[#18b8d4] hover:underline">
              View All ({recentScreenings.length}) →
            </Link>
          </div>

          {recentScreenings.length > 0 ? (
            <div className="space-y-2">
              {recentScreenings.map((sc) => (
                <div
                  key={sc._id}
                  onClick={() => navigate(`/screenings/${sc._id}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[#18b8d4]/30 hover:bg-white/[0.04] transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#18b8d4]/10 border border-[#18b8d4]/20 flex items-center justify-center text-[#18b8d4] font-bold text-xs">
                      {sc.eyeSide === 'OD' ? 'OD' : 'OS'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#f2f6f7]">
                        {sc.patientId?.name || 'Anonymous Patient'}
                      </p>
                      <p className="text-[10px] text-[#6f8188]">
                        ID: {sc.screeningNumber || sc._id.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={sc.diagnosis?.severity || 'No DR'} size="sm" />
                    <ArrowRight className="w-3.5 h-3.5 text-[#6f8188]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6f8188] text-center py-8">
              No recent screenings recorded in current dataset.
            </p>
          )}
        </div>

        {/* Urgent Referrals Feed */}
        <div className="bg-[#0f1d23] rounded-3xl p-6 space-y-4 border border-white/[0.085]">
          <div className="flex items-center justify-between border-b border-white/[0.085] pb-3">
            <h2 className="text-sm font-bold text-[#f2f6f7] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ef5b5b]" />
              Urgent Cases Requiring Action
            </h2>
            <Link to="/referrals" className="text-xs font-semibold text-[#ef5b5b] hover:underline">
              Referral Pipeline →
            </Link>
          </div>

          {urgentCases.length > 0 ? (
            <div className="space-y-2">
              {urgentCases.map((ref) => (
                <div
                  key={ref._id}
                  onClick={() => navigate('/referrals')}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#ef5b5b]/5 border border-[#ef5b5b]/20 hover:bg-[#ef5b5b]/10 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ef5b5b]/20 text-[#ef5b5b] flex items-center justify-center font-bold text-xs">
                      !
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#f2f6f7]">
                        {ref.patientId?.name || 'High-Risk Case'}
                      </p>
                      <p className="text-[10px] text-[#6f8188]">
                        Priority: {ref.priority || 'URGENT'}
                      </p>
                    </div>
                  </div>
                  <RiskBadge riskLevel="high" label="Urgent Review" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-[#34c98c] py-8">
              <CheckCircle2 className="w-4 h-4" />
              <span>All high-risk cases have active specialist referrals!</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Clinical Assistant */}
      <ChatWidget />
    </div>
  );
}
