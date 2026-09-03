import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, AlertCircle, HelpCircle, BookOpen, ShieldCheck, Loader2 } from 'lucide-react';
import { chatService } from '../../services/entities.service';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';

const TOPIC_CATEGORIES = [
  {
    title: 'Understanding DR Stages',
    questions: [
      'What is Diabetic Retinopathy?',
      'What does Moderate DR mean?',
      'What is Proliferative DR (PDR)?',
      'What is the difference between NPDR and PDR?',
    ],
  },
  {
    title: 'Explainable AI & Screening',
    questions: [
      'Why is Grad-CAM heatmap important?',
      'What does the Grad-CAM heatmap show?',
      'What does Image Quality score measure?',
      'Why is early screening essential?',
    ],
  },
  {
    title: 'Prevention & Management',
    questions: [
      'How can patients prevent vision loss from diabetes?',
      'What HbA1c target is recommended?',
      'When should a high-risk patient see a specialist?',
    ],
  },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'bot',
      text: `Welcome to the **RetinaAI Educational Assistant**.

I am trained on clinical ophthalmology guidelines to answer questions about:
• Diabetic Retinopathy pathophysiology & stages (Mild, Moderate, Severe, PDR)
• Interpreting AI screening confidence & Grad-CAM XAI heatmaps
• Lifestyle, glycemic management, and referral protocols for rural health workers.

How can I assist you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: textToSend.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage({ message: textToSend.trim() });
      const botMsg = { id: (Date.now() + 1).toString(), sender: 'bot', text: res.data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Unable to connect to assistant service. Please check your internet or retry later.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <SectionHeading
        badge="Clinical Knowledge Base"
        icon={Bot}
        title="AI Eye Health Educational Assistant"
        subtitle="Interactive knowledge base for rural health workers, clinicians, and community volunteers"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chat Conversation Column */}
        <div className="lg:col-span-8 glass-panel-elevated rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[640px]">
          {/* Top Banner */}
          <div className="bg-amber-950/40 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Educational Tool:</strong> Provides general diabetic eye guidance. Does not diagnose or prescribe.
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#030712]/70">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
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
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Loader2 className="w-4 h-4 border-t-cyan-400 animate-spin text-cyan-400" />
                <span className="font-mono text-cyan-400">Consulting ophthalmology knowledge base...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any question about diabetic retinopathy, staging, or eye health..."
              className="flex-1 bg-slate-900 text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-cyan-500/80 text-slate-100 placeholder-slate-500 transition"
            />
            <Button
              type="submit"
              variant="cyan"
              disabled={loading || !input.trim()}
              icon={Send}
              className="shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Send
            </Button>
          </form>
        </div>

        {/* Suggested Topics Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-3xl border border-slate-800 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Suggested Clinical Topics
            </h2>

            {TOPIC_CATEGORIES.map((cat) => (
              <div key={cat.title} className="space-y-1.5">
                <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {cat.title}
                </p>
                <div className="space-y-1">
                  {cat.questions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="w-full text-left text-xs text-slate-300 hover:text-cyan-400 hover:bg-slate-900 p-2.5 rounded-xl transition border border-transparent hover:border-slate-800 flex items-center justify-between group cursor-pointer"
                    >
                      <span className="line-clamp-1">{q}</span>
                      <span className="text-slate-500 group-hover:text-cyan-400 font-bold ml-1">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
