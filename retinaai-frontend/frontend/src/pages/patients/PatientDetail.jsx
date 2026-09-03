import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, MapPin, Calendar, HeartPulse,
  ScanEye, ShieldAlert, Clock, AlertTriangle, Eye, ChevronRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { patientService } from '../../services/entities.service';
import RiskBadge from '../../components/common/RiskBadge';
import { RISK_CONFIG } from '../../utils/riskConfig';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const SEVERITY_SCALE = {
  'No DR': 0,
  Mild: 1,
  Moderate: 2,
  Severe: 3,
  'Proliferative DR': 4,
};

const SEVERITY_LABELS = ['No DR', 'Mild', 'Moderate', 'Severe', 'PDR'];

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await patientService.getById(id);
        setPatient(res.data.patient);
        setScreenings(res.data.screenings || []);
      } catch {
        toast.error('Failed to load patient record');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton count={3} variant="card" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <EmptyState
          icon={User}
          title="Patient not found"
          description="The requested patient record could not be loaded."
          action={
            <Button variant="cyan" size="sm" onClick={() => navigate('/patients')}>
              Back to Patient Registry
            </Button>
          }
        />
      </div>
    );
  }

  // Build progression timeline data for chart
  const progressionData = [...screenings]
    .reverse()
    .map((s) => ({
      date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      // null (not 0) for ungradable screenings — plotting them at 0 would
      // draw an ungradable capture as a healthy retina on the progression chart.
      severity: s.prediction ? SEVERITY_SCALE[s.prediction] ?? null : null,
      prediction: s.prediction,
      confidence: Math.round(s.confidence * 100),
    }));

  const latestScreening = screenings[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/patients"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{patient.name}</h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
                {patient.patientId}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Enrolled on {new Date(patient.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </div>
        </div>

        <Button
          variant="cyan"
          icon={ScanEye}
          onClick={() => navigate('/screenings/new', { state: { selectedPatient: patient } })}
          className="shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          Perform New Screening
        </Button>
      </div>

      {/* Demographic & Clinical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="glass-panel rounded-3xl border border-slate-800 p-5 space-y-3.5 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-xs tracking-wide border-b border-slate-800 pb-2.5">
            <User className="w-4 h-4 text-cyan-400" />
            Patient Profile
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Age / Gender:</span>
              <span className="font-semibold text-white">{patient.age} yrs • {patient.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono text-white">{patient.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Community:</span>
              <span className="font-medium text-white">{patient.village}, {patient.district}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">State:</span>
              <span className="font-medium text-white">{patient.state}</span>
            </div>
          </div>
        </div>

        {/* Diabetic Profile */}
        <div className="glass-panel rounded-3xl border border-slate-800 p-5 space-y-3.5 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-xs tracking-wide border-b border-slate-800 pb-2.5">
            <HeartPulse className="w-4 h-4 text-purple-400" />
            Diabetic Profile
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Known Duration:</span>
              <span className="font-semibold text-white">{patient.diabetesDuration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reported Symptoms:</span>
              <span className="font-medium text-white truncate max-w-[150px]">{patient.previousEyeProblems || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Screenings:</span>
              <span className="font-bold text-cyan-400">{screenings.length} evaluations</span>
            </div>
          </div>
        </div>

        {/* Latest Triage Summary */}
        <div className="glass-panel rounded-3xl border border-slate-800 p-5 space-y-3.5 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-xs tracking-wide border-b border-slate-800 pb-2.5">
            <ScanEye className="w-4 h-4 text-emerald-400" />
            Latest Triage Status
          </div>
          {latestScreening ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Latest DR Grade:</span>
                <span className="font-bold text-white">{latestScreening.prediction || 'Ungradable'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Risk Assessment:</span>
                <RiskBadge riskLevel={latestScreening.riskLevel} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Screening Date:</span>
                <span className="text-slate-300 font-mono">
                  {new Date(latestScreening.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">No retinal screenings performed yet.</p>
          )}
        </div>
      </div>

      {/* Longitudinal Disease Progression Chart */}
      {progressionData.length > 1 && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white tracking-tight">Diabetic Retinopathy Disease Progression</h2>
            <p className="text-xs text-slate-400">Historical longitudinal tracking of DR grade over time</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis
                  domain={[0, 4]}
                  ticks={[0, 1, 2, 3, 4]}
                  tickFormatter={(val) => SEVERITY_LABELS[val]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    borderColor: 'rgba(56,189,248,0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val, name, item) => [
                    `${SEVERITY_LABELS[val]} (${item.payload.confidence}% confidence)`,
                    'DR Severity Grade',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="severity"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#06b6d4', stroke: '#030712', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Screening History Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-tight">Screening History & Clinical Records</h2>
          <span className="text-xs font-mono text-cyan-400 font-bold">{screenings.length} Total</span>
        </div>

        {screenings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No screening records found for this patient.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Eye Examined</th>
                  <th className="px-6 py-3.5">AI Prediction</th>
                  <th className="px-6 py-3.5">Confidence</th>
                  <th className="px-6 py-3.5">Image Quality</th>
                  <th className="px-6 py-3.5">Risk Triage</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {screenings.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-900/60 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {new Date(s.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-300">
                      {s.eyeSide || 'Right Eye (OD)'}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {s.prediction || <span className="text-slate-500 font-normal">Ungradable</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-cyan-400 font-bold">
                      {(s.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300">
                        {s.imageQuality?.status || '\u2014'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge riskLevel={s.riskLevel} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/screenings/${s._id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
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
