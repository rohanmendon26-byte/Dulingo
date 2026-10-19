import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Octo } from './Mascot.jsx';

/* ---------- Loading State ---------- */
export function Loading({ text = 'Loading…' }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 350);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}>
        <Octo size={80} />
      </motion.div>
      <p className="text-sm font-extrabold text-slate-600">{text.replace('…', '')}{'.'.repeat(dots)}</p>
    </div>
  );
}
