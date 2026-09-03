import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ScanEye, ArrowLeft, GitBranch, User, Sparkles,
  AlertTriangle, CheckCircle2, Printer
} from 'lucide-react';
import { screeningService, referralService } from '../../services/entities.service';
import ImageViewer from '../../components/screening/ImageViewer';
import ProbabilityBars from '../../components/screening/ProbabilityBars';
import ScreeningAlerts from '../../components/screening/ScreeningAlerts';
import QualityPanel from '../../components/screening/QualityPanel';
import ConfidencePanel from '../../components/screening/ConfidencePanel';
import ClinicianReviewPanel from '../../components/screening/ClinicianReviewPanel';
import RiskBadge from '../../components/common/RiskBadge';
import ChatWidget from '../../components/common/ChatWidget';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { getRiskMeta } from '../../utils/riskConfig';
import toast from 'react-hot-toast';

export default function ScreeningResult() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(true);

  // Referral Modal state
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralPriority, setReferralPriority] = useState('HIGH');
  const [hospitalName, setHospitalName] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [submittingReferral, setSubmittingReferral] = useState(false);

  useEffect(() => {
    const fetchScreening = async () => {
      try {
        const res = await screeningService.getById(id);
        setScreening(res.data.screening);
        // Default priority based on risk level
        if (res.data.screening?.riskLevel === 'critical') setReferralPriority('URGENT');
        else if (res.data.screening?.riskLevel === 'high') setReferralPriority('HIGH');
        else if (res.data.screening?.riskLevel === 'medium') setReferralPriority('MODERATE');
      } catch {
        toast.error('Failed to load screening record');
      } finally {
        setLoading(false);
      }
    };
    fetchScreening();
  }, [id]);

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    setSubmittingReferral(true);
    try {
      await referralService.create({
        patient: screening.patient._id,
        screening: screening._id,
        priority: referralPriority,
        hospitalName,
        notes: referralNotes,
      });
      toast.success('Referral created and sent to specialist dashboard!');
      setShowReferralModal(false);
      setScreening((prev) => ({ ...prev, referralCreated: true }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create referral');
    } finally {
      setSubmittingReferral(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton count={3} variant="card" />
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <EmptyState
          icon={ScanEye}
          title="Screening result not found"
          description="The requested assessment record could not be loaded."
          action={
            <Button variant="cyan" size="sm" onClick={() => navigate('/screenings')}>
              Back to Screenings
            </Button>
          }
        />
      </div>
    );
  }

  const isUngradable = screening.analysisStatus === 'ungradable';
  const riskMeta = getRiskMeta(screening.prediction);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/screenings"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Screening Assessment</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-mono text-cyan-400 font-bold">
                {screening.eyeSide || 'Right Eye (OD)'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Screened on {new Date(screening.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Print Clinical Report */}
          <Link
            to={`/reports/${screening._id}`}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            Clinical Report
          </Link>

          {/* Create Referral Trigger */}
          {screening.referralRequired && !screening.referralCreated && (
            <Button
              variant="danger"
              size="sm"
              icon={GitBranch}
              onClick={() => setShowReferralModal(true)}
              className="shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              Create Referral
            </Button>
          )}

          {screening.referralCreated && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Referral Dispatched
            </span>
          )}

          <Button
            variant="cyan"
            size="sm"
            icon={ScanEye}
            onClick={() => navigate('/screenings/new')}
          >
            New Screening
          </Button>
        </div>
      </div>

      <ScreeningAlerts screening={screening} />

      {/* Patient Information Banner */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
            {screening.patient?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-white text-sm">{screening.patient?.name}</p>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                {screening.patient?.patientId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {screening.patient?.age} yrs • {screening.patient?.gender} • {screening.patient?.village}, {screening.patient?.district}
            </p>
          </div>
        </div>

        <Link
          to={`/patients/${screening.patient?._id}`}
          className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
        >
          <User className="w-3.5 h-3.5" />
          Patient Profile & Timeline →
        </Link>
      </div>

      {/* Two-Column Core Assessment Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Retinal Image & Grad-CAM Heatmap Viewer */}
        <div className="lg:col-span-7 space-y-4">
          <ImageViewer
            originalUrl={screening.originalImageUrl}
            heatmapUrl={screening.heatmapImageUrl}
          />

          {/* Model Explanation Footnote */}
          <div className="glass-card rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-3 border border-slate-800">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">How to read the attention map: </span>
              Warm regions are where the model's activation was strongest when it produced
              this classification. Attention falling on a region is not evidence of
              pathology there, and the map does not identify specific lesions.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Clinical Assessment & Triage */}
        <div className="lg:col-span-5 space-y-5">
          {/* Primary Assessment Card */}
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-7 space-y-5 border border-cyan-500/20 shadow-2xl">
            <div className="border-b border-slate-800 pb-3.5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                AI screening assessment
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                {isUngradable ? 'No result' : screening.prediction}
              </h2>
              {isUngradable && (
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  The image did not pass quality assessment, so no severity was
                  classified. Recapture and screen again.
                </p>
              )}
            </div>

            {/* Ungradable screenings carry no prediction, no probability
                distribution and no risk level derived from one. Rendering an
                empty version of those panels would imply the model produced
                something it did not. */}
            {!isUngradable && (
              <>
                <ConfidencePanel
                  confidence={screening.confidence}
                  uncertainty={screening.uncertainty}
                />

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-200">
                    Class probability distribution
                  </p>
                  <ProbabilityBars
                    probabilities={screening.probabilities}
                    prediction={screening.prediction}
                  />
                </div>

                <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Screening priority</span>
                    <RiskBadge riskLevel={screening.riskLevel} label={riskMeta.riskLabel} />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-200">Guidance:</strong> {riskMeta.referralNote}
                  </p>
                </div>
              </>
            )}

            <QualityPanel imageQuality={screening.imageQuality} />

            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 text-amber-200 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Clinical notice:</strong> this is an AI-assisted screening result, not a
                diagnosis. A qualified ophthalmologist must confirm any finding and decide on
                treatment.
              </p>
            </div>
          </div>

          <ClinicianReviewPanel
            screening={screening}
            onReviewed={() => setScreening((prev) => ({ ...prev, reviewStatus: 'reviewed' }))}
          />
        </div>
      </div>

      {/* Referral Creation Modal */}
      <Modal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        title="Create Specialist Referral"
        subtitle={`Patient: ${screening.patient?.name} • Grade: ${screening.prediction}`}
      >
        <form onSubmit={handleCreateReferral} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Referral Priority *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['ROUTINE', 'MODERATE', 'HIGH', 'URGENT'].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setReferralPriority(p)}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    referralPriority === p
                      ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Referred Hospital / Regional Eye Centre"
            required
            placeholder="e.g. Regional Eye Hospital, City"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Clinical Triage Notes for Specialist
            </label>
            <textarea
              rows={3}
              value={referralNotes}
              onChange={(e) => setReferralNotes(e.target.value)}
              placeholder="e.g. Severe NPDR with macular involvement risk. Patient advised to visit clinic within 7 days."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowReferralModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={submittingReferral}
              icon={GitBranch}
            >
              Confirm Referral
            </Button>
          </div>
        </form>
      </Modal>

      {/* Floating AI Health Assistant with context */}
      <ChatWidget screeningId={screening._id} />
    </div>
  );
}
