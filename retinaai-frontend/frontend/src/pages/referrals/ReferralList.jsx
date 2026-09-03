import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch, Search, Filter, Eye, CheckCircle2, Clock,
  AlertTriangle, RefreshCw, ChevronRight, Stethoscope, User
} from 'lucide-react';
import { referralService } from '../../services/entities.service';
import { useAuth } from '../../context/AuthContext';
import RiskBadge from '../../components/common/RiskBadge';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'Pending', 'Under Review', 'Appointment Scheduled', 'Completed'];

export default function ReferralList() {
  const { user, isDoctor } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Selected referral for status update modal
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [doctorFeedback, setDoctorFeedback] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'All') params.status = activeTab;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await referralService.getAll(params);
      setReferrals(res.data.referrals || []);
    } catch {
      toast.error('Failed to load referral queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [activeTab, priorityFilter]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReferral) return;

    setUpdating(true);
    try {
      await referralService.updateStatus(selectedReferral._id, {
        status: newStatus,
        doctorFeedback,
        finalDiagnosis,
        assignedDoctor: user._id,
      });
      toast.success('Referral status updated');
      setSelectedReferral(null);
      fetchReferrals();
    } catch {
      toast.error('Failed to update referral');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (referral) => {
    setSelectedReferral(referral);
    setNewStatus(referral.status);
    setDoctorFeedback(referral.doctorFeedback || '');
    setFinalDiagnosis(referral.finalDiagnosis || '');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <SectionHeading
        badge="Specialist Bridge"
        icon={GitBranch}
        title="Specialist Referral Pipeline"
        subtitle="High-risk diabetic retinopathy triage, doctor feedback, and hospital appointment coordination"
        action={
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchReferrals}
          >
            Refresh Queue
          </Button>
        }
      />

      {/* Tabs & Priority Filters */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-xl">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 text-xs px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300 font-medium focus:outline-none focus:border-cyan-500/80 cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">URGENT (Immediate Review)</option>
            <option value="HIGH">HIGH Priority</option>
            <option value="MODERATE">MODERATE</option>
            <option value="ROUTINE">ROUTINE</option>
          </select>
        </div>
      </div>

      {/* Referrals Queue Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-10">
            <Skeleton count={5} variant="card" className="mb-3" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={GitBranch}
              title="Referral queue is clear"
              description="No specialist referrals currently matching your filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Triage Priority</th>
                  <th className="px-6 py-4">Patient Details</th>
                  <th className="px-6 py-4">AI DR Classification</th>
                  <th className="px-6 py-4">Referred Hospital</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Initiated By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {referrals.map((r) => {
                  const isUrgent = r.priority === 'URGENT';
                  return (
                    <tr
                      key={r._id}
                      className={`hover:bg-slate-900/60 transition ${isUrgent ? 'bg-red-950/20' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
                            r.priority === 'URGENT'
                              ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                              : r.priority === 'HIGH'
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{r.patient?.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {r.patient?.patientId} • {r.patient?.village}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {r.screening?.prediction || 'Severe NPDR'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {r.hospitalName || 'District Eye Hospital'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                            r.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : r.status === 'Appointment Scheduled'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : r.status === 'Under Review'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {r.createdBy?.name || 'Health Worker'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openStatusModal(r)}
                            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            Update
                          </button>
                          {r.screening && (
                            <Link
                              to={`/screenings/${r.screening._id || r.screening}`}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                              title="Inspect Retina & Grad-CAM"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctor Status Update Modal */}
      <Modal
        isOpen={!!selectedReferral}
        onClose={() => setSelectedReferral(null)}
        title={`Update Referral Status — ${selectedReferral?.patient?.name}`}
        subtitle={`Priority: ${selectedReferral?.priority} • Prediction: ${selectedReferral?.screening?.prediction}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Referral Workflow Status *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Pending', 'Under Review', 'Appointment Scheduled', 'Completed'].map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setNewStatus(st)}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    newStatus === st
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Ophthalmologist Clinical Feedback / Notes
            </label>
            <textarea
              rows={3}
              value={doctorFeedback}
              onChange={(e) => setDoctorFeedback(e.target.value)}
              placeholder="e.g. Slit-lamp biomicroscopy confirmed neovascularization. Scheduled for panretinal photocoagulation (PRP)."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80"
            />
          </div>

          <Input
            label="Final Confirmed Medical Diagnosis"
            value={finalDiagnosis}
            onChange={(e) => setFinalDiagnosis(e.target.value)}
            placeholder="e.g. High-Risk Proliferative Diabetic Retinopathy (PDR) with DME"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedReferral(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="cyan"
              size="sm"
              loading={updating}
            >
              Save Updates
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
