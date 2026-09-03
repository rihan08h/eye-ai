import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Search, UserPlus, ScanEye, Eye, ChevronRight,
  Filter, MapPin, Phone, Calendar, RefreshCw
} from 'lucide-react';
import { patientService } from '../../services/entities.service';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await patientService.getAll({ search, page, limit: 15 });
      setPatients(res.data.patients || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load patient records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <SectionHeading
        badge="Clinical Registry"
        icon={Users}
        title="Patient Registry"
        subtitle={`${total} registered patient${total !== 1 ? 's' : ''} across rural screening centers`}
        action={
          <Button
            variant="cyan"
            size="md"
            icon={UserPlus}
            onClick={() => navigate('/patients/new')}
            className="shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Register Patient
          </Button>
        }
      />

      {/* Search & Filter Bar */}
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
            placeholder="Search by Patient ID, Name, Phone, Village..."
            className="w-full bg-slate-900/80 text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 text-slate-100 placeholder-slate-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchPatients}
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-10">
            <Skeleton count={5} variant="card" className="mb-3" />
          </div>
        ) : patients.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No patients found"
              description={search ? 'Try adjusting your search criteria' : 'Register your first patient to begin rural retinal screening.'}
              action={
                !search ? (
                  <Button
                    variant="cyan"
                    size="sm"
                    icon={UserPlus}
                    onClick={() => navigate('/patients/new')}
                  >
                    Register First Patient
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
                  <th className="px-6 py-4">Patient ID</th>
                  <th className="px-6 py-4">Name & Age</th>
                  <th className="px-6 py-4">Rural Community</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Diabetes Duration</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-900/60 transition">
                    <td className="px-6 py-4 font-mono font-bold text-cyan-400">
                      {p.patientId}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{p.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {p.age} yrs • {p.gender}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>
                          {p.village}, {p.district}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {p.phone || <span className="text-slate-500">N/A</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-900 border border-slate-800 text-slate-300">
                        {p.diabetesDuration || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/screenings/new', { state: { selectedPatient: p } })}
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                          title="Screen Retina"
                        >
                          <ScanEye className="w-3.5 h-3.5" />
                          Screen
                        </button>
                        <Link
                          to={`/patients/${p._id}`}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                          title="View Profile"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
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
