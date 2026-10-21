import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ArrowLeft,
  Headphones,
  CheckCircle2,
  Zap,
  Turtle,
  Sparkles,
  Award,
  Trash2,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Confetti, Loading, SpeakerButton, TopicBadge, TopicIcon, localize } from '../components.jsx';
import { useSpeech } from '../speech.js';

function Reader({ story: raw, onBack, onDone, onDelete }) {
  const { user, setUser, lang } = useAuth();
  const speech = useSpeech(lang);
  const story = localize(raw, lang);
  const paras = useMemo(() => story.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean), [story]);
  const [active, setActive] = useState(-1);
  const [reward, setReward] = useState(null);

  // read paragraph by paragraph (or entire audio if audioUrl is provided)
  const playFrom = (idx) => {
    if (story.audioUrl) {
      setActive(0);
      speech.speak(story.text, {
        audioUrl: story.audioUrl,
        onEnd: () => {
          setActive(-1);
          if (user.role === 'student' && !raw.read) {
            api(`/stories/${raw.id}/complete`, { method: 'POST' }).then((r) => {
              setUser(r.user); setReward(r); onDone(raw.id);
            }).catch(() => {});
          }
        },
      });
      return;
    }

    if (idx >= paras.length) {
      setActive(-1);
      if (user.role === 'student' && !raw.read) {
        api(`/stories/${raw.id}/complete`, { method: 'POST' }).then((r) => {
          setUser(r.user); setReward(r); onDone(raw.id);
        }).catch(() => {});
      }
      return;
    }
    setActive(idx);
    speech.speak(paras[idx], { onEnd: () => playFrom(idx + 1) });
  };
  const toggle = () => {
    if (speech.speaking || active >= 0) { speech.stop(); setActive(-1); } else playFrom(0);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Confetti show={!!reward?.xpEarned} />
      <div className="flex items-center justify-between gap-2">
        <button
          className="btn btn-ghost !py-1.5 !px-3 text-sm inline-flex items-center gap-1.5"
          onClick={() => { speech.stop(); onBack(); }}
        >
          <ArrowLeft size={16} /> All stories
        </button>

        {user?.role === 'teacher' && (
          <button
            type="button"
            className="btn btn-ghost !py-1.5 !px-3 text-xs sm:text-sm text-rose-600 border border-rose-200 hover:bg-rose-50 inline-flex items-center gap-1.5"
            onClick={(e) => {
              speech.stop();
              onDelete?.(e, raw.id, raw.title);
            }}
          >
            <Trash2 size={15} /> Delete story
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <TopicBadge topic={story.topic} size="sm" />
        <span className="text-xs font-black uppercase tracking-wider text-brand-700">{story.topic}</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{story.title}</h1>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <SpeakerButton speaking={speech.speaking || active >= 0} onClick={toggle} label="Listen to the story" />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-black text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded accent-brand-600"
              checked={speech.slow}
              onChange={(e) => speech.setSlow(e.target.checked)}
            />
            <Turtle size={16} className="text-amber-600" />
            <span>Slow pace</span>
          </label>

          {story.audioUrl && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-300">
              <Headphones size={13} /> Studio Audio
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {paras.map((p, k) => (
          <p
            key={k}
            className={`rounded-2xl p-4 text-base sm:text-lg font-semibold leading-relaxed transition ${
              active === k
                ? 'bg-amber-100 ring-4 ring-amber-300 text-slate-900 dark:bg-amber-950/80 dark:ring-amber-500/80 dark:text-amber-100'
                : 'bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:border dark:border-slate-800 shadow-xs'
            }`}
          >
            {p}
          </p>
        ))}
      </div>

      {reward?.xpEarned > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-2xl bg-emerald-100 p-4 text-center font-black text-emerald-800 flex items-center justify-center gap-2"
        >
          <Award size={24} className="text-emerald-700" />
          <span className="text-lg">Story finished! +{reward.xpEarned} XP</span>
        </motion.div>
      )}

      {raw.read && !reward && (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-slate-500">
          <CheckCircle2 size={16} /> You have already earned XP for this story.
        </p>
      )}
    </div>
  );
}

export default function Stories() {
  const { user, lang } = useAuth();
  const [stories, setStories] = useState(null);
  const [open, setOpen] = useState(null);

  const loadStories = () => {
    api('/stories').then((d) => setStories(d.stories || []));
  };

  useEffect(() => {
    loadStories();
  }, []);

  const deleteStory = async (e, storyId, title) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the audio story "${title || 'Untitled'}"? Learners will no longer be able to listen to it.`)) {
      return;
    }
    try {
      await api(`/stories/${storyId}`, { method: 'DELETE' });
      setStories((prev) => (prev ? prev.filter((x) => x.id !== storyId) : []));
      if (open?.id === storyId) {
        setOpen(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete audio story');
    }
  };

  if (!stories) return <Loading />;

  if (open) {
    return (
      <Reader
        story={open}
        onBack={() => setOpen(null)}
        onDone={(id) => setStories((s) => s.map((x) => (x.id === id ? { ...x, read: true } : x)))}
        onDelete={deleteStory}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Audio stories</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            Real-life walk-throughs of public services. Press listen, then earn XP when the story ends.
          </p>
        </div>
      </div>

      {stories.length === 0 && (
        <p className="card p-5 font-bold text-slate-500">No stories yet.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {stories.map((raw) => {
          const s = localize(raw, lang);
          return (
            <div
              key={s.id}
              onClick={() => setOpen(raw)}
              className="card flex items-center justify-between gap-3.5 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <TopicBadge topic={s.topic} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-base font-black text-slate-900">{s.title}</p>
                    {s.audioUrl && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-300 shrink-0">
                        <Headphones size={11} /> Audio
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-500">{s.topic}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${
                    s.read ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {s.read ? (
                    <>
                      <CheckCircle2 size={13} /> Done
                    </>
                  ) : (
                    <>
                      <Zap size={13} /> +{s.xp} XP
                    </>
                  )}
                </span>

                {user?.role === 'teacher' && (
                  <button
                    type="button"
                    title="Delete audio story"
                    onClick={(e) => deleteStory(e, s.id, s.title)}
                    className="rounded-xl p-2 text-rose-500 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/60 transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
