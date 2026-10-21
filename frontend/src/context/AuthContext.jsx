import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, setRefreshToken } from '../services/api.js';

const CACHE_USER_KEY = 'dulingo_cached_user';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => !!getToken() && !user);
  const [lang, setLang] = useState(() => localStorage.getItem('dulingo_lang') || 'en');
  const [large, setLarge] = useState(() => localStorage.getItem('dulingo_large') === '1');
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('dulingo_dark');
    if (saved !== null) return saved === '1';
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('dulingo_lang', lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('large', large);
    localStorage.setItem('dulingo_large', large ? '1' : '0');
  }, [large]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('dulingo_dark', dark ? '1' : '0');
  }, [dark]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(CACHE_USER_KEY, JSON.stringify(user));
    }
  }, [user]);

  // Handle global session expiry (when refresh token expires or is revoked)
  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem(CACHE_USER_KEY);
      setUser(null);
    };
    window.addEventListener('dulingo_session_expired', handleExpired);
    return () => window.removeEventListener('dulingo_session_expired', handleExpired);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    api('/me')
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch((err) => {
        const isAuthError =
          err.message?.toLowerCase().includes('token') ||
          err.message?.toLowerCase().includes('unauthorized') ||
          err.message?.toLowerCase().includes('forbidden');

        if (isAuthError) {
          setToken(null);
          setRefreshToken(null);
          localStorage.removeItem(CACHE_USER_KEY);
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (path, body) => {
    const d = await api(path, { method: 'POST', body });
    setToken(d.token);
    if (d.refreshToken) setRefreshToken(d.refreshToken);
    setUser(d.user);
    if (d.user) {
      localStorage.setItem(CACHE_USER_KEY, JSON.stringify(d.user));
    }
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {}
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem(CACHE_USER_KEY);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, setUser, loading, login, logout, large, setLarge, lang, setLang, dark, setDark }}>
      {children}
    </Ctx.Provider>
  );
}
