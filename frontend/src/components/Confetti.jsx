import { motion, AnimatePresence } from 'framer-motion';

/* ---------- Confetti burst ---------- */
export function Confetti({ show }) {
  const pieces = Array.from({ length: 32 }, (_, i) => i);
  const colors = ['#8b5cf6', '#fbbf24', '#10b981', '#f43f5e', '#38bdf8'];
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
          {pieces.map((i) => (
            <motion.span
              key={i}
              className="absolute top-1/3 left-1/2 block h-3 w-2 rounded-xs"
              style={{ background: colors[i % colors.length] }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 600,
                y: 200 + Math.random() * 350,
                opacity: 0,
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 1.5 + Math.random() * 0.7, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
