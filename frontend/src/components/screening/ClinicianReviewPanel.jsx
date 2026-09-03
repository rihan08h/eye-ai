import { useState, useEffect, useCallback } from 'react';
import { Stethoscope, CheckCircle2, PencilLine, RotateCcw, HelpCircle, Clock } from 'lucide-react';
import { reviewService } from '../../services/entities.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const SEVERITIES = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR'];

const DECISIONS = [
  {
    id: 'confirmed',
    label: 'Agree with AI',
    icon: CheckCircle2,
    help: 'The AI severity matches your assessment.',
  },
  {
    id: 'modified',
    label: 'Record different grade',
    icon: PencilLine,
    help: 'Your assessment replaces the AI grade as the clinical record. The AI result is kept.',
  },
  {
    id: 'recapture_requested',
    label: 'Request recapture',
    icon: RotateCcw,
    help: 'The image is not adequate to grade. The patient should be screened again.',
  },
  {
    id: 'inconclusive',
    label: 'Inconclusive',
    icon: HelpCircle,
    help: 'The image is gradable but you cannot determine a severity from it.',
  },
];

/**
 * Clinician review workspace.
 *
 * Doctors see the decision form; everyone else sees the review history
 * read-only. Submitting never alters the AI prediction — the backend writes a
 * separate ClinicianReview document and both remain on the record.
 */
export default function ClinicianReviewPanel({ screening, onReviewed }) {
  const { isDoctor, isAdmin } = useAuth();
  const canReview = (isDoctor || isAdmin) && !screening?.isMock;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [decision, setDecision] = useState('confirmed');
  const [assessment, setAssessment] = useState(screening?.prediction || 'Moderate');
  const [notes, setNotes] = useState('');
  const [referralRecommended, setReferralRecommended] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const res = await reviewService.getForScreening(screening._id);
      setReviews(res.data.reviews || []);
    } catch {
      // A failed history load must not block reviewing.
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [screening._id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // 'Agree with AI' is meaningless when the AI produced no grade.
  const canConfirm = Boolean(screening?.prediction);
  useEffect(() => {
    if (!canConfirm && decision === 'confirmed') setDecision('modified');
  }, [canConfirm, decision]);

  const needsAssessment = decision === 'confirmed' || decision === 'modified';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await reviewService.create({
        screeningId: screening._id,
        decision,
        clinicalAssessment: needsAssessment
          ? decision === 'confirmed'
            ? screening.prediction
            : assessment
          : null,
        notes,
        referralRecommended,
      });
      toast.success(res.data.message || 'Review recorded');
      setNotes('');
      await loadReviews();
      onReviewed?.(res.data.review);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record the review');
    } finally {
      setSubmitting(false);
    }
  };

  const current = reviews.find((r) => r.isCurrent);

  return (
    <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2.5">
        <Stethoscope className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-bold text-white">Clinician review</h3>
        {current && (
          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            Reviewed
          </span>
        )}
        {!current && !loading && (
          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
            Awaiting review
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {screening?.isMock && (
          <p className="text-xs text-red-300">
            Synthetic screenings cannot be clinically reviewed.
          </p>
        )}

        {current && (
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-sm font-bold text-white">
                {current.clinicalAssessment || DECISIONS.find((d) => d.id === current.decision)?.label}
              </span>
              {current.isOverride && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  Differs from AI ({current.aiSnapshot?.prediction || 'no grade'})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {current.reviewer?.name} · {new Date(current.createdAt).toLocaleString()}
            </p>
            {current.notes && (
              <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-2">
                {current.notes}
              </p>
            )}
          </div>
        )}

        {canReview && (
          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-200 mb-2">Your decision</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DECISIONS.map(({ id, label, icon: Icon, help }) => {
                  const disabled = id === 'confirmed' && !canConfirm;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setDecision(id)}
                      title={disabled ? 'There is no AI grade to agree with' : help}
                      className={`text-left px-3.5 py-3 rounded-2xl border transition ${
                        decision === id
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : disabled
                            ? 'border-slate-800 opacity-40 cursor-not-allowed'
                            : 'border-slate-800 hover:border-slate-700 cursor-pointer'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-bold text-white">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                        {label}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-1 leading-snug">{help}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {decision === 'modified' && (
              <div className="space-y-2">
                <label htmlFor="clinical-grade" className="text-xs font-bold text-slate-200 block">
                  Your grade
                </label>
                <select
                  id="clinical-grade"
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="clinical-notes" className="text-xs font-bold text-slate-200 block">
                Clinical notes
              </label>
              <textarea
                id="clinical-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={4000}
                placeholder="Findings, reasoning, or instructions for follow-up"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600"
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={referralRecommended}
                onChange={(e) => setReferralRecommended(e.target.checked)}
                className="accent-cyan-400 w-4 h-4"
              />
              Recommend specialist referral
            </label>

            <Button variant="cyan" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Recording…' : current ? 'Replace review' : 'Record review'}
            </Button>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your assessment is stored alongside the AI result, not in place of it. Replacing a
              review keeps the earlier one on the record.
            </p>
          </div>
        )}

        {!canReview && !current && !loading && !screening?.isMock && (
          <p className="text-xs text-slate-400">
            This screening has not been reviewed by a clinician yet.
          </p>
        )}

        {reviews.length > 1 && (
          <details className="border-t border-slate-800 pt-3">
            <summary className="text-xs font-bold text-slate-300 cursor-pointer">
              Earlier reviews ({reviews.length - 1})
            </summary>
            <ul className="mt-3 space-y-2.5">
              {reviews
                .filter((r) => !r.isCurrent)
                .map((r) => (
                  <li key={r._id} className="text-xs text-slate-400 flex items-start gap-2">
                    <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>
                      {r.clinicalAssessment || r.decision} · {r.reviewer?.name} ·{' '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
