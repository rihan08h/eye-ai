import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer, ArrowLeft, Download, ShieldCheck, AlertTriangle,
  Building2, Activity, Calendar, User, Phone, MapPin
} from 'lucide-react';
import { screeningService } from '../../services/entities.service';
import RiskBadge from '../../components/common/RiskBadge';
import { getRiskMeta } from '../../utils/riskConfig';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function ReportViewer() {
  const { id } = useParams();
  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScreening = async () => {
      try {
        const res = await screeningService.getById(id);
        setScreening(res.data.screening);
      } catch {
        toast.error('Failed to load screening record for report');
      } finally {
        setLoading(false);
      }
    };
    fetchScreening();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton count={3} variant="card" />
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <EmptyState
          icon={Activity}
          title="Report not found"
          description="The clinical report could not be compiled."
          action={
            <Link to="/screenings" className="text-xs text-cyan-400 hover:underline">
              Back to Screenings
            </Link>
          }
        />
      </div>
    );
  }

  const riskMeta = getRiskMeta(screening.prediction);
  const patient = screening.patient || {};
  const prob = screening.probabilities || {};

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (hidden during print) */}
      <div className="print:hidden flex items-center justify-between glass-panel p-4 rounded-3xl border border-slate-800 shadow-xl">
        <Link
          to={`/screenings/${screening._id}`}
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          Back to Assessment
        </Link>

        <Button
          variant="cyan"
          size="sm"
          icon={Printer}
          onClick={handlePrint}
          className="shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          Print / Save as PDF
        </Button>
      </div>

      {/* Printable Clinical Screening Report Sheet */}
      <div className="bg-slate-950 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl print:border-0 print:shadow-none print:p-0 print:bg-white print:text-slate-900 space-y-8 text-slate-100">
        {/* Clinic & Program Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 print:border-slate-900 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-md print:bg-blue-600 print:text-white">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white print:text-slate-900">RetinaAI Clinical</h1>
              <p className="text-[11px] font-mono font-medium text-cyan-400 print:text-slate-600 uppercase tracking-wider">
                Explainable AI Diabetic Retinopathy Screening Platform
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-600 space-y-0.5 font-mono">
            <p className="font-bold text-white print:text-slate-900">National Rural Eye Care Initiative</p>
            <p>Report ID: <span className="text-cyan-400 print:text-slate-900">{screening._id.slice(-8).toUpperCase()}</span></p>
            <p>Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
          </div>
        </div>

        {/* Patient & Exam Metadata Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-900/80 print:bg-slate-50 rounded-2xl border border-slate-800 print:border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-mono">Patient Name:</span>
            <p className="font-bold text-white print:text-slate-900 mt-0.5">{patient.name}</p>
          </div>
          <div>
            <span className="text-slate-500 font-mono">Patient ID:</span>
            <p className="font-mono font-bold text-cyan-400 print:text-blue-600 mt-0.5">{patient.patientId}</p>
          </div>
          <div>
            <span className="text-slate-500 font-mono">Age / Gender:</span>
            <p className="font-bold text-white print:text-slate-900 mt-0.5">{patient.age} YRS • {patient.gender}</p>
          </div>
          <div>
            <span className="text-slate-500 font-mono">Phone:</span>
            <p className="font-mono text-white print:text-slate-900 mt-0.5">{patient.phone || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-mono">Village / District:</span>
            <p className="font-medium text-white print:text-slate-900 mt-0.5">{patient.village}, {patient.district}</p>
          </div>
          <div>
            <span className="text-slate-500 font-mono">Diabetes Duration:</span>
            <p className="font-medium text-white print:text-slate-900 mt-0.5">{patient.diabetesDuration}</p>
          </div>
          <div>
            <span className="text-slate-500 font-mono">Eye Examined:</span>
            <p className="font-bold text-white print:text-slate-900 mt-0.5">{screening.eyeSide || 'Right Eye (OD)'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-mono">Screening Date:</span>
            <p className="font-medium text-white print:text-slate-900 mt-0.5">
              {new Date(screening.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </div>
        </div>

        {/* Primary AI Diagnosis & Risk Box */}
        <div className="p-6 rounded-3xl border-2 border-cyan-500/30 print:border-slate-900 bg-slate-900 print:bg-slate-900 text-white space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                AI Screening Classification
              </p>
              <p className="text-3xl font-black mt-0.5">{screening.prediction}</p>
            </div>
            <div className="text-right">
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-white text-slate-950 uppercase font-mono">
                {riskMeta.riskLabel}
              </span>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Confidence: <strong className="text-cyan-400">{screening.confidence == null ? 'not available' : `${Math.round(screening.confidence * 100)}%`}</strong>
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 border-t border-slate-800 pt-3">
            <strong>Clinical Guidance:</strong> {riskMeta.referralNote}
          </p>
        </div>

        {/* Dual Fundus & Grad-CAM Images */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
            Retinal Fundus Image & Explainable AI (Grad-CAM) Heatmap
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-800 print:border-slate-200 rounded-2xl overflow-hidden p-2 text-center bg-black">
              <img
                src={screening.originalImageUrl}
                alt="Retinal Fundus"
                className="max-h-56 mx-auto object-contain rounded-xl"
              />
              <p className="text-[11px] font-mono font-semibold text-slate-400 print:text-slate-600 mt-2">
                Original Fundus Image
              </p>
            </div>

            <div className="border border-slate-800 print:border-slate-200 rounded-2xl overflow-hidden p-2 text-center bg-black relative">
              <img
                src={screening.originalImageUrl}
                alt="Grad-CAM Heatmap"
                className="max-h-56 mx-auto object-contain rounded-xl opacity-80"
              />
              <div
                className="absolute inset-2 rounded-xl pointer-events-none mix-blend-screen"
                style={{
                  background:
                    'radial-gradient(circle at 58% 46%, rgba(239, 68, 68, 0.85) 0%, rgba(249, 115, 22, 0.7) 25%, rgba(234, 179, 8, 0.5) 45%, rgba(59, 130, 246, 0.2) 65%, transparent 80%)',
                }}
              />
              <p className="text-[11px] font-mono font-semibold text-cyan-400 print:text-blue-600 mt-2">
                Grad-CAM Pathological Heatmap
              </p>
            </div>
          </div>
        </div>

        {/* Probability Breakdown */}
        <div className="space-y-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
            Probability Distribution Analysis
          </h2>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {[
              { label: 'No DR', val: prob.noDR ?? 0 },
              { label: 'Mild NPDR', val: prob.mild ?? 0 },
              { label: 'Moderate NPDR', val: prob.moderate ?? 0 },
              { label: 'Severe NPDR', val: prob.severe ?? 0 },
              { label: 'Proliferative DR', val: prob.proliferative ?? 0 },
            ].map((item) => (
              <div key={item.label} className="bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-xl p-2.5">
                <p className="text-[10px] text-slate-400 print:text-slate-500">{item.label}</p>
                <p className="font-mono font-bold text-white print:text-slate-900 mt-1">
                  {Math.round(item.val * 100)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Disclaimer Notice */}
        <div className="border border-amber-500/30 bg-amber-950/20 print:bg-amber-50 rounded-2xl p-4 text-xs text-amber-300 print:text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Medical Disclaimer & Clinical Notice:</p>
            <p className="leading-relaxed text-[11px]">
              This report is generated by an Artificial Intelligence screening tool to assist rural health workers.
              It is NOT a definitive clinical diagnosis. Final diagnosis, dilation examination, and treatment planning
              must be conducted by a certified Ophthalmologist / Retina Specialist.
            </p>
          </div>
        </div>

        {/* Signature Line */}
        <div className="pt-8 flex justify-between items-end text-xs text-slate-400 print:text-slate-500 border-t border-slate-800 print:border-slate-200">
          <div>
            <p className="font-semibold text-slate-300 print:text-slate-700">RetinaAI Deep Inference Engine</p>
            <p className="font-mono text-[10px]">Verification Checksum: {screening._id}</p>
          </div>
          <div className="text-right">
            <div className="w-48 border-b border-slate-700 print:border-slate-400 mb-1.5" />
            <p className="font-semibold text-slate-300 print:text-slate-800">Examining Officer / Doctor Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
