import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { chatService } from '../../services/entities.service';

const QUICK_PROMPTS = [
  'What is Diabetic Retinopathy?',
  'What does Moderate DR mean?',
  'Why is Grad-CAM heatmap important?',
  'How often should diabetics get screened?',
];

export default function ChatWidget({ screeningId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am RetinaAI Clinical Assistant. I can help explain diabetic retinopathy screening findings, risk factors, and eye care guidelines. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: query.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage({
        message: query.trim(),
        screeningId,
      });

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.reply,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Sorry, I could not process your query right now. Please try again later.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white px-4.5 py-3 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 transition-all duration-300 group border border-cyan-300/40 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold pr-1">Ask AI Guide</span>
          <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] glass-panel-elevated rounded-3xl border border-cyan-500/30 flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-slate-900/90 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">RetinaAI Educational Guide</p>
                <p className="text-[10px] text-cyan-400 font-mono">Clinical Knowledge Base</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Medical Notice */}
          <div className="bg-amber-950/40 border-b border-amber-500/20 px-3.5 py-2 flex items-start gap-2 text-[11px] text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>Educational guidance only. Does not replace certified clinical diagnosis.</span>
          </div>

          {/* Message Stream */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#030712]/70">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
                <Loader2 className="w-4 h-4 border-t-cyan-400 animate-spin text-cyan-400" />
                <span className="font-mono text-[11px]">Analyzing clinical guidelines...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="shrink-0 bg-slate-900 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30 text-slate-400 text-[11px] px-3 py-1 rounded-full border border-slate-800 transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about diabetic eye care, stages, heatmaps..."
              className="flex-1 bg-slate-950 text-xs text-white placeholder-slate-500 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/60 transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 p-2.5 rounded-xl transition font-bold cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
