import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Loading, Shell } from './components.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Quest = lazy(() => import('./pages/Quest.jsx'));
const Stories = lazy(() => import('./pages/Stories.jsx'));
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'));
const Teacher = lazy(() => import('./pages/Teacher.jsx'));

function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Shell><Loading /></Shell>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/dashboard'} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<Shell><Loading /></Shell>}>
      <Routes>
        <Route path="/" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/dashboard'} replace /> : <Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard" element={<Guard role="student"><Shell><Dashboard /></Shell></Guard>} />
        <Route path="/quest" element={<Guard role="student"><Shell><Quest /></Shell></Guard>} />
        <Route path="/stories" element={<Guard><Shell><Stories /></Shell></Guard>} />
        <Route path="/leaderboard" element={<Guard><Shell><Leaderboard /></Shell></Guard>} />
        <Route path="/teacher" element={<Guard role="teacher"><Shell><Teacher /></Shell></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
