/* ---------- Sleek Compact Stat Chips ---------- */
export function StatChip({ icon, value, label, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50/80 text-brand-700 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800/60',
    sun: 'bg-amber-50/90 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
    mint: 'bg-emerald-50/90 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    sky: 'bg-sky-50/90 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60',
    rose: 'bg-rose-50/90 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
  };
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs sm:text-sm font-extrabold shadow-2xs ${
        tones[tone] || tones.brand
      }`}
      title={label}
    >
      <span className="shrink-0">{icon}</span>
      <span className="font-black">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
