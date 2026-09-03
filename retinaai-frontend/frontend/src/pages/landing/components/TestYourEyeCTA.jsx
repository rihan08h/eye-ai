import { useNavigate } from 'react-router-dom';
import { ScanEye, MessageCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function TestYourEyeCTA() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartScreening = () => {
    if (isAuthenticated) navigate('/screenings/new');
    else navigate('/login', { state: { from: { pathname: '/screenings/new' } } });
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Section separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />

      {/* Big ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[280px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, rgba(59,130,246,0.04) 50%, transparent 100%)' }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left: Text */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Ready to Start Saving Sight?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
              Join healthcare workers making a difference with RetinaAI across rural clinics, ASHA centers, and eye camps.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3 pt-2">
              <button
                onClick={handleStartScreening}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  boxShadow: '0 0 30px rgba(6,182,212,0.4)',
                }}
              >
                <ScanEye className="w-4 h-4" />
                {isAuthenticated ? 'Open New Screening' : 'Start Screening Now'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => { if (isAuthenticated) navigate('/dashboard'); else navigate('/login'); }}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm text-slate-300 border border-slate-700/80 bg-slate-900/40 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Talk to Our Team
              </button>
            </div>
          </div>

          {/* Right: Glowing Eye Visual */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Outer glow rings */}
              {[1.0, 0.75, 0.5, 0.25].map((op, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border"
                  style={{
                    inset: `${i * 14}%`,
                    borderColor: `rgba(6,182,212,${op * 0.35})`,
                    boxShadow: i === 0 ? '0 0 40px rgba(6,182,212,0.2)' : 'none',
                    animation: `spin ${8 + i * 3}s linear infinite ${i % 2 === 1 ? 'reverse' : ''}`,
                  }}
                />
              ))}

              {/* Center eye icon */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center border relative z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, rgba(59,130,246,0.1) 70%, transparent 100%)',
                  borderColor: 'rgba(6,182,212,0.5)',
                  boxShadow: '0 0 40px rgba(6,182,212,0.35), inset 0 0 20px rgba(6,182,212,0.1)',
                }}
              >
                <ScanEye className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
