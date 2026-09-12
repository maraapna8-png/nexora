import React, { useState } from 'react';
import { Scale, X, Copy, Check, Send, Sparkles, BookOpen, FileText, Globe, Landmark, ChevronDown } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface LegalCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrecedentExample {
  title: string;
  caseTitle: string;
  court: string;
  year: string;
  reporter: string;
  reporterType: string;
  caseNo: string;
  pinpoint: string;
  bench: string;
  holding: string;
  benchSeat?: string;
  urduTitle?: string;
}

const PAKISTANI_PRESETS: PrecedentExample[] = [
  {
    title: 'Mst. Asia Bibi v. The State (2019)',
    caseTitle: 'Mst. Asia Bibi v. The State',
    court: 'Supreme Court of Pakistan',
    year: '2019',
    reporter: 'PLD 2019 SC 64',
    reporterType: 'PLD',
    caseNo: 'Criminal Appeal No. 39-L of 2015',
    pinpoint: 'para 14',
    bench: 'Asif Saeed Khan Khosa, C.J., Mazhar Alam Khan Miankhel, J., and Saqib Nisar, C.J.',
    holding: 'Standard of proof in capital offences is beyond reasonable doubt; uncorroborated testimony and procedural infirmities entitle accused to acquittal.',
    urduTitle: 'مسمات آسیہ بی بی بنام سرکار'
  },
  {
    title: 'Benazir Bhutto v. Federation (1988)',
    caseTitle: 'Ms. Benazir Bhutto v. Federation of Pakistan',
    court: 'Supreme Court of Pakistan',
    year: '1988',
    reporter: 'PLD 1988 SC 416',
    reporterType: 'PLD',
    caseNo: 'Const. Petition No. 2-R of 1987',
    pinpoint: 'p. 488',
    bench: 'Muhammad Haleem, C.J., Nasim Hasan Shah, Shafiur Rahman, JJ.',
    holding: 'Freedom of association under Article 17 guarantees political parties right to participate in elections with party symbols without arbitrary restrictions.',
    urduTitle: 'محترمہ بے نظیر بھٹو بنام وفاقِ پاکستان'
  },
  {
    title: 'Al-Jehad Trust (Judges Case, 1996)',
    caseTitle: 'Al-Jehad Trust v. Federation of Pakistan',
    court: 'Supreme Court of Pakistan',
    year: '1996',
    reporter: 'PLD 1996 SC 324',
    reporterType: 'PLD',
    caseNo: 'Const. Petition No. 29 of 1995',
    pinpoint: 'para 32',
    bench: 'Sajjad Ali Shah, C.J., Ajmal Mian, Fazal Ilahi Khan, JJ.',
    holding: 'Consultation with Chief Justice of Pakistan for appointment of judges is meaningful and binding in the absence of cogent reasons recorded in writing.',
    urduTitle: 'الجہاد ٹرسٹ بنام وفاقِ پاکستان'
  },
  {
    title: 'Justice Qazi Faez Isa (2021)',
    caseTitle: 'Justice Qazi Faez Isa v. The President of Pakistan',
    court: 'Supreme Court of Pakistan',
    year: '2021',
    reporter: 'PLD 2021 SC 1',
    reporterType: 'PLD',
    caseNo: 'Const. Petition No. 17 of 2019',
    pinpoint: 'para 78',
    bench: 'Umar Ata Bandial, Maqbool Baqar, Yahya Afridi, Syed Mansoor Ali Shah, Munib Akhtar, JJ.',
    holding: 'Presidential reference quashed; sovereign judicial independence requires strict adherence to constitutional due process before Supreme Judicial Council.',
    urduTitle: 'جسٹس قاضی فائز عیسیٰ بنام صدرِ پاکستان'
  },
  {
    title: 'Criminal Precedent (2023 SCMR)',
    caseTitle: 'Muhammad Akram v. The State',
    court: 'Supreme Court of Pakistan',
    year: '2023',
    reporter: '2023 SCMR 1420',
    reporterType: 'SCMR',
    caseNo: 'Criminal Appeal No. 112 of 2022',
    pinpoint: 'para 9',
    bench: 'Umar Ata Bandial, C.J., and Sayyed Mazahar Ali Akbar Naqvi, J.',
    holding: 'Delayed FIR and discrepancies between ocular testimony and medical evidence create benefit of doubt in favour of the accused.',
    urduTitle: 'محمد اکرم بنام سرکار'
  },
  {
    title: 'High Court Writ (2023 CLC)',
    caseTitle: 'Tariq Mehmood v. Province of Punjab',
    court: 'Lahore High Court',
    year: '2023',
    reporter: '2023 CLC 745',
    reporterType: 'CLC',
    caseNo: 'Writ Petition No. 5120/2023',
    pinpoint: 'para 6',
    bench: 'Jawad Hassan, J.',
    holding: 'Executive authorities cannot cancel valid statutory commercial permits without issuing prior show-cause notice and observing natural justice principles.',
    benchSeat: 'Rawalpindi Bench',
    urduTitle: 'طارق محمود بنام صوبہ پنجاب'
  }
];

