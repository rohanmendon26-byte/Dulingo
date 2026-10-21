import { useState, useEffect } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Volume2,
  Square,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  Download,
  Check,
  Sparkles,
  Building,
  Camera,
  CreditCard,
  Zap,
  Info,
  Award,
  ChevronRight,
  Smile,
  Shield,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/index.js';
import { useSpeech } from '../speech.js';
import { Octo, Confetti } from '../components.jsx';

export default function SeniorHub() {
  const { user, lang, large, setLarge } = useAuth();
  const speech = useSpeech(lang);

  // Active practice module: 'home' | 'jeevan' | 'passbook' | 'scam' | 'utility' | 'ayushman'
  const [activeModule, setActiveModule] = useState('home');
  const [showHelpline, setShowHelpline] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Module 1: Jeevan Pramaan State
  const [jpStep, setJpStep] = useState(1);
  const [jpAadhaar, setJpAadhaar] = useState('');
  const [jpMobile, setJpMobile] = useState('');
  const [jpOtpSent, setJpOtpSent] = useState(false);
  const [jpOtp, setJpOtp] = useState('');
  const [jpBank, setJpBank] = useState('State Bank of India');
  const [jpPpo, setJpPpo] = useState('');
  const [jpFaceScanning, setJpFaceScanning] = useState(false);
  const [jpFaceSuccess, setJpFaceSuccess] = useState(false);

  // Module 2: Pension Slip Active Tooltip
  const [slipBeacon, setSlipBeacon] = useState(null);

  // Module 3: Scam Shield State
  const [scamQuizIndex, setScamQuizIndex] = useState(0);
  const [scamSelectedOption, setScamSelectedOption] = useState(null);
  const [scamCompleted, setScamCompleted] = useState(false);

  // Module 4: Utility Bill State
  const [billStep, setBillStep] = useState(1);
  const [consumerNo, setConsumerNo] = useState('');
  const [billPaid, setBillPaid] = useState(false);

  // Module 5: Ayushman Bharat State
  const [ayushmanStep, setAyushmanStep] = useState(1);
  const [rationCardNo, setRationCardNo] = useState('');

  // Auto-stop speech when switching modules
  useEffect(() => {
    speech.stop();
  }, [activeModule]);

  // Voice Narrator Helper
  const speakText = (text) => {
    if (speech.speaking) {
      speech.stop();
    } else {
      speech.speak(text);
    }
  };

  // 1-Click sample fill for seniors with tremors/typing difficulty
  const fillSampleJp = () => {
    setJpAadhaar('9876 5432 1098');
    setJpMobile('9876543210');
    setJpPpo('2018/SBI/PPO/58291');
    setJpOtpSent(true);
    setJpOtp('492018');
  };

  const handleJpFaceScan = () => {
    setJpFaceScanning(true);
    speakText('Hold steady and look at the camera. Blink your eyes slowly. Verification in progress.');
    setTimeout(() => {
      setJpFaceScanning(false);
      setJpFaceSuccess(true);
      speakText('Facial authentication successful! Your identity is matched with UIDAI records.');
    }, 2800);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {celebrate && <Confetti />}

      {/* Senior Companion Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-brand-200 bg-linear-to-br from-brand-50 via-white to-amber-50/50 p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-2 ring-amber-400/40">
              <HeartHandshake size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Namaste, {user?.name || 'Respected Senior'}! 🙏
                </h1>
              </div>
              <p className="mt-1 text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300">
                Safe Senior Civic Flight Simulator — Learn & practice real government and banking portals with zero risk.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() =>
                speakText(
                  'Namaste and welcome! This is your safe practice portal. You can practice Digital Life Certificates, check pension slips, and learn to defeat fraud callers without any fear or hurry.'
                )
              }
              className={`btn ${
                speech.speaking ? 'bg-amber-500 hover:bg-amber-600 !shadow-[0_4px_0_#b45309]' : 'btn-primary'
              } !py-2 !px-3.5 text-xs sm:text-sm font-black inline-flex items-center gap-1.5`}
              title="Click to hear spoken guide"
            >
              {speech.speaking ? <Square size={16} /> : <Volume2 size={16} />}
              <span>{speech.speaking ? 'Stop Voice' : 'Read Page'}</span>
            </button>

            <button
              onClick={() => setLarge(!large)}
              className="btn btn-ghost !py-2 !px-3 text-xs sm:text-sm font-black inline-flex items-center gap-1"
              title="Toggle bigger letters for easy reading"
            >
              <span className="font-extrabold text-base">Aa</span>
              <span>{large ? 'Normal' : 'Bigger Text'}</span>
            </button>

            <button
              onClick={() => setShowHelpline(true)}
              className="btn btn-ghost !py-2 !px-3 text-xs sm:text-sm font-black text-rose-700 border-rose-200 hover:bg-rose-50 inline-flex items-center gap-1.5 dark:text-rose-300 dark:border-rose-800"
            >
              <PhoneCall size={15} />
              <span>Helplines</span>
            </button>
          </div>
        </div>

        {/* Safety Guarantee Pill */}
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50/90 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
          <span>
            <strong>100% Zero-Risk Practice:</strong> No real money will ever be spent, and no government records will be changed. Practice comfortably as many times as you want!
          </span>
        </div>
      </section>

      {/* Module Navigation Tabs */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Practice Modules">
        {[
          { id: 'home', label: 'Overview Hub', icon: HeartHandshake },
          { id: 'jeevan', label: 'Life Certificate (Jeevan Pramaan)', icon: FileText },
          { id: 'passbook', label: 'Pension Slip Reader', icon: Building },
          { id: 'scam', label: 'Scam Radar & OTP Shield', icon: ShieldCheck },
          { id: 'utility', label: 'Utility Bill Payment', icon: Zap },
          { id: 'ayushman', label: 'Ayushman Health Card', icon: Award },
        ].map((m) => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-black transition cursor-pointer ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 dark:bg-brand-500'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750'
              }`}
            >
              <Icon size={16} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </nav>

      {/* =========================================================================
          VIEW 1: OVERVIEW HUB (DASHBOARD CARDS)
      ========================================================================= */}
      {activeModule === 'home' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              What would you like to practice today?
            </h2>
            <span className="text-xs font-bold text-slate-500">6 Guided Modules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Jeevan Pramaan */}
            <div
              onClick={() => setActiveModule('jeevan')}
              className="card p-5 cursor-pointer hover:border-brand-400 hover:shadow-md transition-all group relative border-2 border-slate-200/90 dark:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 group-hover:scale-105 transition-transform">
                  <FileText size={24} />
                </div>
                <div className="space-y-1">
                  <span className="inline-block rounded-lg bg-brand-50 px-2 py-0.5 text-[11px] font-extrabold text-brand-700 uppercase tracking-wider dark:bg-brand-950 dark:text-brand-300">
                    Annual November Requirement
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-brand-700">
                    Digital Life Certificate (Jeevan Pramaan)
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                    Practice generating your annual life certificate without standing in long bank queues, using simulated face verification.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-750 text-xs font-black text-brand-700 dark:text-brand-400">
                <span>Start Practice</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Pension Slip Reader */}
            <div
              onClick={() => setActiveModule('passbook')}
              className="card p-5 cursor-pointer hover:border-brand-400 hover:shadow-md transition-all group relative border-2 border-slate-200/90 dark:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 group-hover:scale-105 transition-transform">
                  <Building size={24} />
                </div>
                <div className="space-y-1">
                  <span className="inline-block rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 uppercase tracking-wider dark:bg-amber-950 dark:text-amber-300">
                    Monthly Financial Check
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-700">
                    Pension Slip & Passbook Reader
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                    Easily understand Dearness Relief (DR), basic pension calculations, and deduction details with interactive explanations.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-750 text-xs font-black text-amber-700 dark:text-amber-400">
                <span>Read Pension Slip</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Scam Shield */}
            <div
              onClick={() => setActiveModule('scam')}
              className="card p-5 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group relative border-2 border-slate-200/90 dark:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <span className="inline-block rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider dark:bg-emerald-950 dark:text-emerald-300">
                    Cyber Fraud Defense
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-700">
                    Scam Radar & OTP Shield
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                    Learn to identify fake bank calls, electricity power-cut threats, and WhatsApp fraud links with zero fear.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-750 text-xs font-black text-emerald-700 dark:text-emerald-400">
                <span>Test Scam Shield</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Utility Bill Payment */}
            <div
              onClick={() => setActiveModule('utility')}
              className="card p-5 cursor-pointer hover:border-cyan-400 hover:shadow-md transition-all group relative border-2 border-slate-200/90 dark:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 group-hover:scale-105 transition-transform">
                  <Zap size={24} />
                </div>
                <div className="space-y-1">
                  <span className="inline-block rounded-lg bg-cyan-50 px-2 py-0.5 text-[11px] font-extrabold text-cyan-800 uppercase tracking-wider dark:bg-cyan-950 dark:text-cyan-300">
                    Monthly Household Tasks
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-cyan-700">
                    Electricity & Water Bill Payment
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                    Locate your Consumer Account number, verify bill amounts, and practice safe UPI payment without debiting real cash.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-750 text-xs font-black text-cyan-700 dark:text-cyan-400">
                <span>Practice Bill Pay</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 5: Ayushman Bharat */}
            <div
              onClick={() => setActiveModule('ayushman')}
              className="card p-5 cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group relative border-2 border-slate-200/90 dark:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 group-hover:scale-105 transition-transform">
                  <Award size={24} />
                </div>
                <div className="space-y-1">
                  <span className="inline-block rounded-lg bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-800 uppercase tracking-wider dark:bg-rose-950 dark:text-rose-300">
                    Healthcare Security
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-rose-700">
                    Ayushman Bharat (PM-JAY) Card
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                    Practice checking eligibility and generating the ₹ 5 Lakh cashless hospital card for senior citizens and families.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-750 text-xs font-black text-rose-700 dark:text-rose-400">
                <span>Check Health Card</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 6: Elderline Directory */}
            <div
              onClick={() => setShowHelpline(true)}
              className="card p-5 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group relative border-2 border-slate-200/90 dark:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 group-hover:scale-105 transition-transform">
                  <PhoneCall size={24} />
                </div>
                <div className="space-y-1">
                  <span className="inline-block rounded-lg bg-purple-50 px-2 py-0.5 text-[11px] font-extrabold text-purple-800 uppercase tracking-wider dark:bg-purple-950 dark:text-purple-300">
                    Direct Support
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-purple-700">
                    Senior Helplines & Emergency Directory
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                    Toll-free numbers for Elderline (14567), Cyber Fraud freeze (1930), and Central Pensioners Grievance cell.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-750 text-xs font-black text-purple-700 dark:text-purple-400">
                <span>View All Helplines</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: JEEVAN PRAMAAN (DIGITAL LIFE CERTIFICATE) SIMULATOR
      ========================================================================= */}
      {activeModule === 'jeevan' && (
        <div className="card p-6 sm:p-7 space-y-6 border-2 border-brand-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Jeevan Pramaan (Digital Life Certificate) Simulator
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-500">
                  Step {jpStep} of 4: {jpStep === 1 ? 'Aadhaar & OTP Verification' : jpStep === 2 ? 'Pension Agency Details' : jpStep === 3 ? 'Simulated Face Scan' : 'Certificate Generated'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  speakText(
                    jpStep === 1
                      ? 'Step one: Enter your twelve digit Aadhaar number and mobile number. You can click Fill Sample Details to test quickly without typing.'
                      : jpStep === 2
                      ? 'Step two: Select your pension disbursing bank and enter your Pension Payment Order number.'
                      : jpStep === 3
                      ? 'Step three: Face biometric verification. Hold still and look straight into the camera frame.'
                      : 'Congratulations! Your digital life certificate has been generated and accepted by your pension bank.'
                  )
                }
                className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1 font-black"
              >
                <Volume2 size={15} />
                <span>Audio Guide</span>
              </button>
              <button
                onClick={() => {
                  setJpStep(1);
                  setJpFaceSuccess(false);
                  setJpOtpSent(false);
                  setJpOtp('');
                }}
                className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1 text-slate-600"
                title="Restart simulation"
              >
                <RotateCcw size={14} />
                <span>Restart</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex-1 flex items-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${
                    jpStep === stepNum
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900'
                      : jpStep > stepNum
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
                  }`}
                >
                  {jpStep > stepNum ? <Check size={16} /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`h-1.5 flex-1 mx-1.5 rounded-full ${
                      jpStep > stepNum ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1: Aadhaar & Mobile OTP */}
          {jpStep === 1 && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs sm:text-sm font-bold text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Why is Aadhaar required?</strong> The government uses Aadhaar to verify your identity directly with UIDAI so you do not need to physically visit the bank.
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={fillSampleJp}
                  className="btn btn-ghost !py-1 !px-2.5 text-xs text-brand-700 border-brand-200 bg-brand-50 hover:bg-brand-100 font-extrabold"
                >
                  ✨ 1-Click: Fill Sample Details
                </button>
              </div>

              <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                Aadhaar Number (12 Digits)
                <input
                  type="text"
                  placeholder="e.g. 9876 5432 1098"
                  value={jpAadhaar}
                  onChange={(e) => setJpAadhaar(e.target.value)}
                  className="input mt-1.5 text-base tracking-wider font-mono"
                  maxLength={14}
                />
              </label>

              <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                Pensioner Mobile Number
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={jpMobile}
                  onChange={(e) => setJpMobile(e.target.value)}
                  className="input mt-1.5 text-base font-mono"
                  maxLength={10}
                />
              </label>

              {!jpOtpSent ? (
                <button
                  type="button"
                  onClick={() => {
                    setJpOtpSent(true);
                    setJpOtp('492018');
                    speakText('Simulated OTP sent to your registered mobile number: 492018.');
                  }}
                  className="btn btn-primary w-full !py-3 text-base font-black mt-2"
                >
                  <span>Send Practice OTP</span>
                </button>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm font-bold text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                    📩 <strong>Simulated SMS Received:</strong> "Your UIDAI OTP for Jeevan Pramaan is <strong>492018</strong>. Valid for 10 mins. Never share OTP with callers."
                  </div>

                  <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                    Enter OTP
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={jpOtp}
                      onChange={(e) => setJpOtp(e.target.value)}
                      className="input mt-1.5 text-lg text-center tracking-widest font-mono font-black"
                      maxLength={6}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setJpStep(2);
                      speakText('OTP verified successfully! Now proceed to select your pension disbursing agency and PPO number.');
                    }}
                    className="btn btn-good w-full !py-3 text-base font-black"
                    disabled={jpOtp.length < 4}
                  >
                    <span>Verify OTP & Next Step</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Pension Disbursing Agency Details */}
          {jpStep === 2 && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="rounded-2xl bg-brand-50 border border-brand-200 p-3.5 text-xs sm:text-sm font-bold text-brand-900 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-200 flex items-start gap-2.5">
                <HelpCircle size={18} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <strong>What is PPO Number?</strong> PPO stands for <em>Pension Payment Order</em>. It is printed on your original pension sanction letter and on your bank pension passbook.
                </div>
              </div>

              <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                Pension Disbursing Agency (Bank / Treasury)
                <select
                  value={jpBank}
                  onChange={(e) => setJpBank(e.target.value)}
                  className="input mt-1.5 text-sm sm:text-base font-bold"
                >
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                  <option value="Canara Bank">Canara Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Post Office Department">Department of Posts (Post Office)</option>
                  <option value="SPARSH (Defence Pension)">SPARSH (Defence Pension Disbursal)</option>
                </select>
              </label>

              <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                PPO Number
                <input
                  type="text"
                  placeholder="e.g. 2018/SBI/PPO/58291"
                  value={jpPpo || '2018/SBI/PPO/58291'}
                  onChange={(e) => setJpPpo(e.target.value)}
                  className="input mt-1.5 text-base font-mono font-bold"
                />
              </label>

              <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                Pension Account Number
                <input
                  type="text"
                  defaultValue="30182948201"
                  className="input mt-1.5 text-base font-mono"
                  readOnly
                />
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setJpStep(1)}
                  className="btn btn-ghost flex-1 !py-3 text-sm font-black"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJpStep(3);
                    speakText('Now we will practice the face biometric scan. Look at the camera circle and blink slowly.');
                  }}
                  className="btn btn-primary flex-2 !py-3 text-base font-black"
                >
                  <span>Proceed to Face Scan</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Face Biometric Authentication Simulation */}
          {jpStep === 3 && (
            <div className="space-y-5 max-w-md mx-auto text-center">
              <div className="relative mx-auto h-52 w-52 rounded-full border-4 border-dashed border-brand-400 bg-slate-950 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                {jpFaceScanning ? (
                  <div className="space-y-2 text-white animate-pulse">
                    <Camera size={44} className="mx-auto text-amber-400" />
                    <p className="text-xs font-black">Blinking eyes... hold still</p>
                    <div className="h-1 w-32 bg-amber-400 rounded-full mx-auto animate-bounce" />
                  </div>
                ) : jpFaceSuccess ? (
                  <div className="space-y-2 text-emerald-400">
                    <CheckCircle2 size={52} className="mx-auto" />
                    <p className="text-sm font-black">Biometric Verified! ✅</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-400">
                    <Smile size={52} className="mx-auto text-slate-500" />
                    <p className="text-xs font-bold px-4">Position your face inside the circle</p>
                  </div>
                )}
              </div>

              <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                💡 <strong>Senior Tip:</strong> Ensure you are sitting in a brightly lit room with light falling on your face, not from behind you. Remove sunglasses or cap.
              </div>

              {!jpFaceSuccess ? (
                <button
                  type="button"
                  onClick={handleJpFaceScan}
                  disabled={jpFaceScanning}
                  className="btn btn-primary w-full !py-3.5 text-base font-black inline-flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  <span>{jpFaceScanning ? 'Scanning Biometrics…' : 'Start Practice Face Scan'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setJpStep(4);
                    setCelebrate(true);
                    speakText('Congratulations! Your life certificate has been successfully submitted and confirmed.');
                    setTimeout(() => setCelebrate(false), 4000);
                  }}
                  className="btn btn-good w-full !py-3.5 text-base font-black inline-flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  <span>View Submitted Life Certificate</span>
                </button>
              )}
            </div>
          )}

          {/* STEP 4: Success Certificate Generated */}
          {jpStep === 4 && (
            <div className="space-y-5 max-w-lg mx-auto">
              <div className="rounded-3xl border-2 border-emerald-400 bg-emerald-50/60 p-5 sm:p-6 text-center space-y-3 dark:bg-emerald-950/30 dark:border-emerald-700">
                <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                  <Check size={32} className="stroke-[3]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
                  Digital Life Certificate Submitted! 🎉
                </h3>
                <p className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Your Digital Life Certificate (DLC) has been accepted by {jpBank}. Your pension will continue uninterrupted for the next 12 months.
                </p>

                {/* Simulated Certificate Slip */}
                <div className="rounded-2xl bg-white border border-slate-200 p-4 text-left font-mono text-xs space-y-1.5 shadow-xs dark:bg-slate-850 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-700">
                    <span className="font-bold text-slate-500">Pramaan ID:</span>
                    <span className="font-black text-brand-700 dark:text-brand-400">JP-2026-94821038</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">Pensioner Name:</span>
                    <span className="font-bold">{user?.name || 'Dadaji Sharma'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">PPO Number:</span>
                    <span className="font-bold">{jpPpo || '2018/SBI/PPO/58291'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">Disbursing Agency:</span>
                    <span className="font-bold">{jpBank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">Valid Until:</span>
                    <span className="font-black text-emerald-600">30-November-2027</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => alert('Simulated Life Certificate saved! In the real portal, you get an SMS with this Pramaan ID for your records.')}
                  className="btn btn-primary flex-1 !py-3 text-sm font-black inline-flex items-center justify-center gap-1.5"
                >
                  <Download size={16} />
                  <span>Download Practice Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJpStep(1);
                    setJpFaceSuccess(false);
                    setJpOtpSent(false);
                  }}
                  className="btn btn-ghost flex-1 !py-3 text-sm font-black"
                >
                  Practice Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 3: PENSION PASSBOOK & SLIP READER
      ========================================================================= */}
      {activeModule === 'passbook' && (
        <div className="card p-6 sm:p-7 space-y-6 border-2 border-amber-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                <Building size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Pension Slip & Passbook Reader
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-500">
                  Click on any highlighted section below to learn what it means in plain, simple words.
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                speakText(
                  'This is your monthly pension slip. Click on Basic Pension, Dearness Relief, or Medical Allowance to hear how your final pension is calculated.'
                )
              }
              className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1 font-black shrink-0"
            >
              <Volume2 size={15} />
              <span>Audio Guide</span>
            </button>
          </div>

          {/* Interactive Pension Slip Preview */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:bg-slate-850 dark:border-slate-750 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400">Pension Disbursal Slip</span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  CENTRAL PENSION ACCOUNTING OFFICE / SBI
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">Month: October 2026</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Pensioner</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{user?.name || 'Dadaji Sharma'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">PPO Number</span>
                <span className="font-mono">1987/CIV/58201</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Account No</span>
                <span className="font-mono">••••••••8201</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Credit Date</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">31st of every month</span>
              </div>
            </div>

            {/* Interactive Breakdown Rows */}
            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden dark:border-slate-700 dark:divide-slate-750">
              {/* Row 1: Basic Pension */}
              <button
                type="button"
                onClick={() => {
                  setSlipBeacon('basic');
                  speakText('Basic Pension is the base fixed amount calculated based on your last drawn salary and length of service.');
                }}
                className={`w-full p-3.5 flex items-center justify-between text-left transition cursor-pointer ${
                  slipBeacon === 'basic' ? 'bg-brand-50 dark:bg-brand-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-black dark:bg-brand-900">
                    ℹ️
                  </span>
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white block">Basic Pension</span>
                    <span className="text-[11px] text-slate-500">Click to learn definition</span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">₹ 28,500.00</span>
              </button>

              {/* Row 2: Dearness Relief */}
              <button
                type="button"
                onClick={() => {
                  setSlipBeacon('dr');
                  speakText('Dearness Relief is inflation compensation revised every January and July. Currently at 53 percent of your basic pension.');
                }}
                className={`w-full p-3.5 flex items-center justify-between text-left transition cursor-pointer ${
                  slipBeacon === 'dr' ? 'bg-amber-50 dark:bg-amber-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-black dark:bg-amber-900">
                    📈
                  </span>
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white block">Dearness Relief (DR @ 53%)</span>
                    <span className="text-[11px] text-slate-500">Click to learn how DR increases pension</span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">+ ₹ 15,105.00</span>
              </button>

              {/* Row 3: Fixed Medical Allowance */}
              <button
                type="button"
                onClick={() => {
                  setSlipBeacon('fma');
                  speakText('Fixed Medical Allowance is one thousand rupees per month given to pensioners residing in areas without CGHS wellness centres.');
                }}
                className={`w-full p-3.5 flex items-center justify-between text-left transition cursor-pointer ${
                  slipBeacon === 'fma' ? 'bg-cyan-50 dark:bg-cyan-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 text-xs font-black dark:bg-cyan-900">
                    🏥
                  </span>
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white block">Fixed Medical Allowance (FMA)</span>
                    <span className="text-[11px] text-slate-500">Click to understand FMA</span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">+ ₹ 1,000.00</span>
              </button>

              {/* Row 4: Commutation Deduction */}
              <button
                type="button"
                onClick={() => {
                  setSlipBeacon('commutation');
                  speakText('Commutation deduction is the monthly recovery of the lump sum advance you received at retirement. After 15 years, it is automatically restored to your basic pension.');
                }}
                className={`w-full p-3.5 flex items-center justify-between text-left transition cursor-pointer ${
                  slipBeacon === 'commutation' ? 'bg-rose-50 dark:bg-rose-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs font-black dark:bg-rose-900">
                    📉
                  </span>
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white block">Commutation Recovery</span>
                    <span className="text-[11px] text-slate-500">Restored after 15 years</span>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400">- ₹ 4,200.00</span>
              </button>

              {/* Total Net Pay */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between rounded-b-2xl">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-300 font-bold block">Net Pension Credited to Bank</span>
                  <span className="text-[11px] text-emerald-300">Direct Benefit Transfer (DBT)</span>
                </div>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">₹ 40,405.00</span>
              </div>
            </div>
          </div>

          {/* Explanation Spotlight Box */}
          {slipBeacon && (
            <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 text-amber-950 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200 space-y-1">
              <h4 className="text-sm font-black flex items-center gap-1.5">
                <HelpCircle size={16} className="text-amber-700" />
                <span>
                  {slipBeacon === 'basic' && 'About Basic Pension:'}
                  {slipBeacon === 'dr' && 'About Dearness Relief (DR):'}
                  {slipBeacon === 'fma' && 'About Fixed Medical Allowance (FMA):'}
                  {slipBeacon === 'commutation' && 'About Commutation Recovery (15 Years):'}
                </span>
              </h4>
              <p className="text-xs sm:text-sm font-bold">
                {slipBeacon === 'basic' &&
                  'Basic pension is 50% of your average emoluments drawn during the last 10 months of qualifying service. It forms the benchmark on which all future DA/DR hikes are calculated.'}
                {slipBeacon === 'dr' &&
                  'Dearness Relief increases your pension twice a year (January and July) in tandem with consumer price inflation. When the government announces 4% DR hike, your pension increases automatically.'}
                {slipBeacon === 'fma' &&
                  'Pensioners living outside areas covered by Central Government Health Scheme (CGHS) wellness centres receive ₹ 1,000 fixed allowance per month for day-to-day outpatient medical expenses.'}
                {slipBeacon === 'commutation' &&
                  'If you took up to 40% of your pension as a tax-free lump sum on the date of retirement, the government recovers that portion for exactly 15 years. On completing 15 years, your pension is restored to 100% full amount.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 4: SCAM RADAR & OTP SHIELD (NEVER GET CHEATED)
      ========================================================================= */}
      {activeModule === 'scam' && (
        <div className="card p-6 sm:p-7 space-y-6 border-2 border-emerald-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Senior Scam Radar & OTP Shield
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-500">
                  Scenario {scamQuizIndex + 1} of 3: Learn to spot & defeat real phone and SMS scam callers.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setScamQuizIndex(0);
                setScamSelectedOption(null);
                setScamCompleted(false);
              }}
              className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1 font-black shrink-0"
            >
              <RotateCcw size={14} />
              <span>Reset Scenarios</span>
            </button>
          </div>

          {/* Quiz Scenarios */}
          {(() => {
            const scenarios = [
              {
                title: 'Scenario 1: Urgent Bank KYC Call',
                incoming: '📞 Incoming Call from unknown number claiming to be "Manager from SBI Head Office"',
                dialogue:
                  '"Sir, your Bank KYC has expired today. Your pension account will be frozen in 1 hour! A 6-digit OTP has just been sent to your mobile. Read it out to me immediately so I can renew it."',
                audio:
                  'Scenario one. A caller claiming to be your bank manager says your account will be frozen in one hour unless you read out the six-digit OTP sent to your phone. What should you do?',
                options: [
                  {
                    text: 'Give the 6-digit OTP quickly so my pension account does not get blocked.',
                    correct: false,
                    explain:
                      '❌ DANGER! NEVER share your OTP! No real bank manager will ever ask for your OTP. Anyone asking for an OTP on a call is 100% a fraudster trying to steal your money.',
                  },
                  {
                    text: 'Hang up the call immediately. Banks never ask for OTP over phone.',
                    correct: true,
                    explain:
                      '🎉 PERFECT! You saved your savings! Real banks repeatedly state: Bank officials NEVER ask for OTP, PIN, or CVV. If in doubt, visit your home branch in person.',
                  },
                ],
              },
              {
                title: 'Scenario 2: Electricity Disconnection Threat SMS',
                incoming: '📩 SMS received on your phone from an unknown 10-digit number:',
                dialogue:
                  '"Dear Consumer, your electricity power will be disconnected at 9:30 PM tonight because your last month bill was not updated. Immediately contact Power Officer Sharma at 98210-XXXXX to stop disconnection."',
                audio:
                  'Scenario two. You receive an SMS saying your power will be disconnected tonight unless you call a ten-digit personal mobile number. What should you do?',
                options: [
                  {
                    text: 'Call the mobile number and follow the officer instructions to install an app.',
                    correct: false,
                    explain:
                      '❌ DANGER! Fraudsters use fear to make you call their number. They will ask you to download apps like AnyDesk or TeamViewer which allow them to see your screen and siphon your bank balance.',
                  },
                  {
                    text: 'Ignore the message and check my official electricity bill at the local counter or website.',
                    correct: true,
                    explain:
                      '🎉 EXCELLENT! State electricity boards (BESCOM, BSES, TNEB, etc.) send official notices with your 10-digit Consumer ID, never random WhatsApp or personal mobile numbers.',
                  },
                ],
              },
              {
                title: 'Scenario 3: "Free Pension Bonus" WhatsApp Link',
                incoming: '💬 WhatsApp Message from an unknown contact with Indian Flag icon:',
                dialogue:
                  '"Government has released ₹ 25,000 Diwali Bonus for all retired senior citizens! Click here to claim your bonus before today midnight: http://pension-free-bonus.xyz/claim"',
                audio:
                  'Scenario three. A WhatsApp message promises twenty-five thousand rupees pension bonus if you click a link ending in dot xyz. What should you do?',
                options: [
                  {
                    text: 'Click the link and type my bank account and ATM PIN to receive the money.',
                    correct: false,
                    explain:
                      '❌ DANGER! Government schemes are NEVER distributed via random .xyz links. To receive government money, you NEVER need to share your ATM PIN or UPI PIN!',
                  },
                  {
                    text: 'Delete and block the message. Official government websites always end with .gov.in or .nic.in',
                    correct: true,
                    explain:
                      '🎉 GOLDEN RULE MASTERED! Authentic Indian government websites ALWAYS end with .gov.in or .nic.in. Any link ending in .xyz, .top, or .tk is a malicious phishing scam.',
                  },
                ],
              },
            ];

            const current = scenarios[scamQuizIndex];

            return (
              <div className="space-y-4 max-w-xl mx-auto">
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-4 space-y-2 dark:bg-amber-950/40 dark:border-amber-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                      {current.title}
                    </span>
                    <button
                      onClick={() => speakText(current.audio)}
                      className="btn btn-ghost !py-1 !px-2.5 text-xs inline-flex items-center gap-1 font-bold"
                    >
                      <Volume2 size={13} />
                      <span>Listen</span>
                    </button>
                  </div>
                  <p className="text-xs font-extrabold text-slate-500">{current.incoming}</p>
                  <blockquote className="rounded-xl bg-white p-3 text-sm font-black italic text-slate-900 border border-amber-200 dark:bg-slate-900 dark:text-white dark:border-slate-700">
                    {current.dialogue}
                  </blockquote>
                </div>

                <div className="space-y-2.5 pt-2">
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    What should you do in this situation?
                  </p>
                  {current.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setScamSelectedOption(opt);
                        speakText(opt.explain);
                      }}
                      className={`w-full p-4 rounded-2xl border-2 text-left text-xs sm:text-sm font-black transition cursor-pointer ${
                        scamSelectedOption === opt
                          ? opt.correct
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100'
                            : 'bg-rose-50 border-rose-500 text-rose-950 dark:bg-rose-950/50 dark:text-rose-100'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-brand-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-black">
                          {idx === 0 ? 'A' : 'B'}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Explanation feedback */}
                {scamSelectedOption && (
                  <div
                    className={`rounded-2xl p-4 border text-xs sm:text-sm font-bold ${
                      scamSelectedOption.correct
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-200'
                        : 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/50 dark:border-rose-700 dark:text-rose-200'
                    }`}
                  >
                    {scamSelectedOption.explain}
                  </div>
                )}

                {/* Next scenario button */}
                {scamSelectedOption && (
                  <div className="flex justify-end pt-2">
                    {scamQuizIndex < scenarios.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setScamQuizIndex((prev) => prev + 1);
                          setScamSelectedOption(null);
                        }}
                        className="btn btn-primary !py-2.5 !px-5 text-sm font-black inline-flex items-center gap-2"
                      >
                        <span>Next Scam Scenario</span>
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <div className="rounded-2xl bg-brand-50 border border-brand-300 p-4 text-center w-full dark:bg-brand-950/50">
                        <h4 className="text-base font-black text-brand-900 dark:text-brand-200">
                          🛡️ You are an Official Senior Shield Champion!
                        </h4>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
                          You know how to defend yourself from callers asking for OTPs, fake electricity disconnect threats, and phishing links.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          VIEW 5: UTILITY BILL PAYMENT (ELECTRICITY / WATER)
      ========================================================================= */}
      {activeModule === 'utility' && (
        <div className="card p-6 sm:p-7 space-y-6 border-2 border-cyan-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Electricity & Water Bill Payment Practice
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-500">
                  Step {billStep} of 2: Learn to locate your Consumer Account ID and review safe payment receipts.
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                speakText(
                  'Electricity bill payment practice. Find your ten-digit consumer ID printed on your bill, click Fetch Bill, and simulate payment without spending any real money.'
                )
              }
              className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1 font-black shrink-0"
            >
              <Volume2 size={15} />
              <span>Audio Guide</span>
            </button>
          </div>

          {!billPaid ? (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="rounded-2xl bg-cyan-50 border border-cyan-200 p-3.5 text-xs sm:text-sm font-bold text-cyan-950 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-200 flex items-start gap-2.5">
                <HelpCircle size={18} className="text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Where is Consumer Account ID?</strong> Look at the top right of your paper electricity bill. It is usually labeled "Account ID", "CA Number", or "Consumer Number".
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setConsumerNo('1029384756')}
                  className="btn btn-ghost !py-1 !px-2.5 text-xs text-cyan-700 border-cyan-200 bg-cyan-50 font-extrabold"
                >
                  ✨ 1-Click: Fill Sample ID
                </button>
              </div>

              <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                Select Electricity Board
                <select className="input mt-1.5 text-sm sm:text-base font-bold">
                  <option>BESCOM (Bangalore Electricity Supply)</option>
                  <option>BSES Rajdhani / Yamuna (Delhi)</option>
                  <option>Mahavitaran (Maharashtra MSEDCL)</option>
                  <option>TANGEDCO (Tamil Nadu)</option>
                  <option>UPPCL (Uttar Pradesh Power)</option>
                  <option>WBSEDCL (West Bengal State Electricity)</option>
                </select>
              </label>

              <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
                Consumer Account Number (CA Number)
                <input
                  type="text"
                  placeholder="e.g. 1029384756"
                  value={consumerNo}
                  onChange={(e) => setConsumerNo(e.target.value)}
                  className="input mt-1.5 text-base font-mono font-bold"
                />
              </label>

              {consumerNo ? (
                <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 space-y-2 dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Consumer Name:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{user?.name || 'Dadaji Sharma'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Due Date:</span>
                    <span className="text-amber-600 font-extrabold">28th October 2026</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t pt-2 border-slate-200 dark:border-slate-700">
                    <span>Bill Amount Payable:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-lg">₹ 1,480.00</span>
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs font-bold text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
                    ⚠️ <strong>Golden Security Rule:</strong> UPI PIN is ONLY entered to SEND money. You never need to enter your UPI PIN to receive cashback or refunds.
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBillPaid(true);
                      setCelebrate(true);
                      speakText('Payment simulated successfully! Transaction reference generated.');
                      setTimeout(() => setCelebrate(false), 3500);
                    }}
                    className="btn btn-good w-full !py-3.5 text-base font-black mt-2"
                  >
                    <span>Simulate Safe Payment (₹ 1,480)</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto text-center">
              <div className="rounded-3xl border-2 border-emerald-400 bg-emerald-50/60 p-6 space-y-3 dark:bg-emerald-950/30 dark:border-emerald-700">
                <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
                <h3 className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
                  Bill Payment Successful! 🎉
                </h3>
                <p className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Amount ₹ 1,480 paid to Electricity Board. Your consumer account balance is updated to ₹ 0.00.
                </p>

                <div className="rounded-xl bg-white border border-slate-200 p-3.5 text-left font-mono text-xs space-y-1 dark:bg-slate-850 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Transaction Ref:</span>
                    <span className="font-black text-brand-700 dark:text-brand-400">TXN-2026-9482019</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Consumer ID:</span>
                    <span className="font-bold">{consumerNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Payment Mode:</span>
                    <span className="font-bold">Simulated UPI Autopay</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBillPaid(false);
                  setConsumerNo('');
                }}
                className="btn btn-ghost !py-2.5 !px-5 text-sm font-black"
              >
                Practice Another Bill
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 6: AYUSHMAN BHARAT (PM-JAY) GOLDEN HEALTH CARD
      ========================================================================= */}
      {activeModule === 'ayushman' && (
        <div className="card p-6 sm:p-7 space-y-6 border-2 border-rose-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
                <Award size={24} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Ayushman Bharat (PM-JAY) Card Simulator
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-500">
                  Learn how ₹ 5 Lakh free cashless hospital treatment works for senior citizens and families.
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                speakText(
                  'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana provides up to five lakh rupees per year of free cashless hospital treatment for senior citizens in all empannelled hospitals.'
                )
              }
              className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1 font-black shrink-0"
            >
              <Volume2 size={15} />
              <span>Audio Guide</span>
            </button>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm font-bold text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <Info size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Special Senior Citizen Benefit:</strong> Every citizen aged 70 and above is eligible for a dedicated Ayushman Vay Vandana card with ₹ 5 Lakh distinct hospital coverage regardless of income.
              </div>
            </div>

            <label className="block text-sm font-black text-slate-700 dark:text-slate-200">
              Enter Ration Card / Family ID or Aadhaar
              <div className="flex gap-2 mt-1.5">
                <input
                  type="text"
                  placeholder="e.g. 2910 4820 1928"
                  value={rationCardNo}
                  onChange={(e) => setRationCardNo(e.target.value)}
                  className="input font-mono font-bold flex-1"
                />
                <button
                  type="button"
                  onClick={() => setRationCardNo('2910 4820 1928')}
                  className="btn btn-ghost !py-1.5 !px-3 text-xs text-rose-700 border-rose-200 font-extrabold"
                >
                  Sample ID
                </button>
              </div>
            </label>

            {rationCardNo && (
              <div className="space-y-4 pt-2">
                {/* Simulated Ayushman Golden Card */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 bg-linear-to-br from-amber-100 via-amber-50 to-emerald-50 p-5 shadow-md dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 text-slate-900 dark:text-white">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2.5 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                        +
                      </div>
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        PM-JAY Ayushman Card
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Cover: ₹ 5,00,000 / Year
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-center gap-4">
                    <div className="h-16 w-14 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400 font-bold text-xs dark:bg-slate-700">
                      PHOTO
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-sm font-black">{user?.name || 'Dadaji Sharma'}</p>
                      <p className="font-mono text-slate-600 dark:text-slate-300">PM-JAY ID: AB-PMJAY-8291048</p>
                      <p className="text-emerald-700 dark:text-emerald-400 font-extrabold">Status: Verified & Active</p>
                    </div>
                  </div>

                  <div className="mt-3 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 border-t border-amber-200/80 pt-2 dark:border-slate-700 flex justify-between">
                    <span>Cashless treatment across 29,000+ empannelled hospitals</span>
                    <span>Toll-free: 14555</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => alert('Simulated Ayushman Card download triggered! In reality, you can save this on your phone or print a PVC card.')}
                    className="btn btn-primary flex-1 !py-3 text-sm font-black inline-flex items-center justify-center gap-1.5"
                  >
                    <Download size={16} />
                    <span>Download Simulated Card</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          HELPLINE DIRECTORY MODAL
      ========================================================================= */}
      {showHelpline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="card max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-brand-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <PhoneCall size={22} className="text-rose-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Important Senior Helplines (Toll-Free)
                </h3>
              </div>
              <button
                onClick={() => setShowHelpline(false)}
                className="btn btn-ghost !p-1.5 text-xs rounded-full font-black"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              {/* Elderline */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-3.5 space-y-1 dark:bg-purple-950/40 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-950 dark:text-purple-200 text-base">👵 14567 — Elderline</span>
                  <span className="rounded-full bg-purple-600 text-white px-2 py-0.5 text-[10px] font-black">Free (8am - 8pm)</span>
                </div>
                <p className="text-xs font-bold text-purple-800 dark:text-purple-300">
                  National Helpline for Senior Citizens: Emotional support, elder care, legal rights, and rescue assistance.
                </p>
              </div>

              {/* Cyber Crime */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 space-y-1 dark:bg-rose-950/40 dark:border-rose-800">
                <div className="flex items-center justify-between">
                  <span className="font-black text-rose-950 dark:text-rose-200 text-base">🚨 1930 — National Cyber Crime</span>
                  <span className="rounded-full bg-rose-600 text-white px-2 py-0.5 text-[10px] font-black">24x7 Emergency</span>
                </div>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  Dial immediately if money was deducted by an OTP scam or fake call. Dialing within the first 2 hours helps police freeze the money in the recipient bank.
                </p>
              </div>

              {/* Central Pensioners Cell */}
              <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-3.5 space-y-1 dark:bg-brand-950/40 dark:border-brand-800">
                <div className="flex items-center justify-between">
                  <span className="font-black text-brand-950 dark:text-brand-200 text-base">🏛️ 1905 — Pensioners' Grievance Cell</span>
                  <span className="rounded-full bg-brand-600 text-white px-2 py-0.5 text-[10px] font-black">Govt of India</span>
                </div>
                <p className="text-xs font-bold text-brand-800 dark:text-brand-300">
                  Department of Pensions & Pensioners' Welfare (DoPPW) for delayed pension, PPO corrections, and family pension claims.
                </p>
              </div>

              {/* Ayushman */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1 dark:bg-emerald-950/40 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 dark:text-emerald-200 text-base">🏥 14555 — Ayushman PM-JAY</span>
                  <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black">24x7 Health</span>
                </div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Find nearest empannelled hospitals for cashless surgery and cancer/cardiac care under Ayushman card.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpline(false)}
              className="btn btn-primary w-full !py-2.5 text-sm font-black"
            >
              Close Directory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
