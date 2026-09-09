import React from 'react';
import {
  Sparkles,
  ArrowRight,
  FileText,
  FileSearch,
  Image as ImageIcon,
  MessageSquare,
  Languages,
  ShieldCheck,
  Zap,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Cpu,
  Play
} from 'lucide-react';
import { HeroLogoBadge } from './HeroLogoBadge';

interface LandingPageProps {
  onStartWriting: () => void;
  onOpenLogin: () => void;
  onOpenSignUp: () => void;
  onPlayIntro?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartWriting,
  onOpenLogin,
  onOpenSignUp,
  onPlayIntro
}) => {
  const scrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-indigo-600/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-md px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#090e1a] ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-600/30 shrink-0">
            <img 
              src="/logo.png" 
              alt="Nexora Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Nexora
            </span>
            <span className="hidden sm:inline-block ml-2 text-[11px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800/60 text-indigo-300 font-mono">
              Nexora 3.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onPlayIntro && (
            <button
              onClick={onPlayIntro}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-xs font-semibold text-indigo-300 border border-indigo-500/20 transition-all hover:border-indigo-500/40"
            >
              <Play className="w-3 h-3 fill-indigo-400 text-indigo-400" />
              <span>Watch Intro</span>
            </button>
          )}
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={onOpenSignUp}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/25 transition-all"
          >
            Sign Up Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 sm:px-12 pt-16 sm:pt-28 pb-20 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Glow backdrop effect */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-indigo-300 shadow-sm mb-4">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen Document Intelligence & Multimodal Writing</span>
        </div>

        {/* Hero Logo Card (Exact Size Preserved) */}
        <HeroLogoBadge />

        {/* Big Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
          WRITE SMARTER.<br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-200 bg-clip-text text-transparent">
            UNDERSTAND FASTER.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Nexora helps you write, analyze documents, understand images, summarize information, and turn ideas into polished content.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onStartWriting}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            <span>Start Writing Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          {onPlayIntro && (
            <button
              onClick={onPlayIntro}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-200 font-semibold text-base flex items-center justify-center gap-2 transition-colors group"
            >
              <Play className="w-4 h-4 fill-indigo-400 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Watch Intro Video</span>
            </button>
          )}
          <button
            onClick={scrollToFeatures}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base transition-colors"
          >
            Explore Features
          </button>
        </div>

        {/* Quick Highlights */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-left">
          {[
            { label: 'PDF Document Q&A', sub: 'Instant chunk retrieval' },
            { label: 'Multimodal Vision', sub: 'Diagrams & handwritten notes' },
            { label: 'Multilingual Engine', sub: 'Urdu, Hindi, Arabic & more' },
            { label: 'Enterprise Security', sub: 'Isolated Firestore & Auth' }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="font-semibold text-slate-200 text-sm">{item.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Sections */}
      <section id="features-section" className="py-20 bg-[#090d17] border-y border-slate-800/80 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              A Complete Intelligence Suite for Knowledge & Writing
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              Designed for researchers, students, authors, and professionals who demand speed, depth, and precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. AI Writing */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Writing & Rewriting</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Craft essays, articles, reports, business proposals, applications, and YouTube scripts. Fine-tune with one-click tone rewrites (Professional, Simple, Academic).
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Grammar & vocabulary elevation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Custom length and format controls</span>
                </li>
              </ul>
            </div>

            {/* 2. Document Analysis */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-600/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileSearch className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Deep PDF Analysis</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Upload multi-page PDFs, books, and legal documents. Nexora extracts text, indexes chapters, answers questions, and generates exam MCQs.
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>50+ MCQs exam generator with answers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Executive summaries & key takeaways</span>
                </li>
              </ul>
            </div>

            {/* 3. Image Understanding */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-600/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Image & Notes Vision</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Multimodal recognition for handwritten whiteboard notes, textbook photos, technical architecture diagrams, charts, and scanned invoices.
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>OCR & handwritten notes conversion</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Visual charts & graph breakdown</span>
                </li>
              </ul>
            </div>

            {/* 4. Smart Chat */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Conversational Context</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Maintains continuous conversational context across turns. Easily simplify explanations, ask follow-up questions, or pivot topics seamlessly.
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Streaming token generation with stop control</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Persistent history & fast search</span>
                </li>
              </ul>
            </div>

            {/* 5. Multilingual AI */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Languages className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Multilingual Intelligence</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Native fluency in Urdu (اردو), Hindi (हिंदी), Arabic (العربية), Punjabi (ਪੰਜਾਬੀ), and global languages with idiomatic cultural nuances.
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-400" />
                  <span>Translate and explain complex PDFs in Urdu/Hindi</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-400" />
                  <span>Natural non-literal translation engine</span>
                </li>
              </ul>
            </div>

            {/* 6. Fast & Secure */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Enterprise Security</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Protected with Firebase Authentication, strictly isolated Firestore user data rules, and server-side secret protection for API keys.
                </p>
              </div>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Private documents never shared or leaked</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export to TXT, Markdown & PDF</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="py-16 px-6 sm:px-12 bg-[#060911] border-t border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 mx-auto flex items-center justify-center text-white shadow-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Experience the Future of AI Writing Today
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Join Nexora to write superior articles, dissect multi-page documents, and accelerate your productivity with Nexora AI.
          </p>
          <div>
            <button
              onClick={onStartWriting}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              Get Started for Free
            </button>
          </div>
          <p className="text-xs text-slate-600 pt-6">
            © {new Date().getFullYear()} Nexora. Powered by Nexora AI & Firebase.
          </p>
        </div>
      </footer>
    </div>
  );
};
