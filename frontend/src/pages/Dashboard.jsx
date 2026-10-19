import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame,
  ShieldCheck,
  Snowflake,
  Zap,
  Medal,
  Award,
  MessageSquareQuote,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  WifiOff,
  Bell,
  BellRing,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Loading, Octo, Ring, StatChip, TopicBadge, TYPE_LABEL, localize, useOnlineStatus } from '../components.jsx';
import {
  getNotificationStatus,
  requestNotificationPermission,
  sendStreakNudge,
  scheduleStreakNudge,
} from '../notifications.js';

export default function Dashboard() {
  const { setUser, lang } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const { online } = useOnlineStatus();
  const [notifStatus, setNotifStatus] = useState(() => getNotificationStatus());
  const [notifSending, setNotifSending] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');

  useEffect(() => {
    api('/tasks/today')
      .then((d) => {
        setData(d);
        if (d.user) setUser(d.user);
      })
      .catch((e) => setErr(e.message));
  }, [setUser]);

  const tasks = data?.tasks || [];
  const summary = data?.summary || { done: 0, pending: 0, total: 0, doneToday: 0, totalToday: 0 };
  const u = data?.user || { name: 'Learner', streak: 0, xp: 0, level: 1, xpIntoLevel: 0, badges: [] };
  const allDone = summary.pending === 0;

  useEffect(() => {
    if (data && summary.pending > 0) {
      scheduleStreakNudge({ streak: u.streak, pendingTasks: summary.pending });
    }
  }, [data, summary.pending, u.streak]);

  const handleEnableNotifs = async () => {
    setNotifSending(true);
    setNotifSuccess('');
    try {
      const res = await requestNotificationPermission();
      setNotifStatus(res);
      if (res === 'granted') {
        setNotifSuccess('Streak reminders enabled! A confirmation notification was sent.');
        setTimeout(() => setNotifSuccess(''), 4500);
      }
    } catch (e) {
      setNotifSuccess(e.message);
    } finally {
      setNotifSending(false);
    }
  };

  const handleTestNudge = async () => {
    setNotifSending(true);
    setNotifSuccess('');
    try {
      const sent = await sendStreakNudge({
        streak: u.streak || 1,
        pendingTasks: summary.pending || 1,
        isTest: true,
      });
      if (sent) {
        setNotifSuccess('Streak nudge delivered! Check your device notifications.');
        setTimeout(() => setNotifSuccess(''), 4500);
      } else {
        setNotifSuccess('Could not send notification. Please check browser permissions.');
      }
    } catch (e) {
      setNotifSuccess(e.message);
    } finally {
      setNotifSending(false);
    }
  };

  if (err && !data) return <p role="alert" className="font-bold text-rose-600">{err}</p>;
  if (!data) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Offline Alert Banner */}
      {(!online || data.isOffline) && (
        <motion.div
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 rounded-2xl bg-amber-50 border-2 border-amber-300 p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-amber-950 shadow-xs"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-200 text-amber-800">
            <WifiOff size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-amber-950">Offline Mode Active</p>
            <p className="text-xs text-amber-800 font-semibold leading-relaxed">
              No internet connection detected, but today's tasks are cached on your device. You can practice, answer quizzes, and your XP will automatically sync when reconnected!
            </p>
          </div>
        </motion.div>
      )}

      {/* Welcome Hero Card */}
      <motion.section
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-br from-white via-white to-brand-50/40 dark:from-slate-800 dark:via-slate-800 dark:to-brand-950/50 dark:border-slate-700 dark:shadow-[0_4px_0_#0f172a]"
      >
        <div className="flex items-center gap-3.5 sm:gap-5 w-full sm:w-auto">
          <div className="shrink-0">
            <Octo size={72} mood="happy" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 truncate">
              Namaste, {u.name.split(' ')[0]}!
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              {allDone
                ? 'All tasks completed for today. Great dedication!'
                : `You have ${summary.pending} task${summary.pending > 1 ? 's' : ''} waiting.`}
            </p>

            {/* Stat Chips Row */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2 items-center">
              <StatChip
                icon={<Flame size={15} className="text-amber-500 fill-amber-400" />}
                value={`${u.streak}d`}
                label="Daily Streak"
                tone="sun"
              />
              <StatChip
                icon={
                  u.streakFreeze ? (
                    <ShieldCheck size={15} className="text-sky-600" />
                  ) : (
                    <Snowflake size={15} className="text-blue-500" />
                  )
                }
                value={u.streakFreeze ? 'Shield Ready' : 'Freeze Used'}
                label={u.streakFreeze ? 'Streak Freeze Shield Equipped' : 'Streak Freeze Used'}
                tone={u.streakFreeze ? 'sky' : 'brand'}
              />
              <StatChip
                icon={<Zap size={15} className="text-amber-500 fill-amber-400" />}
                value={`${u.xp} XP`}
                label="Total Experience Points"
                tone="sun"
              />
              <StatChip
                icon={<Medal size={15} className="text-emerald-600" />}
                value={`Lvl ${u.level}`}
                label="Current Level"
                tone="mint"
              />
            </div>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-700/60">
          <Ring value={summary.doneToday} max={Math.max(summary.totalToday, 1)} label="today" size={88} />
        </div>
      </motion.section>

      {/* Engagement Nudge / Streak at Risk Card */}
      <motion.section
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`card border-2 p-3.5 sm:p-4 shadow-xs ${
          !allDone
            ? 'border-orange-200 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-brand-50/80 dark:border-amber-700/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-brand-950/40'
            : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-700/60 dark:bg-emerald-950/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-xs ${
                !allDone ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              {!allDone ? (
                <Flame size={22} className="animate-pulse" />
              ) : (
                <CheckCircle2 size={22} />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  {!allDone
                    ? u.streak > 0
                      ? `Your ${u.streak}-Day Streak is at Risk!`
                      : 'Keep Your Daily Learning Active!'
                    : 'Streak Safe for Today!'}
                </h3>
                {!allDone && (
                  <span className="rounded-full bg-orange-100 border border-orange-300 dark:bg-orange-950/80 dark:border-orange-700 dark:text-orange-300 px-2 py-0.5 text-[11px] font-black text-orange-800">
                    {summary.pending} task{summary.pending > 1 ? 's' : ''} remaining
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {!allDone
                  ? 'Complete today’s public service lessons before midnight to protect your progress and prevent XP decay.'
                  : 'You completed your daily lesson goal. Web notifications will remind you when tomorrow’s task drops.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 sm:pt-0">
            {notifStatus === 'granted' ? (
              <button
                type="button"
                onClick={handleTestNudge}
                disabled={notifSending}
                className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 border-orange-200 hover:bg-orange-100 text-orange-950 font-black cursor-pointer dark:border-orange-800/60 dark:text-orange-300 dark:hover:bg-orange-950/50"
                title="Trigger a Web Notification to test the streak nudge"
              >
                <BellRing size={14} className="text-orange-600" />
                <span>{notifSending ? 'Sending…' : 'Test Streak Nudge'}</span>
              </button>
            ) : notifStatus !== 'denied' ? (
              <button
                type="button"
                onClick={handleEnableNotifs}
                disabled={notifSending}
                className="btn btn-primary !py-1.5 !px-3.5 text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Bell size={14} />
                <span>{notifSending ? 'Enabling…' : 'Turn on Streak Alerts'}</span>
              </button>
            ) : (
              <span className="text-[11px] font-bold text-slate-500">
                Notifications blocked in browser
              </span>
            )}

            {!allDone && (
              <Link
                to="/quest"
                className="btn btn-good !py-1.5 !px-3.5 text-xs inline-flex items-center gap-1 shadow-xs"
              >
                <span>Practice Now</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {notifSuccess && (
          <p className="mt-2 text-xs font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 inline-block">
            {notifSuccess}
          </p>
        )}
      </motion.section>

      {/* Grace Period / Freeze Alert */}
      {u.isGracePeriod && (
        <motion.div
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card border-2 border-amber-300 bg-amber-50/90 dark:border-amber-700/60 dark:bg-amber-950/40 p-3.5 sm:p-4 text-amber-900 dark:text-amber-200 flex items-center gap-3 shadow-xs"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-sm text-amber-950 dark:text-amber-100">Streak Shield Active (Grace Period)</p>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mt-0.5">
              You missed yesterday, but your <strong>{u.streak}-day streak</strong> is protected! Complete any task today to save and increment it.
            </p>
          </div>
        </motion.div>
      )}

      {u.freezeUsedRecently && !u.isGracePeriod && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 dark:border-sky-800/60 dark:bg-sky-950/40 p-3 text-sky-900 dark:text-sky-200 flex items-center gap-2.5 text-xs sm:text-sm font-bold shadow-xs">
          <Snowflake size={18} className="text-sky-600 dark:text-sky-400 shrink-0" />
          <span>Your streak shield protected your streak recently! Keep practicing to reach 7 days and recharge your shield.</span>
        </div>
      )}

      {/* Level Progress Bar & Badges */}
      <section className="card p-4 sm:p-5 space-y-2.5 dark:bg-slate-800 dark:border-slate-700 dark:shadow-[0_4px_0_#0f172a]">
        <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 font-black text-brand-700 dark:text-brand-300">
            <Sparkles size={16} className="text-brand-500 dark:text-brand-400" />
            Level {u.level}
          </span>
          <span className="text-slate-500 dark:text-slate-400">{u.xpIntoLevel}/100 XP to Level {u.level + 1}</span>
        </div>
        <div
          className="h-3.5 overflow-hidden rounded-full bg-brand-100/90 dark:bg-slate-900 border border-brand-200/50 dark:border-slate-700/80"
          role="progressbar"
          aria-valuenow={u.xpIntoLevel}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${u.xpIntoLevel}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {u.badges.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {u.badges.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-1 text-xs font-black text-amber-800 shadow-2xs"
              >
                <Award size={13} className="text-amber-600 dark:text-amber-400" />
                {b.label}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Teacher Feedback Loop */}
      {data.feedbacks && data.feedbacks.length > 0 && (
        <section className="card border-2 border-emerald-200 bg-emerald-50/50 dark:border-emerald-700/60 dark:bg-emerald-950/30 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
              <MessageSquareQuote size={20} className="text-emerald-700 dark:text-emerald-400" />
              <span>Teacher Feedback</span>
              <span className="rounded-full bg-emerald-200 dark:bg-emerald-900/80 px-2 py-0.5 text-xs font-black text-emerald-800 dark:text-emerald-200">
                {data.feedbacks.length} new
              </span>
            </h2>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Recent reviews</span>
          </div>

          <div className="space-y-2">
            {data.feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="rounded-xl border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] font-black text-slate-500 dark:text-slate-400">
                  <span className="text-brand-700 dark:text-brand-300 uppercase tracking-wide">
                    {fb.topic} · {fb.taskTitle}
                  </span>
                  <span>{new Date(fb.reviewedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">“{fb.feedbackText}”</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Big Quest CTA Button */}
      {!allDone && (
        <div className="text-center pt-1">
          <Link
            to="/quest"
            className="btn btn-good w-full sm:w-auto sm:px-12 text-base sm:text-lg shadow-md"
          >
            <Play size={20} className="fill-white" />
            <span>Start Today's Quest</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      )}

      {/* Tasks List */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">Today's Tasks</h2>
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
            {summary.doneToday} of {summary.totalToday} completed
          </span>
        </div>

        {tasks.length === 0 && (
          <p className="card p-4 text-center font-bold text-slate-500 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700">
            No tasks yet. Your teacher will add some soon.
          </p>
        )}

        <div className="grid gap-2.5 sm:grid-cols-2">
          {tasks.map((raw) => {
            const t = localize(raw, lang);
            return (
              <div
                key={t.id}
                className={`card flex items-center gap-3 p-3 sm:p-3.5 transition hover:border-brand-300 dark:hover:border-brand-400 ${
                  t.done ? 'bg-slate-50/80 opacity-75 dark:bg-slate-800/50 dark:border-slate-800' : 'bg-white dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                <TopicBadge topic={t.topic} size="md" />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">{t.title}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t.topic} · {TYPE_LABEL[t.type]}
                  </p>
                </div>

                <div className="shrink-0">
                  {t.done ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black ${
                        t.result.correct
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/60'
                          : 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-300 dark:border dark:border-rose-800/60'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      {t.result.correct ? 'Done' : 'Tried'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/60 px-2.5 py-1 text-xs font-black">
                      <Zap size={12} className="fill-amber-500 text-amber-600 dark:text-amber-400" />
                      +{t.xp} XP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
