import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Users, ScanEye, AlertTriangle, GitBranch,
  TrendingUp, MapPin, RefreshCw, CheckCircle2, Eye
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import { analyticsService } from '../../services/entities.service';
import MetricCard from '../../components/ui/MetricCard';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const SEVERITY_COLORS = {
  'No DR': '#10b981',
  Mild: '#f59e0b',
  Moderate: '#f97316',
  Severe: '#ef4444',
  'Proliferative DR': '#a855f7',
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getDashboard();
      setData(res.data);
    } catch {
      toast.error('Failed to load clinical analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton count={4} variant="card" />
      </div>
    );
  }

  const severityChartData = data?.severityDistribution || [];
  const trendChartData = data?.screeningsOverTime || [];
  const villageChartData = data?.villageDistribution || [];
  const referralChartData = data?.referralDistribution || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <SectionHeading
        badge="Population Epidemiology"
        icon={BarChart3}
        title="Population Eye Health Analytics"
        subtitle="Aggregated epidemiology indicators, disease prevalence breakdown, and referral metrics"
        action={
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchAnalytics}
          >
            Refresh Telemetry
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Total Patients"
          value={data?.totalPatients || 0}
          subtext="Enrolled across health centres"
          color="cyan"
          to="/patients"
        />
        <MetricCard
          icon={ScanEye}
          label="Total Screenings"
          value={data?.totalScreenings || 0}
          subtext={`${data?.screeningsToday || 0} evaluated today`}
          color="blue"
          to="/screenings"
        />
        <MetricCard
          icon={AlertTriangle}
          label="High Risk Cases"
          value={data?.highRiskCases || 0}
          subtext="Severe NPDR & Proliferative DR"
          color="red"
          to="/referrals"
        />
        <MetricCard
          icon={GitBranch}
          label="Pending Referrals"
          value={data?.pendingReferrals || 0}
          subtext={`${data?.completedReferrals || 0} completed`}
          color="amber"
          to="/referrals"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DR Severity Breakdown */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 border border-slate-800 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white tracking-tight">Diabetic Retinopathy Severity Distribution</h2>
            <p className="text-xs text-slate-400">Classification distribution across all evaluated fundus images</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
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
                <p className="text-xs font-bold text-slate-300">No Screening Data Available</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Severity distribution across 5 clinical stages will compute automatically when fundus screenings are performed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Screening Trend */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 border border-slate-800 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white tracking-tight">Screening Activity Trend (Past 7 Days)</h2>
            <p className="text-xs text-slate-400">Daily retinal screening volume vs detected high-risk cases</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {trendChartData.some((d) => d.screenings > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScreenings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
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
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Area
                    type="monotone"
                    dataKey="screenings"
                    name="Total Screenings"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorScreenings)"
                  />
                  <Area
                    type="monotone"
                    dataKey="highRisk"
                    name="High Risk Cases"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHighRisk)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/40">
                <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-300">No Screening Trends Yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Daily screening volume and high-risk triage counts will graph here as patients are screened over time.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Village Demographics */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 border border-slate-800 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white tracking-tight">Village-Wise Patient Distribution</h2>
            <p className="text-xs text-slate-400">Top rural areas covered by mobile screening outreach</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {villageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={villageChartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                  <YAxis dataKey="village" type="category" stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0f1d',
                      borderColor: 'rgba(56,189,248,0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="patients" name="Patients" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/40">
                <MapPin className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-300">No Village Demographic Data</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Patients registered with rural village locations will dynamically map into this epidemiology chart.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Referral Status Distribution */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 border border-slate-800 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white tracking-tight">Referral Fulfillment Status</h2>
            <p className="text-xs text-slate-400">Tracking triage conversion from screening to specialist care</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {referralChartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={referralChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="status" stroke="#64748b" fontSize={11} tickLine={false} />
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
                  <Bar dataKey="count" name="Referrals" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/40">
                <GitBranch className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-300">No Specialist Referrals Yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  High-risk cases triaged to regional eye hospitals will report progress and completion here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
