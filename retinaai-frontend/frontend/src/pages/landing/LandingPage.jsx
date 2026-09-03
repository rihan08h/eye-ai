import { Suspense, lazy, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanEye, ArrowRight, CheckCircle2, Activity, WifiOff, Eye, ShieldCheck, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LandingNavbar from './components/LandingNavbar';
import WhySection from './components/WhySection';
import WhatSection from './components/WhatSection';
import HowItWorks from './components/HowItWorks';
import PlatformPreview from './components/PlatformPreview';
import TestYourEyeCTA from './components/TestYourEyeCTA';
import Button from '../../components/ui/Button';

const HeroRetina3D = lazy(() => import('./components/HeroRetina3D'));

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        const res = await api.get('/health');
        if (res.data?.aiModel) {
          setModelInfo(res.data.aiModel);
        }
      } catch {
        // Continue with baseline defaults
      }
    };
    fetchLiveStatus();
  }, []);

  const handleStartScreening = () => {
    if (isAuthenticated) navigate('/screenings/new');
    else navigate('/login', { state: { from: { pathname: '/screenings/new' } } });
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden font-sans"
      style={{ background: '#070d1e' }}>

      {/* ── Global Ambient Background ────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(6,182,212,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59,130,246,0.06) 0%, transparent 70%)',
      }} />

      {/* Subtle dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(148,163,184,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <LandingNavbar />

      <main className="relative z-10">
        {/* ════════════════════════════════════════════════════════════════════
             HERO SECTION
            ════════════════════════════════════════════════════════════════════ */}
        <section id="hero" className="min-h-screen pt-24 pb-16 flex items-center relative overflow-hidden">

          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-center">

              {/* ── Left: Hero Copy ─────────────────────────────────────── */}
              <div className="space-y-8 lg:pr-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-mono font-semibold border"
                  style={{
                    background: 'rgba(6,182,212,0.08)',
                    borderColor: 'rgba(6,182,212,0.3)',
                    color: '#22d3ee',
                  }}>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  AI-POWERED FOR RURAL HEALTHCARE
                </div>

                {/* Headline — exact reference style */}
                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] xl:text-[4.2rem] font-black text-white tracking-tight leading-[1.05]">
                    Detect Diabetic<br />
                    Retinopathy Earlier.
                  </h1>
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] xl:text-[4.2rem] font-black tracking-tight leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">
                    Save Sight. Save Lives.
                  </h1>
                </div>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md font-normal">
                  Explainable AI-assisted retinal screening that helps healthcare workers identify high-risk patients and connect rural communities with timely specialist care.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-start gap-3 pt-1">
                  <button
                    onClick={handleStartScreening}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                      boxShadow: '0 0 28px rgba(6,182,212,0.45)',
                    }}
                  >
                    <ScanEye className="w-4.5 h-4.5" />
                    Start Screening
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => { const el = document.getElementById('platform'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm text-white border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-600 transition-all cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                    </div>
                    Explore Platform
                  </button>
                </div>

                {/* Trust micro-line */}
                <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 pt-2">
                  <div className="flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Offline-First</span>
                    <span className="text-slate-700">Built for rural reality</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>Explainable AI</span>
                    <span className="text-slate-700">See why AI decides</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Rural Impact</span>
                    <span className="text-slate-700">Care that reaches</span>
                  </div>
                </div>
              </div>

              {/* ── Right: 3D Retina Globe ───────────────────────────────── */}
              <div className="relative flex items-center justify-center">
                <Suspense
                  fallback={
                    <div className="w-full h-[520px] flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  }
                >
                  <HeroRetina3D />
                </Suspense>
              </div>
            </div>

            {/* ── Metric Strip ────────────────────────────────────────────── */}
            <div className="mt-16 pt-8 border-t border-slate-800/60 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  value: modelInfo?.architecture ? modelInfo.architecture.toUpperCase() : 'DenseNet-169',
                  label: modelInfo?.available ? 'Active Deep Model' : 'Inference Pipeline',
                  color: 'text-white',
                },
                { value: 'Grad-CAM', label: 'Lesion Localization', color: 'text-cyan-400' },
                { value: '5 Stages', label: 'ICDR Severity Triage', color: 'text-blue-400' },
                { value: '100%', label: 'Offline Capable', color: 'text-purple-400' },
              ].map((m) => (
                <div key={m.label} className="space-y-1">
                  <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${m.color}`}>{m.value}</p>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
             CONTENT SECTIONS
            ════════════════════════════════════════════════════════════════════ */}
        <WhySection />
        <WhatSection />
        <HowItWorks />
        <PlatformPreview />
        <TestYourEyeCTA />
      </main>

      {/* ════════════════════════════════════════════════════════════════════
           MULTI-COLUMN FOOTER — exactly like the reference
          ════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-800/60 relative z-10"
        style={{ background: '#050a16' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Top Footer Grid */}
          <div className="py-14 grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-10">
            {/* Brand Column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Activity className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <span className="text-base font-black text-white tracking-tight">RetinaAI</span>
                  <p className="text-[10px] text-slate-500 font-medium">AI-Powered Retinal Screening<br />for Rural Healthcare</p>
                </div>
              </div>
              {/* Socials */}
              <div className="flex gap-2.5 pt-1">
                {['tw', 'li', 'gh'].map((s) => (
                  <div key={s} className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer text-[10px] font-mono font-bold">
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Product</p>
              <nav className="space-y-2">
                {['Platform', 'Patients', 'How It Works', 'Technology', 'Pricing'].map((l) => (
                  <a key={l} href="#" className="block text-xs text-slate-500 hover:text-slate-200 transition">{l}</a>
                ))}
              </nav>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Resources</p>
              <nav className="space-y-2">
                {['Blog', 'Documentation', 'Help Center', 'Contact'].map((l) => (
                  <a key={l} href="#" className="block text-xs text-slate-500 hover:text-slate-200 transition">{l}</a>
                ))}
              </nav>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Company</p>
              <nav className="space-y-2">
                {['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'].map((l) => (
                  <a key={l} href="#" className="block text-xs text-slate-500 hover:text-slate-200 transition">{l}</a>
                ))}
              </nav>
            </div>

            {/* Stay Connected */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Stay Connected</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Get updates on RetinaAI and rule out eye impact.
              </p>
              <div className="flex rounded-xl overflow-hidden border border-slate-700/80">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-slate-900/80 text-xs text-white px-3.5 py-2.5 outline-none placeholder:text-slate-600"
                />
                <button className="px-3.5 bg-cyan-500 hover:bg-cyan-400 transition text-slate-950 font-bold text-xs">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Clinical Disclaimer */}
          <div className="py-4 border-t border-slate-800/60 text-[10px] text-slate-600 text-center leading-relaxed max-w-3xl mx-auto">
            <strong className="text-slate-500">Clinical Notice:</strong> RetinaAI provides AI-assisted screening for diabetic eye disease. It assists frontline workers and is not a replacement for dilated eye examination by a certified ophthalmologist.
          </div>

          {/* Bottom Bar */}
          <div className="py-5 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-600">
            <span>© {new Date().getFullYear()} RetinaAI. All rights reserved.</span>
            <a href="#hero" className="hover:text-cyan-400 transition">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
