import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Loading, Shell } from './components.jsx';
import Landing from './pages/Landing.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Quest from './pages/Quest.jsx';
import Stories from './pages/Stories.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Teacher from './pages/Teacher.jsx';
import SeniorHub from './pages/SeniorHub.jsx';

const getDefaultRoute = (role) => {
  if (role === 'teacher') return '/teacher';
  if (role === 'senior') return '/senior';
  return '/dashboard';
};

function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Shell><Loading /></Shell>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={getDefaultRoute(user.role)} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/dashboard" element={<Guard role="student"><Shell><Dashboard /></Shell></Guard>} />
      <Route path="/senior" element={<Guard role="senior"><Shell><SeniorHub /></Shell></Guard>} />
      <Route path="/quest" element={<Guard role="student"><Shell><Quest /></Shell></Guard>} />
      <Route path="/stories" element={<Guard><Shell><Stories /></Shell></Guard>} />
      <Route path="/leaderboard" element={<Guard><Shell><Leaderboard /></Shell></Guard>} />
      <Route path="/teacher" element={<Guard role="teacher"><Shell><Teacher /></Shell></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
