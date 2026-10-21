import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Zap,
  Sparkles,
  School,
  Globe,
  Users,
  Copy,
  Check,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api.js';
import { Loading } from '../components.jsx';

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <div
        className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-amber-300 shadow-md ring-2 ring-amber-400/80"
        title="1st Place · Podium Champion"
        style={{ color: '#0f172a' }}
      >
        <Crown size={22} className="fill-amber-400 stroke-amber-950" style={{ stroke: '#0f172a' }} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div
        className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 shadow-xs"
        title="2nd Place"
      >
        <Medal size={20} className="text-slate-500 dark:text-slate-300" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div
        className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300 shadow-xs"
        title="3rd Place"
      >
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
  const [boardSection, setBoardSection] = useState('classroom'); // 'classroom' | 'public'
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [copied, setCopied] = useState(false);

  // Quick join classroom state (if learner has no classroom yet)
  const [quickCode, setQuickCode] = useState('');
  const [quickJoining, setQuickJoining] = useState(false);
  const [quickMsg, setQuickMsg] = useState(null);

  const fetchClassrooms = () => {
    return api('/classrooms/my')
      .then((res) => {
        const list = res.classrooms || [];
        setClassrooms(list);
        if (list.length > 0) {
          if (!selectedClassroomId || !list.some((c) => c.id === selectedClassroomId)) {
            setSelectedClassroomId(list[0].id);
          }
        } else {
          // If no classrooms, fallback to overall public board
          setBoardSection('public');
        }
        return list;
      })
      .catch(() => []);
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    setData(null);
    if (boardSection === 'public') {
      api(`/leaderboard?period=${period}`).then(setData);
    } else {
      if (selectedClassroomId) {
        api(`/leaderboard?period=${period}&classroomId=${selectedClassroomId}`).then(setData);
      } else {
        setData({ rows: [], classroom: null });
      }
    }
  }, [period, boardSection, selectedClassroomId]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickJoin = async (e) => {
    e.preventDefault();
    const clean = quickCode.trim().toUpperCase();
    if (!clean) return;
    setQuickJoining(true);
    setQuickMsg(null);
    try {
      const res = await api('/classrooms/join', {
        method: 'POST',
        body: { code: clean },
      });
      setQuickMsg({ ok: true, text: res.message || `Joined ${res.classroom?.name}!` });
      setQuickCode('');
      const updatedList = await fetchClassrooms();
      if (res.classroom?.id) {
        setSelectedClassroomId(res.classroom.id);
        setBoardSection('classroom');
      }
      setTimeout(() => setQuickMsg(null), 4000);
    } catch (err) {
      setQuickMsg({ ok: false, text: err.message });
    } finally {
      setQuickJoining(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:border-amber-700/80 dark:text-amber-300 shadow-xs">
          <Trophy size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Leaderboard
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            {boardSection === 'classroom'
              ? 'Rankings scoped strictly to learners in your classroom'
              : 'Overall platform rankings across all registered learners'}
          </p>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setBoardSection('public');
          }}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            boardSection === 'public'
              ? 'bg-white dark:bg-black text-brand-700 dark:text-brand-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Globe size={16} />
          <span>Overall Public Leaderboard</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setBoardSection('classroom');
            if (classrooms.length > 0 && !selectedClassroomId) {
              setSelectedClassroomId(classrooms[0].id);
            }
          }}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 ${
            boardSection === 'classroom'
              ? 'bg-white dark:bg-black text-brand-700 dark:text-brand-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <School size={16} />
          <span>Classroom Leaderboards</span>
          {classrooms.length > 0 && (
            <span className="rounded-full bg-brand-100 dark:bg-brand-950/80 px-2 py-0.2 text-[10px] font-black text-brand-700 dark:text-brand-300">
              {classrooms.length}
            </span>
          )}
        </button>
      </div>

      {/* Classroom-based sub-selector */}
      {boardSection === 'classroom' && (
        <>
          {classrooms.length === 0 ? (
            <div className="card p-5 space-y-3 dark:border-slate-700 dark:bg-black text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 mx-auto">
                <School size={24} />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                Join a Classroom to View Its Leaderboard
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Each classroom has its own dedicated leaderboard. Enter your teacher's 6-character code below to join and compete with your classmates!
              </p>

              <form onSubmit={handleQuickJoin} className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-sm mx-auto">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Code (e.g. DUL482)"
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                  className="input !py-2 !px-3 font-mono font-black text-sm uppercase text-center w-40"
                  disabled={quickJoining}
                />
                <button
                  type="submit"
                  disabled={quickJoining || !quickCode.trim()}
                  className="btn btn-primary !py-2 !px-4 text-xs sm:text-sm font-black inline-flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>{quickJoining ? 'Joining…' : 'Join Classroom'}</span>
                </button>
              </form>

              {quickMsg && (
                <p
                  role="alert"
                  className={`mt-2 text-xs font-bold p-2 rounded-xl inline-block ${
                    quickMsg.ok
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300'
                  }`}
                >
                  {quickMsg.text}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Classroom selector buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 mr-1">
                  Classrooms:
                </span>
                {classrooms.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClassroomId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 ${
                      selectedClassroomId === c.id
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-white dark:bg-black text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-300'
                    }`}
                  >
                    <School size={13} />
                    <span>{c.name}</span>
                    <span className="opacity-80 text-[11px]">({c.studentCount})</span>
                  </button>
                ))}
              </div>

              {/* Classroom Header Banner */}
              {data?.classroom && (
                <div className="card p-3.5 sm:p-4 bg-gradient-to-r from-brand-50/90 via-indigo-50/70 to-purple-50/80 dark:from-slate-900 dark:via-brand-950/40 dark:to-slate-900 border border-brand-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-brand-100 dark:bg-brand-950 px-2 py-0.5 text-[10px] font-black uppercase text-brand-800 dark:text-brand-300">
                        Classroom Leaderboard
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                        {data.classroom.name}
                      </h2>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      Teacher: <strong>{data.classroom.teacherName}</strong> · Scoped to {data.classroom.totalStudents || data.totalLearners} learners
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-black text-slate-500">Code:</span>
                    <span className="font-mono font-black text-sm tracking-widest px-2.5 py-1 rounded-lg bg-white dark:bg-black border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300">
                      {data.classroom.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(data.classroom.code)}
                      className="btn btn-ghost !py-1 !px-2 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      title="Copy join code"
                    >
                      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Time Period Filter Switcher */}
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

      {/* Leaderboard Rows Rendering */}
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
                {data.classroom
                  ? `You are ranked #${data.myRank} out of ${data.classroom.totalStudents || data.totalLearners} in ${data.classroom.name}!`
                  : `You are ranked #${data.myRank} on the global leaderboard!`}
                {data.myRank === 1 ? ' 👑 Podium topper!' : data.myRank <= 3 ? ' — Podium spot!' : ''}
              </span>
            </motion.div>
          )}

          {data.rows.length === 0 ? (
            <p className="card p-5 font-bold text-slate-500 text-center dark:border-slate-700 dark:bg-black">
              {data.classroom
                ? `No XP recorded in ${data.classroom.name} for this period yet. Complete a task to become the classroom champion!`
                : 'No XP earned yet. Be the first to start climbing!'}
            </p>
          ) : (
            <ol className="space-y-2">
              {data.rows.map((r, k) => {
                const isTopper = k === 0;
                return (
                  <motion.li
                    key={r.id}
                    initial={{ x: -15, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: k * 0.03 }}
                    className={`card flex items-center gap-3 p-3 transition hover:shadow-md ${
                      isTopper
                        ? 'podium-topper !border-amber-400 ring-2 ring-amber-300 dark:!border-amber-400 dark:ring-2 dark:ring-amber-400 dark:!bg-gradient-to-r dark:!from-purple-900 dark:!via-purple-800 dark:!to-indigo-900 shadow-md dark:shadow-[0_0_24px_rgba(147,51,234,0.5)]'
                        : r.you
                        ? '!border-brand-500 !bg-brand-50/80 dark:!bg-brand-950/70 dark:!border-brand-400 ring-2 ring-brand-300 dark:ring-brand-500/50'
                        : ''
                    }`}
                  >
                    <RankBadge rank={k + 1} />

                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black shadow-md ${
                        isTopper
                          ? 'topper-avatar ring-2 ring-amber-400 font-black'
                          : 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200 border border-brand-200 dark:border-brand-800'
                      }`}
                      style={isTopper ? { color: '#0f172a', backgroundColor: '#fde047' } : undefined}
                      aria-hidden="true"
                    >
                      {r.name[0]?.toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1 truncate text-sm sm:text-base font-black">
                      <span className={isTopper ? 'text-slate-900 dark:!text-white' : 'text-slate-800 dark:text-slate-100'}>
                        {r.name}
                      </span>
                      {r.you && (
                        <span
                          className={`ml-1.5 text-xs font-extrabold ${
                            isTopper ? 'text-amber-900 dark:text-amber-200' : 'text-brand-600 dark:text-brand-300'
                          }`}
                        >
                          (You)
                        </span>
                      )}
                    </div>

                    {r.streak > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full border shadow-2xs ${
                          isTopper
                            ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-400'
                            : 'bg-orange-50 text-orange-700 dark:bg-orange-950/80 dark:text-orange-200 dark:border-orange-800 border-orange-200'
                        }`}
                      >
                        <Flame size={13} className="fill-orange-500 stroke-orange-600 dark:stroke-orange-400" />
                        <span>{r.streak}d</span>
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-black px-3 py-1 rounded-full border shadow-xs ${
                        isTopper
                          ? 'topper-xp'
                          : r.you
                          ? 'bg-brand-100 text-brand-900 border-brand-300 dark:bg-brand-900/80 dark:text-brand-100 dark:border-brand-600'
                          : 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
                      }`}
                      style={isTopper ? { color: '#0f172a', backgroundColor: '#fde047', borderColor: '#fbbf24' } : undefined}
                    >
                      <Zap
                        size={14}
                        className={
                          isTopper
                            ? 'fill-slate-950 stroke-slate-950'
                            : 'fill-amber-400 stroke-amber-500'
                        }
                        style={isTopper ? { color: '#0f172a', fill: '#0f172a' } : undefined}
                      />
                      <span style={isTopper ? { color: '#0f172a' } : undefined}>{r.xp} XP</span>
                    </span>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
