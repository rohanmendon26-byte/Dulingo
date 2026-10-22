import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, School, LogIn, UserPlus, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { Octo, Shell } from '../components.jsx';

export default function AuthPage({ mode }) {
  const isReg = mode === 'register';
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'student' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const u = await login(isReg ? '/auth/register' : '/auth/login', f);
      nav(u.role === 'teacher' ? '/teacher' : '/dashboard');
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  const demo = async (emailOrRole) => {
    setErr('');
    setBusy(true);
    try {
      const isTeacher = emailOrRole === 'teacher@dulingo.in' || emailOrRole === 'teacher';
      const email = isTeacher ? 'teacher@dulingo.in' : 'ramesh@dulingo.in';
      const role = isTeacher ? 'teacher' : 'student';

      let u;
      try {
        u = await login('/auth/login', { email, password: 'demo1234' });
      } catch (firstErr) {
        // Fallback to dedicated /auth/demo-login if standard login has an issue
        u = await login('/auth/demo-login', { email, role });
      }

      nav(u.role === 'teacher' ? '/teacher' : '/dashboard');
    } catch (x) {
      setErr(x.message || 'Demo login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-md py-4">
        <div className="flex justify-center mb-1">
          <Octo size={100} />
        </div>
        <h1 className="mb-4 text-center text-2xl sm:text-3xl font-black text-slate-900">
          {isReg ? 'Create your account' : 'Welcome back!'}
        </h1>
        <form onSubmit={submit} className="card space-y-3.5 p-5 sm:p-6 shadow-sm">
          {isReg && (
            <label className="block text-xs sm:text-sm font-extrabold text-slate-700">
              Your name
              <input
                className="input mt-1"
                placeholder="e.g. Ramesh Kumar"
                value={f.name}
                onChange={set('name')}
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className="block text-xs sm:text-sm font-extrabold text-slate-700">
            Email address
            <input
              className="input mt-1"
              type="email"
              placeholder="e.g. ramesh@example.com"
              value={f.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </label>

          <label className="block text-xs sm:text-sm font-extrabold text-slate-700">
            Password
            <input
              className="input mt-1"
              type="password"
              placeholder="••••••••"
              value={f.password}
              onChange={set('password')}
              required
              minLength={6}
              autoComplete={isReg ? 'new-password' : 'current-password'}
            />
          </label>

          {isReg && (
            <fieldset>
              <legend className="text-xs sm:text-sm font-extrabold text-slate-700 mb-1">I am a</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['student', 'Learner', GraduationCap],
                  ['teacher', 'Teacher', School],
                ].map(([v, l, IconComp]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setF({ ...f, role: v })}
                    aria-pressed={f.role === v}
                    className={`option text-center !py-2.5 !text-xs sm:!text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                      f.role === v ? 'selected' : ''
                    }`}
                  >
                    <IconComp size={16} />
                    <span>{l}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {err && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs sm:text-sm font-bold text-rose-600"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <button
            className="btn btn-primary w-full text-base font-black inline-flex items-center justify-center gap-2 cursor-pointer"
            disabled={busy}
          >
            {isReg ? <UserPlus size={18} /> : <LogIn size={18} />}
            <span>{busy ? 'Please wait…' : isReg ? 'Create account' : 'Log in'}</span>
          </button>
        </form>

        <p className="mt-4 text-center text-xs sm:text-sm font-bold text-slate-600">
          {isReg ? (
            <>
              Already have an account?{' '}
              <Link className="text-brand-700 underline font-extrabold" to="/login">
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{' '}
              <Link className="text-brand-700 underline font-extrabold" to="/register">
                Create an account
              </Link>
            </>
          )}
        </p>

        <div className="card mt-5 p-4 sm:p-5 text-center border-2 border-brand-200 dark:border-brand-800/60 bg-brand-50/40 dark:bg-brand-950/30">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs font-black text-brand-900 dark:text-brand-300 uppercase tracking-wider">
              Judge & Reviewer Quick Access
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3.5">
            Click below for instant 1-click login without typing passwords:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              className="btn bg-white dark:bg-slate-900 border-2 border-brand-300 hover:border-brand-500 dark:border-brand-700 !py-2.5 !px-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer text-slate-800 dark:text-slate-100 transition hover:-translate-y-0.5"
              onClick={() => demo('ramesh@dulingo.in')}
              disabled={busy}
            >
              <User size={16} className="text-brand-600 dark:text-brand-400 shrink-0" />
              <div className="text-left min-w-0">
                <span className="block font-black text-xs sm:text-sm">Demo Learner</span>
                <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  ramesh@dulingo.in
                </span>
              </div>
            </button>
            <button
              type="button"
              className="btn bg-white dark:bg-slate-900 border-2 border-purple-300 hover:border-purple-500 dark:border-purple-700 !py-2.5 !px-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer text-slate-800 dark:text-slate-100 transition hover:-translate-y-0.5"
              onClick={() => demo('teacher@dulingo.in')}
              disabled={busy}
            >
              <School size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="text-left min-w-0">
                <span className="block font-black text-xs sm:text-sm">Demo Teacher</span>
                <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  teacher@dulingo.in
                </span>
              </div>
            </button>
          </div>
          <div className="mt-3 pt-2.5 border-t border-brand-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>Password for both:</span>
            <code className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-brand-700 dark:text-brand-400 font-black">
              demo1234
            </code>
          </div>
        </div>
      </div>
    </Shell>
  );
}
