import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Award,
  Sparkles,
  BookOpen,
  Trophy,
  Home,
  Lightbulb,
  Mic,
  Square,
  WifiOff,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Confetti, Loading, Octo, MicButton, TopicBadge, TYPE_LABEL, localize } from '../components.jsx';
import { useSpeech, useSpeechRecognition } from '../speech.js';

export default function Quest() {
  const { setUser, lang } = useAuth();
  const [searchParams] = useSearchParams();
  const practiceId = searchParams.get('practiceId');
  const modeParam = searchParams.get('mode');
  const isPractice = modeParam === 'practice' || Boolean(practiceId);

  const [tasks, setTasks] = useState(null);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [forms, setForms] = useState({}); // mock form values per task id
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [earned, setEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [badges, setBadges] = useState([]);
  const [activeMicField, setActiveMicField] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const speech = useSpeech(lang);
  const mic = useSpeechRecognition(lang);

  useEffect(() => {
    api('/tasks/today')
      .then((d) => {
        const all = d.tasks || [];
        if (practiceId) {
          const match = all.find((t) => String(t.id) === String(practiceId));
          setTasks(match ? [match] : all);
        } else if (modeParam === 'practice') {
          const completed = all.filter((t) => t.done);
          setTasks(completed.length > 0 ? completed : all);
        } else {
          setTasks(all.filter((t) => !t.done));
        }
      })
      .catch((e) => setErr(e.message));
  }, [practiceId, modeParam]);

  const rawTask = tasks?.[i];
  const task = rawTask && localize(rawTask, lang);
  const opts = rawTask?.options || [];
  const finished = tasks && i >= tasks.length;
  const formVals = rawTask?.type === 'mock_form' ? (forms[rawTask.id] || rawTask.fields.map(() => '')) : [];
  const setField = (k, v) => setForms({ ...forms, [rawTask.id]: formVals.map((x, j) => (j === k ? v : x)) });
  const words = useMemo(() => answer.trim().split(/\s+/).filter(Boolean).length, [answer]);

  useEffect(() => {
    speech.stop();
    mic.stopListening();
    setActiveMicField(null);
    setShowHint(false);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setErr('');
    setBusy(true);
    speech.stop();
    mic.stopListening();
    try {
      const endpoint = isPractice ? `/tasks/${rawTask.id}/practice` : `/tasks/${rawTask.id}/submit`;
      const r = await api(endpoint, {
        method: 'POST',
        body: { answer: rawTask.type === 'mock_form' ? JSON.stringify(formVals) : answer },
      });
      setResult(r);
      if (!isPractice && r.user) {
        setUser(r.user);
        setEarned((e) => e + r.xpEarned);
        if (r.newBadges?.length) setBadges((b) => [...b, ...r.newBadges]);
      }
      if (r.correct) setCorrectCount((c) => c + 1);
      if (r.correct) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2200);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setI(i + 1);
    setAnswer('');
    setResult(null);
    setErr('');
    setShowHint(false);
    mic.stopListening();
    setActiveMicField(null);
  };

  if (err && !tasks) return <p role="alert" className="font-bold text-rose-600">{err}</p>;
  if (!tasks) return <Loading />;

  if (tasks.length === 0 || finished) {
    return (
      <div className="mx-auto max-w-md space-y-4 sm:space-y-5 text-center py-4">
        <Confetti show={finished && correctCount > 0} />
        <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex justify-center">
          <Octo size={140} />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
          {isPractice
            ? 'Practice Complete!'
            : tasks.length === 0
            ? 'All caught up!'
            : 'Quest Complete!'}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
          {isPractice
            ? 'Great repetition! Revisiting lessons reinforces memory.'
            : tasks.length === 0
            ? 'You completed all your daily tasks! You can practice completed tasks anytime.'
            : 'Outstanding work on today’s civic challenges!'}
        </p>

        {tasks.length > 0 && (
          <div className="card grid grid-cols-2 gap-2.5 p-4 text-base sm:text-lg font-black dark:border-slate-700 dark:bg-black">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Zap size={18} className="fill-amber-500 text-amber-500" />
              <span>{isPractice ? '+0 XP (Practice)' : `+${earned} XP`}</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              <span>{correctCount}/{tasks.length} right</span>
            </div>
          </div>
        )}
        {badges.map((b) => (
          <p
            key={b.id}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-100 p-3 font-black text-amber-800 text-sm dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          >
            <Award size={18} className="text-amber-600 shrink-0" />
            <span>New badge unlocked: {b.label}</span>
          </p>
        ))}
        <div className="flex flex-col gap-2 pt-2">
          {tasks.length === 0 && !isPractice && (
            <Link
              to="/quest?mode=practice"
              className="btn btn-outline text-sm sm:text-base border-brand-400 text-brand-700 hover:bg-brand-50 dark:border-brand-500 dark:text-brand-300 dark:hover:bg-slate-800"
            >
              <RotateCcw size={18} />
              <span>Practice Completed Tasks</span>
            </Link>
          )}
          <Link to="/stories" className="btn btn-primary text-sm sm:text-base">
            <BookOpen size={18} />
            <span>Read a Story for Bonus XP</span>
          </Link>
          <Link to="/leaderboard" className="btn btn-ghost text-sm sm:text-base">
            <Trophy size={18} />
            <span>Check Leaderboard</span>
          </Link>
          <Link to="/dashboard" className="btn btn-ghost text-sm sm:text-base">
            <Home size={18} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit =
    task.type === 'essay'
      ? words >= 15
      : task.type === 'mock_form'
      ? formVals.every((v) => v.trim())
      : answer.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl pb-64 sm:pb-52">
      <Confetti show={celebrate} />

      {/* Practice Mode Alert Header Banner */}
      {isPractice && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-purple-300 bg-purple-50/90 px-3 py-1.5 text-xs font-black text-purple-900 dark:border-purple-800 dark:bg-purple-950/70 dark:text-purple-300 shadow-2xs">
          <span className="flex items-center gap-1.5">
            <RotateCcw size={13} className="text-purple-600 dark:text-purple-400" />
            <span>Practice Mode: Replay lessons for mastery (+0 XP)</span>
          </span>
          <Link
            to="/dashboard"
            className="text-[11px] font-bold text-purple-700 dark:text-purple-300 underline hover:opacity-80"
          >
            Exit
          </Link>
        </div>
      )}

      {/* Sleek top quest header bar */}
      <div className="mb-4 sm:mb-6 flex items-center gap-3">
        <Link
          to="/dashboard"
          aria-label="Quit quest"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <X size={18} className="stroke-[2.5]" />
        </Link>
        <div
          className="h-3 sm:h-3.5 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={i}
          aria-valuemax={tasks.length}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
            animate={{ width: `${(i / tasks.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="font-black text-xs sm:text-sm text-slate-500 dark:text-slate-400 shrink-0">
          {i + 1}/{tasks.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={task.id}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          className="space-y-4"
        >
          {/* Topic & Type Badge + Hint Trigger */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <TopicBadge topic={task.topic} size="sm" />
              <span className="text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
                {task.topic} · {TYPE_LABEL[task.type]}
              </span>
              {rawTask?.classroom && (
                <span className="rounded-md bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300 text-[10px] font-black px-1.5 py-0.5 border border-brand-200 dark:border-brand-800">
                  🏫 {rawTask.classroom.name}
                </span>
              )}
              {rawTask?.dueDate && (
                <span className={`rounded-md text-[10px] font-black px-1.5 py-0.5 border inline-flex items-center gap-1 ${
                  rawTask.isExpired
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200'
                }`}>
                  <Clock size={10} />
                  <span>{rawTask.isExpired ? 'Deadline Passed' : `Due: ${rawTask.dueDate} ${rawTask.dueTime ? `(${rawTask.dueTime})` : ''}`}</span>
                </span>
              )}
            </div>

            {!result && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 transition cursor-pointer"
                title="Get a helpful hint"
              >
                <Lightbulb size={12} className={showHint ? 'fill-amber-500' : ''} />
                <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
              </button>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 leading-snug">
            {task.title}
          </h1>

          {/* Collapsible Smart Hint Box */}
          {showHint && !result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs sm:text-sm font-semibold text-amber-900 dark:border-amber-700/80 dark:bg-amber-950/70 dark:text-amber-200 space-y-1 shadow-2xs"
            >
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide text-amber-800 dark:text-amber-300">
                <Lightbulb size={13} className="fill-amber-500 text-amber-600" />
                <span>Civic Learning Hint</span>
              </div>
              <p>
                {task.type === 'mock_form'
                  ? 'Fill out all fields carefully according to standard Indian government identity and service document guidelines.'
                  : task.type === 'essay'
                  ? 'Write at least 15 words explaining the procedure or concept clearly step by step.'
                  : `Focus on the exact key terminology used in official ${task.topic} procedures.`}
              </p>
            </motion.div>
          )}

          {/* Question Text */}
          <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-700/80 p-4 text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed shadow-xs">
            {task.prompt}
          </div>

          {/* MCQ Option Choices */}
          {task.type === 'audio_mcq' && (
            <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
              {mic.supported && !result && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-50/80 px-3 py-1.5">
                  <MicButton
                    listening={mic.listening && activeMicField === 'mcq'}
                    onClick={() => {
                      if (mic.listening && activeMicField === 'mcq') {
                        mic.stopListening();
                        setActiveMicField(null);
                      } else {
                        setActiveMicField('mcq');
                        mic.startListening((text) => {
                          const cleaned = text.toLowerCase().trim();
                          const numMap = {
                            one: 0, '1': 0, first: 0,
                            two: 1, '2': 1, second: 1,
                            three: 2, '3': 2, third: 2,
                            four: 3, '4': 3, fourth: 3,
                          };
                          for (const [word, idx] of Object.entries(numMap)) {
                            if (cleaned.includes(word) && opts[idx]) {
                              setAnswer(opts[idx]);
                              return;
                            }
                          }
                          const found = opts.find((opt, idx) => {
                            const tr = (task.options?.[idx] || opt).toLowerCase();
                            return cleaned.includes(opt.toLowerCase()) || cleaned.includes(tr);
                          });
                          if (found) setAnswer(found);
                        });
                      }
                    }}
                    label="Speak Choice"
                    className="!py-1 !px-2.5 text-xs"
                  />
                  <span className="text-[11px] font-bold text-slate-500">
                    {mic.listening && activeMicField === 'mcq'
                      ? 'Say “Option 1”, “Two”, or speak the answer…'
                      : 'Say number or option text to answer'}
                  </span>
                </div>
              )}
              {opts.map((en, k) => {
                const label = task.options?.[k] || en;
                const state = result
                  ? en === result.correctAnswer
                    ? 'right'
                    : en === answer
                    ? 'wrong'
                    : ''
                  : answer === en
                  ? 'selected'
                  : '';
                return (
                  <button
                    key={en}
                    role="radio"
                    aria-checked={answer === en}
                    disabled={!!result}
                    onClick={() => setAnswer(en)}
                    className={`option flex items-center gap-3 ${state}`}
                  >
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black transition-colors ${
                      state === 'right' ? 'bg-emerald-500 text-white' :
                      state === 'wrong' ? 'bg-rose-500 text-white' :
                      'bg-brand-100 text-brand-700'
                    }`}>
                      {state === 'right' ? <CheckCircle2 size={14} /> : state === 'wrong' ? <X size={14} /> : k + 1}
                    </span>
                    <span className="flex-1 text-left">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill in the Blank Input */}
          {task.type === 'fill_blank' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="input text-base sm:text-lg flex-1"
                  placeholder="Type or speak your answer"
                  value={answer}
                  disabled={!!result}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && !result && submit()}
                  aria-label="Your answer"
                />
                {mic.supported && !result && (
                  <MicButton
                    listening={mic.listening && activeMicField === 'blank'}
                    onClick={() => {
                      if (mic.listening && activeMicField === 'blank') {
                        mic.stopListening();
                        setActiveMicField(null);
                      } else {
                        setActiveMicField('blank');
                        mic.startListening((text) => setAnswer(text));
                      }
                    }}
                  />
                )}
              </div>
              {mic.listening && activeMicField === 'blank' && (
                <p className="text-xs font-extrabold text-rose-500 animate-pulse">
                  Listening… speak your answer clearly.
                </p>
              )}
              {mic.error && activeMicField === 'blank' && (
                <p className="text-xs font-bold text-rose-600">{mic.error}</p>
              )}
            </div>
          )}

          {/* Mock Government Form Task */}
          {task.type === 'mock_form' && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Official Form Boxes: Fill in the details
              </p>
              <div className="space-y-2.5">
                {rawTask.fields.map((f, k) => {
                  const r = result?.fieldResults?.[k];
                  const isThisFieldListening = mic.listening && activeMicField === k;
                  return (
                    <div
                      key={k}
                      className={`card p-3 sm:p-3.5 transition ${
                        r ? (r.ok ? '!border-emerald-300 bg-emerald-50/50' : '!border-rose-300 bg-rose-50/50') : ''
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700">{f.label}</label>
                        {f.hint && (
                          <button
                            type="button"
                            onClick={() => speech.speak(`${f.label}. ${f.hint}`)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline"
                          >
                            <Lightbulb size={13} />
                            <span>Hint</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          className="input !py-1.5 !text-sm flex-1"
                          placeholder={f.placeholder || `Enter ${f.label}`}
                          value={formVals[k] || ''}
                          disabled={!!result}
                          onChange={(e) => setField(k, e.target.value)}
                        />
                        {mic.supported && !result && (
                          <button
                            type="button"
                            className={`grid h-8 w-8 place-items-center rounded-lg border text-sm transition ${
                              isThisFieldListening
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                            onClick={() => {
                              if (isThisFieldListening) {
                                mic.stopListening();
                                setActiveMicField(null);
                              } else {
                                setActiveMicField(k);
                                mic.startListening((text) => setField(k, text));
                              }
                            }}
                            title={`Speak ${f.label}`}
                          >
                            <Mic size={15} />
                          </button>
                        )}
                        {r && (
                          <span className="shrink-0">
                            {r.ok ? (
                              <CheckCircle2 size={18} className="text-emerald-600" />
                            ) : (
                              <AlertCircle size={18} className="text-rose-600" />
                            )}
                          </span>
                        )}
                      </div>
                      {r && !r.ok && (
                        <p className="mt-1 text-xs font-extrabold text-rose-600">Expected: {r.expected}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Essay Writing & Voice Dictation */}
          {task.type === 'essay' && (
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  className="input min-h-36 text-sm sm:text-base pr-14"
                  placeholder="Write or dictate your answer in your own words…"
                  value={answer}
                  disabled={!!result}
                  onChange={(e) => setAnswer(e.target.value)}
                  aria-label="Your answer"
                />
                {mic.supported && !result && (
                  <div className="absolute top-2.5 right-2.5">
                    <MicButton
                      listening={mic.listening && activeMicField === 'essay'}
                      onClick={() => {
                        if (mic.listening && activeMicField === 'essay') {
                          mic.stopListening();
                          setActiveMicField(null);
                        } else {
                          setActiveMicField('essay');
                          const prefix = answer ? answer.trim() + ' ' : '';
                          mic.startListening((text) => setAnswer(prefix + text));
                        }
                      }}
                      title="Dictate with microphone"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-black ${words >= 15 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {words} words (minimum 15 required)
                </span>
                {mic.listening && activeMicField === 'essay' && (
                  <span className="font-black text-rose-500 animate-pulse">
                    Dictating aloud…
                  </span>
                )}
              </div>
            </div>
          )}

          {err && <p role="alert" className="font-bold text-rose-600 text-sm">{err}</p>}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Sticky Action Bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t-2 p-3.5 sm:p-4 backdrop-blur-md transition-all ${
          result
            ? result.correct
              ? 'border-emerald-400 bg-emerald-50/98 dark:bg-emerald-950/95 dark:border-emerald-700 shadow-[0_-8px_30px_rgba(16,185,129,0.18)]'
              : 'border-rose-400 bg-rose-50/98 dark:bg-rose-950/95 dark:border-rose-700 shadow-[0_-8px_30px_rgba(244,63,94,0.18)]'
            : 'border-slate-200/90 bg-white/95 dark:border-slate-700/80 dark:bg-slate-900/95 shadow-md'
        }`}
      >
        <div className="mx-auto max-w-2xl">
          {result ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`text-base sm:text-lg font-black flex items-center gap-2 ${
                      result.correct
                        ? 'text-emerald-900 dark:text-emerald-200'
                        : 'text-rose-950 dark:text-rose-200'
                    }`}
                  >
                    {result.correct ? (
                      <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle size={24} className="text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <span>
                      {result.needsReview
                        ? 'Submitted for teacher review!'
                        : result.correct
                        ? 'Correct answer!'
                        : 'Not quite right'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {result.isOffline && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 border border-amber-300 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300 px-2 py-0.5 text-[11px] font-black text-amber-900 shadow-2xs" title="Answer recorded offline. Will sync when reconnected.">
                        <WifiOff size={11} className="text-amber-700 dark:text-amber-400" /> Offline
                      </span>
                    )}
                    {isPractice ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 border border-purple-300 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-300 px-2.5 py-0.5 text-xs font-black text-purple-900 shadow-2xs">
                        <RotateCcw size={12} className="text-purple-600 dark:text-purple-400" /> Practice
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-xs font-black text-amber-900 shadow-2xs">
                        <Zap size={13} className="fill-amber-500 text-amber-600 dark:text-amber-400" /> +{result.xpEarned} XP
                      </span>
                    )}
                  </div>
                </div>

                {!result.correct && result.correctAnswer && (
                  <div className="rounded-xl bg-white/95 dark:bg-brand-950/90 p-2.5 sm:p-3 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm shadow-2xs">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 block mb-0.5">
                      Correct Answer:
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      {task.options?.[opts.indexOf(result.correctAnswer)] || result.correctAnswer}
                    </span>
                  </div>
                )}

                {result.hint && !result.correct && (
                  <div className="rounded-xl bg-amber-50/90 dark:bg-amber-950/70 p-2.5 sm:p-3 border border-amber-300 dark:border-amber-700/80 text-xs sm:text-sm shadow-2xs">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-0.5">
                      Practice Hint:
                    </span>
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      {result.hint}
                    </p>
                  </div>
                )}

                {(task.explanation || result.explanation) && (
                  <div className="rounded-xl bg-white/95 dark:bg-slate-900/90 p-2.5 sm:p-3 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm shadow-2xs max-h-48 overflow-y-auto">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-0.5">
                      Explanation:
                    </span>
                    <p className="font-semibold leading-relaxed whitespace-normal break-words text-slate-800 dark:text-slate-200">
                      {task.explanation || result.explanation}
                    </p>
                  </div>
                )}
              </div>

              <button
                className={`btn shrink-0 w-full sm:w-auto !py-3 !px-6 text-base font-black shadow-md inline-flex items-center justify-center gap-2 cursor-pointer ${
                  result.correct ? 'btn-good' : 'btn-primary'
                }`}
                onClick={next}
              >
                <span>Continue</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary w-full text-base sm:text-lg shadow-md cursor-pointer"
              disabled={!canSubmit || busy}
              onClick={submit}
            >
              {busy ? 'Checking Answer…' : 'Check Answer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
