import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Flame, Zap, Sparkles } from 'lucide-react';
import { api } from '../api.js';
import { Loading } from '../components.jsx';

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/70 dark:border-amber-700/80 dark:text-amber-300 shadow-xs" title="1st Place">
        <Crown size={20} className="fill-amber-400 stroke-amber-700 dark:stroke-amber-400" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 shadow-xs" title="2nd Place">
        <Medal size={20} className="text-slate-500 dark:text-slate-300" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300 shadow-xs" title="3rd Place">
        <Medal size={20} className="text-amber-700 dark:text-amber-400" />
      </div>
    );
  }
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-xs font-black text-slate-500 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400">
      #{rank}
    </div>
  );
}

export default function Leaderboard() {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);

  useEffect(() => { setData(null); api(`/leaderboard?period=${period}`).then(setData); }, [period]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:border-amber-700/80 dark:text-amber-300 shadow-xs">
          <Trophy size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Leaderboard</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">See who has earned the most XP this week</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2" role="tablist">
        {[['week', 'This week'], ['all', 'All time']].map(([v, l]) => (
          <button
            key={v}
            role="tab"
            aria-selected={period === v}
            onClick={() => setPeriod(v)}
            className={`option text-center !py-2.5 !text-sm font-black cursor-pointer ${period === v ? 'selected' : ''}`}
          >
            {l}
          </button>
        ))}
      </div>

      {!data ? (
        <Loading />
      ) : (
        <>
          {data.myRank && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-brand-100 border border-brand-200 dark:bg-brand-950/70 dark:border-brand-800/80 dark:text-brand-200 p-3 text-center text-sm sm:text-base font-black text-brand-800"
            >
              <Sparkles size={18} className="text-brand-600 dark:text-brand-400" />
              <span>
                You are ranked #{data.myRank} {data.myRank === 1 ? '— Podium topper! 👑' : data.myRank <= 3 ? '— Podium spot!' : '— Keep answering to climb!'}
              </span>
            </motion.div>
          )}

          {data.rows.length === 0 && (
            <p className="card p-5 font-bold text-slate-500 text-center">No XP earned yet. Be the first!</p>
          )}

          <ol className="space-y-2">
            {data.rows.map((r, k) => {
              const isTopper = k === 0;
              return (
                <motion.li
                  key={r.id}
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: k * 0.03 }}
                  className={`card flex items-center gap-3 p-3 transition hover:shadow-sm ${
                    isTopper
                      ? 'podium-topper !border-amber-400 !bg-amber-50/70 ring-2 ring-amber-300 dark:!bg-brand-950/70 dark:!border-amber-400/80 dark:ring-2 dark:ring-amber-400/50'
                      : r.you
                      ? '!border-brand-500 !bg-brand-50/80 dark:!bg-brand-950/70 dark:!border-brand-400 ring-2 ring-brand-300 dark:ring-brand-500/50'
                      : ''
                  }`}
                >
                  <RankBadge rank={k + 1} />

                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${
                      isTopper
                        ? 'bg-amber-200 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300 dark:border dark:border-amber-400/40'
                        : 'bg-brand-200 text-brand-800 dark:bg-brand-900 dark:text-brand-200'
                    }`}
                    aria-hidden="true"
                  >
                  {r.name[0]?.toUpperCase()}
                </div>

                <div className="min-w-0 flex-1 truncate font-black text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                  {r.name}
                  {r.you && <span className="ml-1.5 text-xs text-brand-600 dark:text-brand-300 font-extrabold">(You)</span>}
                </div>

                {r.streak > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:border-amber-800/70 dark:text-amber-300 px-2 py-1 rounded-full border border-amber-200">
                    <Flame size={13} className="fill-amber-500 stroke-amber-600 dark:stroke-amber-400" /> {r.streak}d
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-black text-brand-700 bg-brand-50 dark:bg-brand-950/60 dark:border-brand-800/70 dark:text-brand-300 px-2.5 py-1 rounded-full border border-brand-200">
                  <Zap size={14} className="fill-brand-400 stroke-brand-700 dark:stroke-brand-400" /> {r.xp} XP
                </span>
              </motion.li>
            );
          })}
          </ol>
        </>
      )}
    </div>
  );
}
