import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Pin,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api.js';

const CATEGORY_STYLES = {
  urgent: {
    label: 'Urgent',
    icon: AlertTriangle,
    bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:border-rose-700/80 dark:text-rose-300',
  },
  civic_alert: {
    label: 'Civic Alert',
    icon: AlertTriangle,
    bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:border-amber-700/80 dark:text-amber-300',
  },
  assignment: {
    label: 'Assignment',
    icon: BookOpen,
    bg: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/70 dark:border-indigo-700/80 dark:text-indigo-300',
  },
  tip: {
    label: 'Study Tip',
    icon: Lightbulb,
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:border-emerald-700/80 dark:text-emerald-300',
  },
  general: {
    label: 'Announcement',
    icon: Megaphone,
    bg: 'bg-brand-100 text-brand-800 border-brand-300 dark:bg-brand-950/70 dark:border-brand-700/80 dark:text-brand-300',
  },
};

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function AnnouncementsFeed({ isTeacher = false }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dulingo_read_announcements') || '[]');
    } catch {
      return [];
    }
  });

  const fetchAnnouncements = async () => {
    try {
      const data = await api('/announcements');
      setAnnouncements(data.announcements || []);
    } catch (e) {
      console.warn('Could not fetch announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const markAllRead = () => {
    const allIds = announcements.map((a) => a.id);
    setReadIds(allIds);
    localStorage.setItem('dulingo_read_announcements', JSON.stringify(allIds));
  };

  const unreadCount = announcements.filter((a) => !readIds.includes(a.id)).length;

  if (loading && announcements.length === 0) return null;
  if (!loading && announcements.length === 0) return null;

  const displayList = expanded ? announcements : announcements.slice(0, 1);

  return (
    <section className="card border-2 border-brand-200 bg-gradient-to-br from-brand-50/70 via-white to-indigo-50/50 p-4 sm:p-5 dark:border-slate-700 dark:bg-black space-y-3 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100/80 pb-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white shadow-2xs">
            <Megaphone size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                Classroom Announcements
              </h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Live updates from your teachers & civic instructors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-[11px] font-black text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200 transition cursor-pointer"
              title="Mark all as read"
            >
              <CheckCircle size={12} />
              <span>Mark read</span>
            </button>
          )}

          {announcements.length > 1 && (
            <button
              onClick={() => {
                setExpanded(!expanded);
                if (!expanded) markAllRead();
              }}
              className="btn btn-ghost !py-1 !px-2.5 text-xs font-black inline-flex items-center gap-1 border border-brand-200 dark:border-slate-700 hover:bg-brand-100/60 dark:hover:bg-slate-800"
            >
              <span>{expanded ? 'Show less' : `View all (${announcements.length})`}</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {displayList.map((a) => {
            const cat = CATEGORY_STYLES[a.category] || CATEGORY_STYLES.general;
            const Icon = cat.icon;
            const isUnread = !readIds.includes(a.id);

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-xl border p-3 sm:p-3.5 transition-all space-y-1.5 ${
                  a.pinned
                    ? 'border-amber-300 bg-amber-50/50 dark:border-amber-700/60 dark:bg-amber-950/20 shadow-2xs'
                    : 'border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:border-amber-700 dark:text-amber-300">
                        <Pin size={10} className="fill-amber-600" /> Pinned
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold border ${cat.bg}`}
                    >
                      <Icon size={11} /> {cat.label}
                    </span>

                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Unread notice" />
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Clock size={11} />
                    <span>{formatTimeAgo(a.createdAt)}</span>
                    <span className="opacity-40">·</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{a.authorName}</span>
                  </div>
                </div>

                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                  {a.title}
                </h3>

                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {a.content}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
