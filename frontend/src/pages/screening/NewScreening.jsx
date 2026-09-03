import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ScanEye, UploadCloud, Eye, User, Search, AlertCircle,
  CheckCircle2, Sparkles, Image as ImageIcon, ArrowLeft,
  ShieldCheck, Cpu, RefreshCw
} from 'lucide-react';
import { patientService, screeningService } from '../../services/entities.service';
import { useOffline } from '../../context/OfflineContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
import SectionHeading from '../../components/ui/SectionHeading';
import toast from 'react-hot-toast';

// Real fundus photographs from the training dataset (data/sample/), copied
// into public/samples/. These replace three Unsplash stock photos that were
// previously labelled "Severe NPDR", "Normal Retina" and "Proliferative DR" —
// none of which were retinal images, and none of which had those diagnoses.
//
// No expected result is shown. These are inputs for testing the pipeline, not
// cases with known ground truth.
const DEMO_SAMPLES = [
  { name: 'Fundus sample 1', url: '/samples/13_left.jpeg' },
  { name: 'Fundus sample 2', url: '/samples/15_right.jpeg' },
  { name: 'Fundus sample 3', url: '/samples/17_left.jpeg' },
];

/**
 * Honest phases, driven by observable events.
 *
 * These replace a four-step animation advanced by setInterval every 450 ms —
 * it claimed "Computing Grad-CAM gradient backpropagation heatmap..." while
 * the client knew nothing about server state, and the progress bar filled on
 * a timer regardless of what was happening. A health worker reading a stalled
 * bar at 75% had no way to tell progress from a hung request.
 *
 * 'uploading' shows real bytes-sent from axios. 'analyzing' is genuinely
 * indeterminate, and is presented that way.
 */
const PHASE_COPY = {
  uploading: 'Uploading retinal image...',
  analyzing: 'Running AI analysis on the server...',
};