const PAKISTANI_REPORTERS = [
  { code: 'PLD', name: 'Pakistan Legal Decisions', scope: 'Supreme Court, High Courts & FSC', defaultPrefix: 'PLD' },
  { code: 'SCMR', name: 'Supreme Court Monthly Review', scope: 'Supreme Court of Pakistan only', defaultPrefix: '' },
  { code: 'CLC', name: 'Civil Law Cases', scope: 'Civil law judgments of High Courts', defaultPrefix: '' },
  { code: 'PCrLJ', name: 'Pakistan Criminal Law Journal', scope: 'Criminal law judgments of High Courts & SC', defaultPrefix: '' },
  { code: 'MLD', name: 'Monthly Law Digest', scope: 'Important High Court and Special Court cases', defaultPrefix: '' },
  { code: 'YLR', name: 'Yearly Law Reports', scope: 'All High Courts of Pakistan', defaultPrefix: '' },
  { code: 'CLD', name: 'Corporate Law Decisions', scope: 'Banking, corporate, tax & company matters', defaultPrefix: '' },
  { code: 'PLC', name: 'Pakistan Labour Cases', scope: 'Labour and Service Tribunals (PLC C.S.)', defaultPrefix: '' },
  { code: 'PTD', name: 'Pakistan Tax Decisions', scope: 'Income tax, sales tax & customs appeals', defaultPrefix: '' },
  { code: 'PLJ', name: 'Pakistan Law Journal', scope: 'Punjab & Federal Bar Council publication', defaultPrefix: 'PLJ' },
  { code: 'GBLR', name: 'Gilgit-Baltistan Law Reports', scope: 'Chief Court and Supreme Appellate Court GB', defaultPrefix: '' }
];

const PAKISTANI_COURTS = [
  { name: 'Supreme Court of Pakistan', short: 'SC', urdu: 'عدالت عظمیٰ پاکستان' },
  { name: 'Lahore High Court', short: 'LHC', urdu: 'لاہور ہائی کورٹ' },
  { name: 'High Court of Sindh', short: 'SHC', urdu: 'سندھ ہائی کورٹ' },
  { name: 'Islamabad High Court', short: 'IHC', urdu: 'اسلام آباد ہائی کورٹ' },
  { name: 'Peshawar High Court', short: 'PHC', urdu: 'پشاور ہائی کورٹ' },
  { name: 'High Court of Balochistan', short: 'BHC', urdu: 'بلوچستان ہائی کورٹ' },
  { name: 'Federal Shariat Court', short: 'FSC', urdu: 'وفاقی شرعی عدالت' },
  { name: 'Supreme Appellate Court Gilgit-Baltistan', short: 'SACGB', urdu: 'سپریم اپیلٹ کورٹ گلگت بلتستان' }
];

