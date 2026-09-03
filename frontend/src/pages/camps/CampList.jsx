import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tent, Plus, MapPin, Calendar, Users, AlertTriangle,
  ChevronRight, RefreshCw, CheckCircle2, TrendingUp, Target
} from 'lucide-react';
import { campService } from '../../services/entities.service';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function CampList() {
  const navigate = useNavigate();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const res = await campService.getAll();
      setCamps(res.data.camps || []);
    } catch {
      toast.error('Failed to load screening camps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <SectionHeading
        badge="Community Outreach"
        icon={Tent}
        title="Rural Screening Camps"
        subtitle="Community outreach initiatives organized in Primary Health Centres (PHCs) and rural village clusters"
        action={
          <Button
            variant="cyan"
            size="md"
            icon={Plus}
            onClick={() => navigate('/camps/new')}
            className="shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Organize New Camp
          </Button>
        }
      />

      {/* Camps Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton count={3} variant="card" />
        </div>
      ) : camps.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={Tent}
            title="No active screening camps"
            description="Create a screening camp to aggregate rural screening statistics and track community health goals."
            action={
              <Button
                variant="cyan"
                size="sm"
                icon={Plus}
                onClick={() => navigate('/camps/new')}
              >
                Create First Camp
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {camps.map((camp) => {
            const progress = Math.min(
              100,
              Math.round(((camp.screenedCount || 0) / (camp.targetScreenings || 100)) * 100)
            );

            return (
              <div
                key={camp._id}
                className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-5 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between shadow-xl group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                        camp.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : camp.status === 'Upcoming'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {camp.status}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      {new Date(camp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-cyan-400 transition-colors leading-snug">
                      {camp.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      {camp.location}, {camp.village} ({camp.district})
                    </p>
                  </div>

                  {/* Screening Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Screenings Completed:</span>
                      <span className="font-bold text-cyan-400 font-mono">
                        {camp.screenedCount || 0} / {camp.targetScreenings || 100}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Urgent referrals count */}
                  {camp.urgentCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-red-400 font-bold bg-red-950/40 border border-red-500/30 p-2.5 rounded-2xl">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{camp.urgentCount} Urgent Specialist Referrals</span>
                    </div>
                  )}
                </div>

                <Link
                  to={`/camps/${camp._id}`}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/30 text-slate-200 hover:text-white py-2.5 rounded-2xl text-xs font-bold transition shadow-sm"
                >
                  View Camp Telemetry & Screenings →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
