import React, { useState } from 'react';
import { Scale, X, Copy, Check, Send, Sparkles, BookOpen, FileText } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface LegalCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalCitationModal: React.FC<LegalCitationModalProps> = ({ isOpen, onClose }) => {
  const { sendMessage } = useChat();

  const [activeTab, setActiveTab] = useState<'form' | 'paste'>('form');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Form State
  const [caseTitle, setCaseTitle] = useState('Kesavananda Bharati v. State of Kerala');
  const [court, setCourt] = useState('Supreme Court of India');
  const [year, setYear] = useState('1973');
  const [reporter, setReporter] = useState('AIR 1973 SC 1461');
  const [neutralCitation, setNeutralCitation] = useState('1973 INSC 12');
  const [pinpoint, setPinpoint] = useState('para 42');
  const [bench, setBench] = useState('S.M. Sikri, C.J., et al.');
  const [holding, setHolding] = useState('Basic Structure Doctrine established; Parliament cannot amend the basic structure of the Constitution.');

  // Paste Text State
  const [pastedJudgment, setPastedJudgment] = useState('');

  if (!isOpen) return null;

  // Formatting logic
  const formattedCaseTitle = caseTitle.trim() || 'Party A v. Party B';
  const formattedYear = year.trim() || '2024';
  const formattedCourt = court.trim() || 'Supreme Court';
  const formattedReporter = reporter.trim() || 'Vol. Page';
  const formattedPinpoint = pinpoint.trim() ? `, ${pinpoint.trim()}` : '';

  const citations = [
    {
      style: 'Official / Law Reporter Format',
      badge: 'Reporting Standard',
      text: `${formattedCaseTitle}, ${formattedReporter}${formattedPinpoint} (${formattedCourt} ${formattedYear}).`
    },
    {
      style: 'Neutral Citation Format',
      badge: 'Court Register',
      text: neutralCitation.trim()
        ? `${formattedCaseTitle}, [${formattedYear}] ${neutralCitation.trim()}${formattedPinpoint}.`
        : `${formattedCaseTitle}, [${formattedYear}] ${formattedCourt} ${formattedPinpoint}.`
    },
    {
      style: 'Bluebook Legal Citation',
      badge: 'US / International',
      text: `${formattedCaseTitle}, ${formattedReporter}${formattedPinpoint} (${formattedYear}).`
    },
    {
      style: 'OSCOLA Citation Format',
      badge: 'UK / Commonwealth',
      text: `${formattedCaseTitle} [${formattedYear}] ${formattedReporter}${formattedPinpoint}.`
    },
    {
      style: 'Pinpoint Quote Reference (Briefs / Reporting)',
      badge: 'Briefs & Law Reports',
      text: `*${formattedCaseTitle}*, ${formattedReporter} at ${pinpoint.trim() || 'page/para'} per ${bench.trim() || 'the Bench'}${holding.trim() ? ` ("${holding.trim()}")` : ''}.`
    },
    {
      style: 'Short Form Citation (Id. / Supra)',
      badge: 'In-Text Reporting',
      text: `*${formattedCaseTitle.split(' v. ')[0] || formattedCaseTitle}*, ${formattedReporter} at ${pinpoint.trim() || 'p. X'}.`
    }
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSendToChat = (text: string) => {
    const prompt = `Please analyze and generate a full legal judgment report and brief for this citation:\n\n${text}\n\nKey Details:\n- Court: ${formattedCourt}\n- Decision Year: ${formattedYear}\n- Bench: ${bench}\n- Holding/Ratio: ${holding}`;
    sendMessage(prompt);
    onClose();
  };

  const handleSendPastedToChat = () => {
    if (!pastedJudgment.trim()) return;
    const prompt = `Please extract and generate standardized legal citations (Bluebook, OSCOLA, AIR/SCC, Neutral Citation) and a complete law report summary for this judgment snippet:\n\n"""\n${pastedJudgment.trim()}\n"""`;
    sendMessage(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#111728] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1322]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Judgment Citation Generator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-mono">
                  Legal Reporting
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Format court judgments for legal reports, law journals & court briefs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 px-6 pt-3 gap-4 bg-[#0e1322]">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'form'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Structured Details Form
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste Judgment Snippet
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'form' ? (
            <>
              {/* Form Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Case Title / Parties
                  </label>
                  <input
                    type="text"
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    placeholder="e.g. Kesavananda Bharati v. State of Kerala or Brown v. Board of Edu."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Court Name
                  </label>
                  <input
                    type="text"
                    value={court}
                    onChange={(e) => setCourt(e.target.value)}
                    placeholder="e.g. Supreme Court of India / US Supreme Court"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Decision Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 1973 or 2024"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Official Law Reporter (Volume/Page)
                  </label>
                  <input
                    type="text"
                    value={reporter}
                    onChange={(e) => setReporter(e.target.value)}
                    placeholder="e.g. AIR 1973 SC 1461, (1973) 4 SCC 225, 347 U.S. 483"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Neutral Citation / Media Citation
                  </label>
                  <input
                    type="text"
                    value={neutralCitation}
                    onChange={(e) => setNeutralCitation(e.target.value)}
                    placeholder="e.g. 1973 INSC 12 or [2022] UKSC 1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Pinpoint Reference (Page / Paragraph)
                  </label>
                  <input
                    type="text"
                    value={pinpoint}
                    onChange={(e) => setPinpoint(e.target.value)}
                    placeholder="e.g. para 42 or p. 1480"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Presiding Bench / Judge
                  </label>
                  <input
                    type="text"
                    value={bench}
                    onChange={(e) => setBench(e.target.value)}
                    placeholder="e.g. Sikri, C.J., et al."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Ratio Decidendi / Holding Summary (Optional Parenthetical)
                  </label>
                  <input
                    type="text"
                    value={holding}
                    onChange={(e) => setHolding(e.target.value)}
                    placeholder="e.g. Holding that constitutional amendments cannot alter the basic structure"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Citations Preview List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Generated Citation Formats</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ready for Law Reports & Briefs</span>
                </h4>

                <div className="space-y-2.5">
                  {citations.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-indigo-300">
                            {item.style}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800/60 text-indigo-400 font-mono">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-100 font-serif leading-relaxed select-all">
                          {item.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <button
                          onClick={() => handleCopy(item.text, idx)}
                          title="Copy Citation"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs flex items-center gap-1"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleSendToChat(item.text)}
                          title="Ask Nexora AI to analyze case report"
                          className="p-1.5 rounded-lg bg-indigo-600/80 text-white hover:bg-indigo-600 transition-colors text-xs flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Paste Judgment Snippet Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Paste Judgment Text or Legal Headnotes
                </label>
                <textarea
                  value={pastedJudgment}
                  onChange={(e) => setPastedJudgment(e.target.value)}
                  rows={8}
                  placeholder="Paste any judgment excerpt, order copy, or case details here. Nexora AI will parse the party names, court, reporter volume, ratio decidendi, and construct citations for legal reporting..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  Nexora AI automatically identifies jurisdiction specific law reporters (e.g., AIR, SCC, PLD, SCMR, US, S.Ct., UKSC) and formats pinpoint citations for legal briefs and court reporting.
                </p>
              </div>

              <button
                onClick={handleSendPastedToChat}
                disabled={!pastedJudgment.trim()}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Sparkles className="w-4 h-4" />
                Generate Full Legal Citations & Report with AI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
