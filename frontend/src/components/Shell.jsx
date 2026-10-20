import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Trophy,
  GraduationCap,
  Globe,
  LogOut,
  Check,
  ChevronDown,
  Wifi,
  WifiOff,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/index.js';
import { useOnlineStatus } from '../hooks/index.js';
import { LANGS } from '../constants/index.js';
import { Octo } from './Mascot.jsx';
import { OfflineSyncBanner } from './OfflineSyncBanner.jsx';

/* ---------- Main Layout / Navigation Shell ---------- */
export function Shell({ children }) {
  const { user, logout, large, setLarge, lang, setLang, dark, setDark } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const isQuest = location.pathname === '/quest';
  const { online, synced } = useOnlineStatus();

  const links =
    user?.role === 'teacher'
      ? [
          { to: '/teacher', label: 'Teacher Hub', icon: GraduationCap },
          { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        ]
      : [
          { to: '/dashboard', label: 'Learn', icon: Home },
          { to: '/stories', label: 'Stories', icon: BookOpen },
          { to: '/leaderboard', label: 'Ranks', icon: Trophy },
        ];

  const cls = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-black transition ${
      isActive
        ? 'bg-brand-100 text-brand-800 shadow-2xs dark:bg-brand-900/50 dark:text-brand-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
    }`;

  return (
    <div className="min-h-screen pb-24 md:pb-10 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md shadow-2xs dark:bg-slate-900/90 dark:border-slate-700/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6">
          <Link
            to={user ? (user.role === 'teacher' ? '/teacher' : '/dashboard') : '/'}
            className="flex items-center gap-2.5 transition hover:opacity-90"
          >
            <Octo size={36} />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-brand-700">Dulingo</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1.5 md:flex" aria-label="Main">
            {user &&
              links.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={cls}>
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Offline / Synced Connectivity Badge */}
            {!online && (
              <span
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800 shadow-2xs animate-pulse"
                title="Offline Mode: You can practise cached tasks"
              >
                <WifiOff size={13} className="text-amber-600" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
            {synced && (
              <span
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-800 shadow-2xs"
                title="Progress synced"
              >
                <Wifi size={13} className="text-emerald-600" />
                <span className="hidden sm:inline">Synced</span>
              </span>
            )}

            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe size={15} className="pointer-events-none absolute left-2.5 text-brand-600" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Language of lessons and audio"
                className="appearance-none rounded-xl border border-brand-200 bg-brand-50/60 pl-7 pr-6 py-1.5 text-xs sm:text-sm font-black text-brand-800 outline-none transition hover:bg-brand-100 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-brand-300"
              >
                {Object.entries(LANGS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 text-brand-600" />
            </div>

            {/* Accessibility: Font size toggle */}
            <button
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              onClick={() => setLarge(!large)}
              aria-pressed={large}
              title="Toggle larger readable text size"
            >
              <span className="text-sm font-extrabold">Aa</span>
              {large && <Check size={12} className="text-emerald-600 stroke-[3]" />}
            </button>

            {/* Dark mode toggle */}
            <button
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              onClick={() => setDark(!dark)}
              aria-pressed={dark}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? (
                <Sun size={15} className="text-amber-400 fill-amber-400 shrink-0" />
              ) : (
                <Moon size={15} className="text-brand-600 fill-brand-100 shrink-0" />
              )}
              <span className="hidden sm:inline font-bold">{dark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Logout */}
            {user && (
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                onClick={() => {
                  logout();
                  nav('/');
                }}
                title="Log out of account"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <OfflineSyncBanner />

      <main className="mx-auto max-w-5xl px-3.5 py-4 sm:px-6 sm:py-6">{children}</main>

      {/* Mobile Bottom Navigation Bar */}
      {user && !isQuest && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 py-1.5 backdrop-blur-md shadow-lg md:hidden dark:bg-slate-900/95 dark:border-slate-700/70"
          aria-label="Mobile Navigation"
        >
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center rounded-xl py-1 text-[11px] font-black transition ${
                  isActive
                    ? 'bg-brand-100/80 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon size={19} className="mb-0.5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
