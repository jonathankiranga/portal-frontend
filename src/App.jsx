import React from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SchoolsPage from './pages/SchoolsPage.jsx';
import SchoolDetailPage from './pages/SchoolDetailPage.jsx';
import SetupSchoolPage from './pages/SetupSchoolPage.jsx';
import RevenuePage from './pages/RevenuePage.jsx';

function isAuthed() {
  return Boolean(sessionStorage.getItem('admin_token'));
}

function RequireAuth({ children }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
}

function Layout() {
  const location = useLocation();
  const hideNav = location.pathname === '/login';

  function logout() {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_email');
    window.location.hash = '#/login';
  }

  if (hideNav) return <Routes><Route path="/login" element={<LoginPage />} /></Routes>;

  return (
    <div className="min-h-screen">
      <header className="bg-white sticky top-0 z-50" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.08)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7B4F9B' }}>
              <span className="font-bold text-white text-sm">E</span>
            </div>
            <span className="font-bold">Admin Portal</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <NavLink to="/" end className={({ isActive }) => `px-3 py-2 rounded-lg ${isActive ? 'font-semibold' : ''}`} style={({ isActive }) => isActive ? { color: '#7B4F9B', backgroundColor: '#F4F0F6' } : { color: '#555' }}>
              Dashboard
            </NavLink>
            <NavLink to="/schools" className={({ isActive }) => `px-3 py-2 rounded-lg ${isActive ? 'font-semibold' : ''}`} style={({ isActive }) => isActive ? { color: '#7B4F9B', backgroundColor: '#F4F0F6' } : { color: '#555' }}>
              Schools
            </NavLink>
            <NavLink to="/revenue" className={({ isActive }) => `px-3 py-2 rounded-lg ${isActive ? 'font-semibold' : ''}`} style={({ isActive }) => isActive ? { color: '#7B4F9B', backgroundColor: '#F4F0F6' } : { color: '#555' }}>
              Revenue
            </NavLink>
            <button onClick={logout} className="px-3 py-2 rounded-lg" style={{ color: '#C62828' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/schools" element={<RequireAuth><SchoolsPage /></RequireAuth>} />
          <Route path="/schools/setup" element={<RequireAuth><SetupSchoolPage /></RequireAuth>} />
          <Route path="/schools/:schoolId" element={<RequireAuth><SchoolDetailPage /></RequireAuth>} />
          <Route path="/revenue" element={<RequireAuth><RevenuePage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <Layout />;
}