import { motion } from 'framer-motion';

/* ---------- Progress Ring ---------- */
export function Ring({ value, max, size = 96, label }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = max ? Math.min(value / max, 1) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-brand-100 dark:text-slate-800"
          strokeWidth="10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
        <span className="text-xl font-black text-slate-800 dark:text-slate-100">{value}/{max}</span>
        {label && <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{label}</span>}
      </div>
    </div>
  );
}