const HIGH_COURT_BENCHES: Record<string, string[]> = {
  'Lahore High Court': ['Principal Seat (Lahore)', 'Rawalpindi Bench', 'Multan Bench', 'Bahawalpur Bench'],
  'High Court of Sindh': ['Principal Seat (Karachi)', 'Sukkur Bench', 'Hyderabad Circuit', 'Larkana Circuit', 'Mirpurkhas Circuit'],
  'Peshawar High Court': ['Principal Seat (Peshawar)', 'Abbottabad Bench', 'Dera Ismail Khan Bench', 'Mingora Bench (Swat)', 'Bannu Bench'],
  'High Court of Balochistan': ['Principal Seat (Quetta)', 'Sibi Bench', 'Turbat Bench'],
  'Islamabad High Court': ['Principal Seat (Islamabad)'],
  'Supreme Court of Pakistan': ['Principal Seat (Islamabad)', 'Lahore Registry', 'Karachi Registry', 'Peshawar Registry', 'Quetta Registry']
};

export const LegalCitationModal: React.FC<LegalCitationModalProps> = ({ isOpen, onClose }) => {
  const { sendMessage } = useChat();

  const [activeTab, setActiveTab] = useState<'form' | 'paste'>('form');
  const [jurisdiction, setJurisdiction] = useState<'pakistan' | 'international'>('pakistan');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Form State
  const [caseTitle, setCaseTitle] = useState('Mst. Asia Bibi v. The State');
  const [court, setCourt] = useState('Supreme Court of Pakistan');
  const [benchSeat, setBenchSeat] = useState('Principal Seat (Islamabad)');
  const [year, setYear] = useState('2019');
  const [reporterType, setReporterType] = useState('PLD');
  const [reporter, setReporter] = useState('PLD 2019 SC 64');
  const [caseNo, setCaseNo] = useState('Criminal Appeal No. 39-L of 2015');
  const [neutralCitation, setNeutralCitation] = useState('2019 SCP 4');
  const [pinpoint, setPinpoint] = useState('para 14');
  const [bench, setBench] = useState('Asif Saeed Khan Khosa, C.J., Mazhar Alam Khan Miankhel, J., and Saqib Nisar, C.J.');
  const [holding, setHolding] = useState('Standard of proof in capital offences is beyond reasonable doubt; uncorroborated testimony cannot sustain conviction.');

  // Paste Text State
  const [pastedJudgment, setPastedJudgment] = useState('');

  if (!isOpen) return null;

  // Formatting logic
  const formattedCaseTitle = caseTitle.trim() || 'Petitioner v. Respondent';
  const formattedYear = year.trim() || '2024';
  const formattedCourt = court.trim() || 'Supreme Court of Pakistan';
  const formattedReporter = reporter.trim() || 'PLD 2024 SC 1';
  const formattedCaseNo = caseNo.trim();
  const formattedPinpoint = pinpoint.trim() ? `, ${pinpoint.trim()}` : '';
  const formattedBench = bench.trim() || 'the Hon\'ble Bench';

  // Load Preset
  const handleLoadPreset = (preset: PrecedentExample) => {
    setCaseTitle(preset.caseTitle);
    setCourt(preset.court);
    setYear(preset.year);
    setReporter(preset.reporter);
    setReporterType(preset.reporterType);
    setCaseNo(preset.caseNo);
    setPinpoint(preset.pinpoint);
    setBench(preset.bench);
    setHolding(preset.holding);
    if (preset.benchSeat) {
      setBenchSeat(preset.benchSeat);
    }
  };

  // Quick Reporter Selection
  const handleReporterSelect = (repCode: string) => {
    setReporterType(repCode);
    const yr = year.trim() || '2024';
    if (repCode === 'PLD') {
      const courtSuffix = court.includes('Lahore') ? 'Lahore' : court.includes('Sindh') ? 'Karachi' : court.includes('Peshawar') ? 'Peshawar' : court.includes('Balochistan') ? 'Quetta' : court.includes('Islamabad') ? 'Islamabad' : court.includes('Federal Shariat') ? 'FSC' : 'SC';
      setReporter(`PLD ${yr} ${courtSuffix} 101`);
    } else if (repCode === 'SCMR') {
      setReporter(`${yr} SCMR 1250`);
      setCourt('Supreme Court of Pakistan');
    } else if (repCode === 'CLC') {
      setReporter(`${yr} CLC 450`);
    } else if (repCode === 'PCrLJ') {
      setReporter(`${yr} PCrLJ 320`);
    } else if (repCode === 'MLD') {
      setReporter(`${yr} MLD 890`);
    } else if (repCode === 'YLR') {
      setReporter(`${yr} YLR 560`);
    } else if (repCode === 'CLD') {
      setReporter(`${yr} CLD 310`);
    } else if (repCode === 'PLC') {
      setReporter(`${yr} PLC (C.S.) 210`);
    } else if (repCode === 'PTD') {
      setReporter(`${yr} PTD 1100`);
    } else if (repCode === 'PLJ') {
      setReporter(`PLJ ${yr} SC 45`);
    }
  };

  // Quick Court Selection
  const handleCourtSelect = (cName: string) => {
    setCourt(cName);
    const benches = HIGH_COURT_BENCHES[cName];
    if (benches && benches.length > 0) {
      setBenchSeat(benches[0]);
    }
    // Adjust reporter string if using PLD
    if (reporterType === 'PLD') {
      const yr = year.trim() || '2024';
      const courtSuffix = cName.includes('Lahore') ? 'Lahore' : cName.includes('Sindh') ? 'Karachi' : cName.includes('Peshawar') ? 'Peshawar' : cName.includes('Balochistan') ? 'Quetta' : cName.includes('Islamabad') ? 'Islamabad' : cName.includes('Federal Shariat') ? 'FSC' : 'SC';
      setReporter(`PLD ${yr} ${courtSuffix} 101`);
    }
  };

  // Court short name for citation
  const currentCourtMeta = PAKISTANI_COURTS.find(c => c.name === formattedCourt) || { short: 'SC', urdu: 'عدالت عظمیٰ پاکستان' };

  // Citations list
  const citations = jurisdiction === 'pakistan' ? [
    {
      style: 'Standard Pakistani Law Reporter Format (PLD / SCMR)',
      badge: 'Primary Reporter Standard',
      text: formattedCourt.includes('Supreme Court')
        ? `${formattedCaseTitle}, ${formattedReporter}${formattedPinpoint} (${formattedCourt}).`
        : `${formattedCaseTitle}, ${formattedReporter}${formattedPinpoint} (${formattedCourt}${benchSeat && !benchSeat.includes('Principal') ? `, ${benchSeat}` : ''}).`
    },
    {
      style: 'Pakistani Court Case & Petition Citation',
      badge: 'Court Pleadings & Briefs',
      text: formattedCaseNo
        ? `${formattedCaseTitle}, ${formattedCaseNo} [${formattedReporter}]${formattedPinpoint} (${formattedCourt}).`
        : `${formattedCaseTitle}, [${formattedReporter}]${formattedPinpoint} (${formattedCourt}).`
    },
    {
      style: 'Bench & Judicial Opinion Reference',
      badge: 'Law Reports & Precedent Digest',
      text: `*${formattedCaseTitle}*, ${formattedReporter} at ${pinpoint.trim() || 'p. X'} per ${formattedBench}${holding.trim() ? ` ("${holding.trim()}")` : ''}.`
    },
    {
      style: 'Urdu Legal Reference (اردو عدالتی حوالہ)',
      badge: 'Urdu Court Filings & Record',
      text: `مقدمہ: ${formattedCaseTitle}، ${formattedReporter}، ${pinpoint.trim() ? pinpoint.trim().replace('para', 'پیرا').replace('p.', 'صفحہ') : 'پیرا 1'} (${currentCourtMeta.urdu})`
    },
    {
      style: 'Commonwealth / OSCOLA Format (Pakistani Authority)',
      badge: 'OSCOLA / International',
      text: `${formattedCaseTitle} [${formattedYear}] ${formattedReporter}${formattedPinpoint}.`
    },
    {
      style: 'Short-Form Court Submission (Id. / Supra)',
      badge: 'In-Text Argument Reference',
      text: `*${formattedCaseTitle.split(' v. ')[0] || formattedCaseTitle}*, ${formattedReporter} at ${pinpoint.trim() || 'para X'}.`
    }
  ] : [
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
    const prompt = jurisdiction === 'pakistan'
      ? `Please perform a detailed Pakistani legal judgment report and case analysis for this citation:\n\n${text}\n\nKey Parameters:\n- Court: ${formattedCourt} (${benchSeat})\n- Case No: ${formattedCaseNo}\n- Law Reporter: ${formattedReporter}\n- Presiding Bench: ${bench}\n- Ratio Decidendi: ${holding}\n\nPlease include:\n1. Ratio Decidendi & Core Legal Principles\n2. Key Statutory Provisions (Constitution of Pakistan 1973, PPC, CrPC, CPC, etc.)\n3. Precedents Followed or Distinguished\n4. Formal Headnote for Pakistani Law Journals (PLD / SCMR standard)`
      : `Please analyze and generate a full legal judgment report and brief for this citation:\n\n${text}\n\nKey Details:\n- Court: ${formattedCourt}\n- Decision Year: ${formattedYear}\n- Bench: ${bench}\n- Holding/Ratio: ${holding}`;
    sendMessage(prompt);
    onClose();
  };

  const handleSendPastedToChat = () => {
    if (!pastedJudgment.trim()) return;
    const prompt = jurisdiction === 'pakistan'
      ? `Please extract and generate standardized Pakistani legal citations (PLD, SCMR, CLC, PCrLJ, YLR), court case details, and a complete law report summary for this Pakistani court judgment snippet:\n\n"""\n${pastedJudgment.trim()}\n"""\n\nPlease structure the output with:\n- Case Title & Parties\n- Court & Bench\n- Law Reporter Citations (PLD / SCMR / High Court style)\n- Case / Petition Number\n- Ratio Decidendi (Holding)\n- Obiter Dicta\n- Statutory Provisions Applied\n- Formal Headnote for Legal Reporting`
      : `Please extract and generate standardized legal citations (Bluebook, OSCOLA, AIR/SCC, Neutral Citation) and a complete law report summary for this judgment snippet:\n\n"""\n${pastedJudgment.trim()}\n"""`;
    sendMessage(prompt);
    onClose();
  };

  const currentAvailableBenches = HIGH_COURT_BENCHES[court] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#111728] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1322]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <span>Pakistani Judgment Citation Generator</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono flex items-center gap-1">
                  <span>🇵🇰 PLD • SCMR • CLC</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Standardized citation generator for Pakistani Supreme Court, High Courts, PLD, SCMR & Law Journals
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

        {/* Jurisdiction & Tab Selector Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 px-5 sm:px-6 py-2.5 gap-2 bg-[#0e1322]">
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('form')}
              className={`pb-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'form'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Structured Form
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'paste'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Paste Judgment Snippet
            </button>
          </div>

          {/* Jurisdiction Toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setJurisdiction('pakistan')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                jurisdiction === 'pakistan'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇵🇰 Pakistan (PLD/SCMR)</span>
            </button>
            <button
              onClick={() => setJurisdiction('international')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                jurisdiction === 'international'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>International / General</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'form' ? (
            <>
              {/* 1-Click Pakistani Precedents Bar (if Pakistan mode) */}
              {jurisdiction === 'pakistan' && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick Load Landmark Pakistani Precedents</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PAKISTANI_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLoadPreset(p)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/50 text-[11px] text-slate-300 hover:text-emerald-300 transition-all text-left flex items-center gap-1.5"
                      >
                        <Landmark className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Pakistani Law Reporter Pill Selector */}
              {jurisdiction === 'pakistan' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Select Law Reporter
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PAKISTANI_REPORTERS.map((r) => {
                      const isSelected = reporterType === r.code;
                      return (
                        <button
                          key={r.code}
                          type="button"
                          onClick={() => handleReporterSelect(r.code)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                          title={`${r.name} — ${r.scope}`}
                        >
                          <span className="font-semibold">{r.code}</span>
                          <span className="text-[10px] opacity-75 hidden sm:inline">({r.name})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Case Title / Parties
                  </label>
                  <input
                    type="text"
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    placeholder="e.g. Mst. Asia Bibi v. The State or Benazir Bhutto v. Federation"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Court Name
                  </label>
                  {jurisdiction === 'pakistan' ? (
                    <select
                      value={court}
                      onChange={(e) => handleCourtSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    >
                      {PAKISTANI_COURTS.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.urdu})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={court}
                      onChange={(e) => setCourt(e.target.value)}
                      placeholder="e.g. US Supreme Court / Supreme Court of India"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  )}
                </div>

                {jurisdiction === 'pakistan' && currentAvailableBenches.length > 0 ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Bench / Circuit Seat
                    </label>
                    <select
                      value={benchSeat}
                      onChange={(e) => setBenchSeat(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    >
                      {currentAvailableBenches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Decision Year
                    </label>
                    <input
                      type="text"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. 2024"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Official Law Reporter (Volume / Page)
                  </label>
                  <input
                    type="text"
                    value={reporter}
                    onChange={(e) => setReporter(e.target.value)}
                    placeholder="e.g. PLD 2019 SC 64, 2023 SCMR 1420, 2023 CLC 745"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {jurisdiction === 'pakistan' ? 'Case / Appeal / Petition No.' : 'Neutral / Media Citation'}
                  </label>
                  {jurisdiction === 'pakistan' ? (
                    <input
                      type="text"
                      value={caseNo}
                      onChange={(e) => setCaseNo(e.target.value)}
                      placeholder="e.g. Criminal Appeal No. 39-L of 2015 / Const. Petition No. 17/2019"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={neutralCitation}
                      onChange={(e) => setNeutralCitation(e.target.value)}
                      placeholder="e.g. 1973 INSC 12 or [2022] UKSC 1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Pinpoint Reference (Page / Paragraph)
                  </label>
                  <input
                    type="text"
                    value={pinpoint}
                    onChange={(e) => setPinpoint(e.target.value)}
                    placeholder="e.g. para 14, p. 78, or paras 12-15"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Presiding Bench / Author Judge
                  </label>
                  <input
                    type="text"
                    value={bench}
                    onChange={(e) => setBench(e.target.value)}
                    placeholder="e.g. Asif Saeed Khosa, C.J., Bandial, J., etc."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
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
                    placeholder="e.g. Holding that standard of proof in capital cases must be established beyond doubt"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Citations Preview List */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generated Citation Formats</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {jurisdiction === 'pakistan' ? '🇵🇰 Standard Pakistani Formats' : 'International Formats'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {citations.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-emerald-300">
                            {item.style}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-emerald-950 border border-emerald-800/60 text-emerald-400 font-mono">
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
                          title="Copy Citation to Clipboard"
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
                          title="Ask Nexora AI to analyze Pakistani legal judgment"
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-xs flex items-center gap-1 shadow-sm"
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
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>Paste Judgment Excerpt, Headnote, or Order Copy</span>
                  <span className="text-[10px] text-emerald-400">Supreme Court & High Courts</span>
                </label>
                <textarea
                  value={pastedJudgment}
                  onChange={(e) => setPastedJudgment(e.target.value)}
                  rows={8}
                  placeholder="Paste any Pakistani court judgment excerpt, order sheet, or law reporter headnote here (e.g. from PLD, SCMR, CLC, PCrLJ, YLR). Nexora AI will parse the parties, court bench, reporter volume, legal ratio decidendi, statutory provisions, and construct citations..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 leading-relaxed font-mono"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-300">
                    Pakistani Law Intelligence & Headnote Generator
                  </p>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                    Nexora AI parses Pakistani judgments across PLD, SCMR, CLC, PCrLJ, MLD, YLR, CLD, PLC, and PTD, identifying constitutional provisions (Constitution 1973), Pakistan Penal Code (PPC), CrPC, CPC, and precedent relationships.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSendPastedToChat}
                disabled={!pastedJudgment.trim()}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Sparkles className="w-4 h-4" />
                Generate Pakistani Legal Citations & Case Report with AI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
