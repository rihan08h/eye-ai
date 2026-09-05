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
          className="flex items-center gap-2.5 bg-[#0f1d23] text-[#f2f6f7] hover:border-[#18b8d4] hover:text-[#18b8d4] px-4 py-2.5 rounded-full shadow-[0_12px_32px_-8px_rgba(0,0,0,0.8)] hover:-translate-y-0.5 transition-all duration-200 group border border-white/[0.12] cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#18b8d4]/10 border border-[#18b8d4]/20 flex items-center justify-center text-[#18b8d4]">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold pr-1">Clinical AI Guide</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#18b8d4] shadow-[0_0_6px_#18b8d4]" />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] bg-[#0f1d23] rounded-3xl border border-white/[0.12] flex flex-col overflow-hidden shadow-[0_24px_50px_-15px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#0a161b] text-[#f2f6f7] px-5 py-3.5 flex items-center justify-between border-b border-white/[0.085]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#18b8d4]/10 border border-[#18b8d4]/20 flex items-center justify-center text-[#18b8d4]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#f2f6f7] leading-tight">RetinaAI Clinical Guide</p>
                <p className="text-[10px] text-[#18b8d4] font-medium">Educational Knowledge Base</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#a3b1b7] hover:text-[#f2f6f7] p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Medical Notice */}
          <div className="bg-[#e08a3c]/10 border-b border-[#e08a3c]/20 px-3.5 py-2 flex items-start gap-2 text-[11px] text-[#e08a3c]">
            <AlertCircle className="w-3.5 h-3.5 text-[#e08a3c] shrink-0 mt-0.5" />
            <span>Educational guidance only. Does not replace certified clinical diagnosis.</span>
          </div>

          {/* Message Stream */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#071014]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-[#18b8d4]/10 border border-[#18b8d4]/20 flex items-center justify-center shrink-0 text-[#18b8d4] mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#18b8d4] text-[#03212a] font-medium rounded-br-none shadow-md'
                      : 'bg-[#0f1d23] border border-white/[0.085] text-[#f2f6f7] rounded-bl-none shadow-sm whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#a3b1b7] pl-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#18b8d4]" />
                <span className="text-[11px]">Analyzing clinical guidelines...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-[#0a161b] border-t border-white/[0.085] flex gap-1.5 overflow-x-auto scrollbar-none">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="shrink-0 bg-[#0f1d23] hover:border-[#18b8d4]/40 hover:text-[#18b8d4] text-[#a3b1b7] text-[11px] px-3 py-1 rounded-full border border-white/[0.085] transition cursor-pointer"
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
            className="p-3 bg-[#0a161b] border-t border-white/[0.085] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about diabetic eye care, stages, heatmaps..."
              className="flex-1 bg-[#071014] text-xs text-[#f2f6f7] placeholder-[#6f8188] px-3.5 py-2.5 rounded-xl border border-white/[0.085] focus:outline-none focus:border-[#18b8d4]/60 transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#18b8d4] hover:bg-[#3fd0e8] disabled:opacity-40 text-[#03212a] p-2.5 rounded-xl transition font-bold cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
