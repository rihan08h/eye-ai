import { Construction, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function ComingSoon({ title = 'Feature in Development', phase = '' }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] mb-2">
        <Construction className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
        {phase && (
          <span className="inline-block text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30">
            {phase}
          </span>
        )}
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-2">
          This clinical telemetry module is currently in active development for rural health workflows.
        </p>
      </div>

      <Button
        variant="cyan"
        size="sm"
        onClick={() => navigate('/dashboard')}
        className="mt-4"
      >
        Return to Command Center
      </Button>
    </div>
  );
}
