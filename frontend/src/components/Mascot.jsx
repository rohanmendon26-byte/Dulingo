/* ---------- Mascot: Octo the octopus ---------- */
export function Octo({ size = 100, mood = 'happy', className = '' }) {
  const mouth = mood === 'sad' ? 'M44 66 Q60 58 76 66' : 'M44 62 Q60 76 76 62';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`drop-shadow-sm ${className}`}
      role="img"
      aria-label="Octo the octopus mascot"
    >
      <g fill="#8b5cf6" stroke="#5b21b6" strokeWidth="3" strokeLinecap="round">
        <path d="M24 78 Q10 96 22 108 Q30 112 28 98" fill="none" strokeWidth="9" stroke="#8b5cf6" />
        <path d="M42 84 Q34 102 44 112 Q52 114 48 100" fill="none" strokeWidth="9" stroke="#8b5cf6" />
        <path d="M78 84 Q86 102 76 112 Q68 114 72 100" fill="none" strokeWidth="9" stroke="#8b5cf6" />
        <path d="M96 78 Q110 96 98 108 Q90 112 92 98" fill="none" strokeWidth="9" stroke="#8b5cf6" />
        <ellipse cx="60" cy="52" rx="42" ry="40" />
      </g>
      <ellipse cx="44" cy="46" rx="9" ry="11" fill="#fff" />
      <ellipse cx="76" cy="46" rx="9" ry="11" fill="#fff" />
      <circle cx="46" cy="48" r="5" fill="#1e1b3a" />
      <circle cx="78" cy="48" r="5" fill="#1e1b3a" />
      <path d={mouth} fill="none" stroke="#1e1b3a" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="30" cy="62" rx="6" ry="4" fill="#f9a8d4" opacity=".8" />
      <ellipse cx="90" cy="62" rx="6" ry="4" fill="#f9a8d4" opacity=".8" />
      {/* headphones: Dulingo is about listening */}
      <path d="M18 50 Q18 8 60 8 Q102 8 102 50" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />
      <rect x="10" y="44" width="14" height="22" rx="6" fill="#fbbf24" />
      <rect x="96" y="44" width="14" height="22" rx="6" fill="#fbbf24" />
    </svg>
  );
}
