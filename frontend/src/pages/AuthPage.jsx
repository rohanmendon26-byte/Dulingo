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

  const demo = async (email) => {
    setErr(''); setBusy(true);
    try {
      const u = await login('/auth/login', { email, password: 'demo1234' });
      nav(u.role === 'teacher' ? '/teacher' : '/dashboard');
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
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

        {!isReg && (
          <div className="card mt-5 p-4 text-center">
            <p className="mb-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Quick Test Demo Accounts
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                onClick={() => demo('ramesh@dulingo.in')}
              >
                <User size={13} className="text-brand-600" />
                <span>Demo learner</span>
              </button>
              <button
                className="btn btn-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                onClick={() => demo('teacher@dulingo.in')}
              >
                <School size={13} className="text-brand-600" />
                <span>Demo teacher</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