export default function NewScreening() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline, queueScreeningOffline } = useOffline();

  // Pre-selected patient if navigated from patient profile
  const preSelectedPatient = location.state?.selectedPatient || null;

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(preSelectedPatient);
  const [patientSearch, setPatientSearch] = useState('');
  const [eyeSide, setEyeSide] = useState('Right Eye (OD)');
  const [notes, setNotes] = useState('');

  // Image upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [phase, setPhase] = useState('uploading');
  const [uploadPercent, setUploadPercent] = useState(0);

  const fileInputRef = useRef(null);

  // Search patients for autocomplete
  useEffect(() => {
    if (!selectedPatient) {
      const fetchList = async () => {
        try {
          const res = await patientService.getAll({ search: patientSearch, limit: 5 });
          setPatients(res.data.patients || []);
        } catch {
          // Ignore
        }
      };
      const timer = setTimeout(fetchList, 250);
      return () => clearTimeout(timer);
    }
  }, [patientSearch, selectedPatient]);

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG, WEBP, TIFF)');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // One-click load demo fundus sample
  const handleSelectDemoSample = async (sample) => {
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], `${sample.url.split('/').pop()}`, {
        type: 'image/jpeg',
      });
      setSelectedFile(file);
      setPreviewUrl(sample.url);
      toast.success(`Loaded ${sample.name}`);
    } catch {
      setPreviewUrl(sample.url);
    }
  };

  // Submit and run AI inference
  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (!selectedFile && !previewUrl) {
      toast.error('Please upload or select a retinal fundus image');
      return;
    }

    setAnalyzing(true);
    setPhase('uploading');
    setUploadPercent(0);

    try {
      if (!isOnline) {
        await queueScreeningOffline({
          patientId: selectedPatient._id,
          eyeSide,
          notes,
          imageBlob: selectedFile,
        });
        navigate('/patients');
        return;
      }

      const formData = new FormData();
      formData.append('patientId', selectedPatient._id);
      formData.append('eyeSide', eyeSide);
      if (notes) formData.append('notes', notes);

      if (selectedFile) {
        formData.append('image', selectedFile);
      } else {
        const res = await fetch(previewUrl);
        const blob = await res.blob();
        formData.append('image', blob, 'demo_fundus.jpg');
      }

      const response = await screeningService.create(formData, {
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadPercent(percent);
          // Once the bytes are on the server the client genuinely cannot know
          // how far inference has got, so stop implying it can.
          if (percent >= 100) setPhase('analyzing');
        },
      });
      toast.success('Retinal analysis complete!');
      navigate(`/screenings/${response.data.screening._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Inference error. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <SectionHeading
        badge="Guided Stepper"
        icon={ScanEye}
        title="New Retinal Screening"
        subtitle="AI-assisted fundus image classification with Grad-CAM visualization"
        action={
          <Link
            to="/patients/new"
            className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl"
          >
            + Register New Patient
          </Link>
        }
      />

      <form onSubmit={handleAnalyze} className="space-y-6">
        {/* Step 1: Patient Selection */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              1. Select Patient for Screening
            </h2>
            {selectedPatient && (
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                Change Patient
              </button>
            )}
          </div>

          {selectedPatient ? (
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4.5 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <p className="font-bold text-white text-sm">{selectedPatient.name}</p>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
                    {selectedPatient.patientId}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {selectedPatient.age} yrs • {selectedPatient.gender} • {selectedPatient.village}, {selectedPatient.district}
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search registered patient by Name, ID, or Phone..."
                  className="w-full bg-slate-900 text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/80 text-slate-100 placeholder-slate-500"
                />
              </div>

              {patients.length > 0 ? (
                <div className="border border-slate-800 bg-slate-950/80 rounded-2xl divide-y divide-slate-800/80 max-h-48 overflow-y-auto">
                  {patients.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => setSelectedPatient(p)}
                      className="p-3.5 hover:bg-slate-900 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <p className="font-bold text-xs text-white">{p.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {p.patientId} • {p.village} • {p.phone || 'No phone'}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400">Select →</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    {patientSearch ? 'No matching patient found.' : 'No registered patients found in registry.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/patients/new')}
                    className="text-xs font-bold text-cyan-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    Register New Patient First →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Retinal Image Upload */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              2. Upload Retinal Fundus Image
            </h2>

            {/* Subtle optional testing helper */}
            <details className="text-right">
              <summary className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer select-none">
                Sample test images
              </summary>
              <div className="absolute right-6 mt-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl z-20 flex flex-col gap-1.5 text-left min-w-[160px]">
                <p className="text-[10px] font-mono text-slate-400 pb-1 border-b border-slate-800">Pipeline Test Samples:</p>
                {DEMO_SAMPLES.map((sample) => (
                  <button
                    type="button"
                    key={sample.name}
                    onClick={() => handleSelectDemoSample(sample)}
                    className="px-2.5 py-1.5 text-left hover:bg-slate-900 rounded-lg text-xs font-medium text-slate-200 transition cursor-pointer"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
              previewUrl
                ? 'border-cyan-500/50 bg-cyan-950/10'
                : 'border-slate-800 hover:border-cyan-500/40 bg-slate-950/40 hover:bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Fundus Preview"
                  className="max-h-60 mx-auto rounded-2xl shadow-2xl object-contain border border-cyan-500/30"
                />
                <p className="text-xs text-slate-400 font-mono">
                  Click to select a different retinal image
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-6">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto shadow-md">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Click to upload or drag & drop fundus image
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Supports JPG, PNG, WEBP, TIFF (up to 25 MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Eye Side & Clinical Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Eye Examined *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Right Eye (OD)', 'Left Eye (OS)', 'Both Eyes'].map((side) => (
                  <button
                    type="button"
                    key={side}
                    onClick={() => setEyeSide(side)}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      eyeSide === side
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Clinical Examination Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Media clear, small dot hemorrhages in macula"
            />
          </div>
        </div>

        {/* Inference Progress Overlay if analyzing */}
        {analyzing && (
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-cyan-500/40 space-y-4 animate-in fade-in shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
              <p className="font-bold text-sm text-cyan-300">{PHASE_COPY[phase]}</p>
            </div>

            {/* Determinate only while uploading, because that is the only part
                whose progress the client can actually observe. */}
            {phase === 'uploading' ? (
              <div
                className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800"
                role="progressbar"
                aria-valuenow={uploadPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Upload progress"
              >
                <div
                  className="h-full bg-cyan-500 transition-[width] duration-200 rounded-full"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            ) : (
              <div
                className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative"
                role="progressbar"
                aria-label="Analysis in progress"
              >
                <div className="absolute inset-y-0 w-1/3 bg-cyan-500/70 rounded-full animate-[indeterminate_1.4s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:w-full motion-reduce:opacity-40" />
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {phase === 'uploading'
                ? `${uploadPercent}% uploaded`
                : 'Analysis time depends on server load. Please keep this page open.'}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/screenings')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="cyan"
            size="lg"
            loading={analyzing}
            disabled={analyzing || !selectedPatient || (!selectedFile && !previewUrl)}
            icon={ScanEye}
            className="shadow-[0_0_25px_rgba(6,182,212,0.4)]"
          >
            {analyzing ? 'Analyzing Retina...' : 'Analyze Retina with AI'}
          </Button>
        </div>
      </form>
    </div>
  );
}
