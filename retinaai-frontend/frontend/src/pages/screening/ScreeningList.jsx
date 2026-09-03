import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList, Search, ScanEye, Filter, Eye, RefreshCw,
  MapPin, Calendar, AlertTriangle
} from 'lucide-react';
import { screeningService } from '../../services/entities.service';
import RiskBadge from '../../components/common/RiskBadge';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function ScreeningList() {
  const navigate = useNavigate();
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [predictionFilter, setPredictionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchScreenings = async () => {
    setLoading(true);
    try {
      const res = await screeningService.getAll({
        search,
        riskLevel: riskFilter,
        prediction: predictionFilter,
        page,
        limit: 15,
      });
      setScreenings(res.data.screenings || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load screening records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchScreenings();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, riskFilter, predictionFilter, page]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <SectionHeading
        badge="Diagnostic Telemetry"
        icon={ClipboardList}
        title="Screening Records"
        subtitle={`${total} AI retinal screening${total !== 1 ? 's' : ''} evaluated across health centers`}
        action={
          <Button
            variant="cyan"
            size="md"
            icon={ScanEye}
            onClick={() => navigate('/screenings/new')}
            className="shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            New Screening
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800 shadow-xl">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Patient Name, ID, or Phone..."
            className="w-full bg-slate-900/80 text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/80 text-slate-100 placeholder-slate-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-800 text-slate-300 font-medium focus:outline-none focus:border-cyan-500/80 cursor-pointer"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low / Routine</option>
            <option value="medium">Medium / Specialist</option>
            <option value="high">High / Urgent</option>
            <option value="critical">Critical / Immediate</option>
          </select>

          {/* Prediction Filter */}
          <select
            value={predictionFilter}
            onChange={(e) => {
              setPredictionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-800 text-slate-300 font-medium focus:outline-none focus:border-cyan-500/80 cursor-pointer"
          >
            <option value="">All DR Grades</option>
            <option value="No DR">No DR</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
            <option value="Proliferative DR">Proliferative DR</option>
          </select>

          <button
            onClick={fetchScreenings}
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Screenings Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-10">
            <Skeleton count={5} variant="card" className="mb-3" />
          </div>
        ) : screenings.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={ClipboardList}
              title="No screenings found"
              description={
                search || riskFilter || predictionFilter
                  ? 'Try resetting the filters or search'
                  : 'Upload your first retinal fundus image to generate AI analysis.'
              }
              action={
                !search && !riskFilter && !predictionFilter ? (
                  <Button
                    variant="cyan"
                    size="sm"
                    icon={ScanEye}
                    onClick={() => navigate('/screenings/new')}
                  >
                    Start First Screening
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Evaluation Date</th>
                  <th className="px-6 py-4">Patient Details</th>
                  <th className="px-6 py-4">AI Prediction</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4">Specialist Referral</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {screenings.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-900/60 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {new Date(s.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{s.patient?.name || 'Unknown'}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {s.patient?.patientId} • {s.patient?.village}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {s.prediction || <span className="text-slate-500 font-normal">Ungradable</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-cyan-400 font-bold">
                      {s.confidence == null ? '—' : `${Math.round(s.confidence * 100)}%`}
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge riskLevel={s.riskLevel} />
                    </td>
                    <td className="px-6 py-4">
                      {s.referralCreated ? (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          Dispatched
                        </span>
                      ) : s.referralRequired ? (
                        <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full animate-pulse">
                          Required
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">None Needed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/screenings/${s._id}`}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
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

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-800 text-slate-200 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-800 text-slate-200 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
