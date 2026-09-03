import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Tent, ArrowLeft, MapPin, Calendar, Users, AlertTriangle,
  CheckCircle2, ScanEye, Eye, TrendingUp, Target
} from 'lucide-react';
import { campService } from '../../services/entities.service';
import RiskBadge from '../../components/common/RiskBadge';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function CampDetail() {
  const { id } = useParams();
  const [camp, setCamp] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentScreenings, setRecentScreenings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCamp = async () => {
      try {
        const res = await campService.getById(id);
        setCamp(res.data.camp);
        setStats(res.data.stats);
        setRecentScreenings(res.data.recentScreenings || []);
      } catch {
        toast.error('Failed to load camp details');
      } finally {
        setLoading(false);
      }
    };
    fetchCamp();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton count={3} variant="card" />
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <EmptyState
          icon={Tent}
          title="Camp not found"
          description="The requested screening camp record could not be loaded."
          action={
            <Link to="/camps" className="text-xs text-cyan-400 hover:underline">
              Back to Screening Camps
            </Link>
          }
        />
      </div>
    );
  }

  const progress = Math.min(
    100,
    Math.round(((stats?.totalScreened || 0) / (camp.targetScreenings || 100)) * 100)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/camps"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{camp.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                {camp.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {camp.location}, {camp.village} ({camp.district}, {camp.state})
            </p>
          </div>
        </div>

        <Link
          to="/screenings/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-cyan-500/25 transition"
        >
          <ScanEye className="w-4 h-4" />
          Screen Patient in this Camp
        </Link>
      </div>

      {/* Target Progress Card */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Target className="w-4 h-4 text-cyan-400" />
            Screening Camp Outreach Target
          </div>
          <span className="font-mono text-sm font-bold text-cyan-400">{progress}% Reached</span>
        </div>
        <div className="h-3 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 font-mono">
          <strong className="text-white">{stats?.totalScreened || 0}</strong> patients screened out of{' '}
          <strong className="text-white">{camp.targetScreenings || 100}</strong> target goal.
        </p>
      </div>

      {/* DR Breakdown Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Total Screened', value: stats?.totalScreened || 0, color: 'text-white', border: 'border-slate-800' },
          { label: 'No DR (Clear)', value: stats?.noDR || 0, color: 'text-emerald-400', border: 'border-emerald-500/30' },
          { label: 'Mild NPDR', value: stats?.mild || 0, color: 'text-amber-400', border: 'border-amber-500/30' },
          { label: 'Moderate NPDR', value: stats?.moderate || 0, color: 'text-orange-400', border: 'border-orange-500/30' },
          { label: 'Severe NPDR', value: stats?.severe || 0, color: 'text-red-400', border: 'border-red-500/30' },
          { label: 'Proliferative (PDR)', value: stats?.pdr || 0, color: 'text-purple-400', border: 'border-purple-500/30' },
        ].map((m) => (
          <div key={m.label} className={`glass-card rounded-2xl border p-4 bg-slate-900/60 ${m.border}`}>
            <p className="text-[11px] font-mono text-slate-400 font-medium leading-tight">{m.label}</p>
            <p className={`text-2xl font-black mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Screenings Performed in this Camp */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-tight">Patients Screened in this Camp</h2>
          <span className="text-xs font-mono text-cyan-400 font-bold">{recentScreenings.length} Recorded</span>
        </div>

        {recentScreenings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No screenings logged for this camp yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Time</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">AI Prediction</th>
                  <th className="px-6 py-3.5">Confidence</th>
                  <th className="px-6 py-3.5">Risk Level</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {recentScreenings.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-900/60 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{s.patient?.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {s.patient?.patientId} • {s.patient?.village}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{s.prediction}</td>
                    <td className="px-6 py-4 font-mono text-xs text-cyan-400 font-bold">
                      {s.confidence == null ? '—' : `${Math.round(s.confidence * 100)}%`}
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge riskLevel={s.riskLevel} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/screenings/${s._id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Assessment
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
