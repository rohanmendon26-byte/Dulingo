import { Volume2, Square, Mic } from 'lucide-react';

/* ---------- Audio Speaker Button ---------- */
export function SpeakerButton({ onClick, speaking, label = 'Listen' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={speaking ? 'Stop audio' : label}
      className={`btn !rounded-full !px-5 !py-3 sm:!px-6 sm:!py-3.5 text-base sm:text-lg shadow-md transition ${
        speaking ? 'bg-amber-500 hover:bg-amber-600 !shadow-[0_4px_0_#b45309]' : 'btn-primary'
      }`}
    >
      {speaking ? (
        <Square size={20} className="fill-white" />
      ) : (
        <Volume2 size={22} className="animate-pulse" />
      )}
      <span>{speaking ? 'Playing…' : label}</span>
    </button>
  );
}

/* ---------- Microphone Button for Speech Recognition ---------- */
export function MicButton({ listening, onClick, title = 'Speak your answer', label, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={listening ? 'Stop listening' : title}
      title={listening ? 'Listening… click to stop' : title}
      className={`inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 font-extrabold text-sm transition cursor-pointer ${
        listening
          ? 'bg-rose-500 text-white shadow-md ring-4 ring-rose-200 animate-pulse'
          : 'bg-brand-100 text-brand-700 hover:bg-brand-200 border border-brand-200/80 shadow-xs'
      } ${className}`}
    >
      {listening ? <Square size={16} className="fill-white" /> : <Mic size={17} />}
      {label !== undefined ? (
        <span>{listening ? 'Listening…' : label}</span>
      ) : listening ? (
        <span className="text-xs font-black uppercase tracking-wider">Listening…</span>
      ) : null}
    </button>
  );
}
