import { useEffect } from 'react';
import { Link, NavLink, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import FamilyPage from './pages/FamilyPage.jsx';
import { useSettings } from './api/client.js';
import { pluralizeFamily } from './lib/familyName.js';

export default function App() {
  const { data: settings } = useSettings();
  const brand = pluralizeFamily(settings?.family_name) || 'Family Hub';
  const navigate = useNavigate();

  // This is a shared wall tablet, so abandon whichever detail/settings page was
  // left open after 90 seconds without a touch, click, keypress, or scroll.
  useEffect(() => {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => navigate('/home', { replace: true }), 90_000);
    };
    const events = ['touchstart', 'mousedown', 'keydown', 'scroll'];
    events.forEach((event) => document.addEventListener(event, reset, true));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => document.removeEventListener(event, reset, true));
    };
  }, [navigate]);

  return (
    <div className="app">
      <header className="topbar">
        {/* The family name doubles as the home link, the usual place people
            click to get back to a hub page. */}
        <Link to="/home" className="brand" title="Family home">
          <span className="brand-pumpkin" aria-hidden="true">🎃</span>
          {brand}
        </Link>
        <nav className="nav">
          {/* `end` matters: without it /tasks/3 would light up Overview too. */}
          <NavLink to="/tasks" end className={({ isActive }) => (isActive ? 'active' : '')}>
            ✅ Overview
          </NavLink>
        </nav>
        <span className="season-label"><span aria-hidden="true">✦</span> Spooky season</span>
        {/* Icon only, hard right, in the space the date used to hold. */}
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-gear${isActive ? ' active' : ''}`}
          title="Settings"
          aria-label="Settings"
        >
          ⚙️
        </NavLink>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          {/* Same page, narrowed to one person (linked from the home tiles) */}
          <Route path="/tasks/:memberId" element={<TasksPage />} />
          <Route path="/settings" element={<FamilyPage />} />
          {/* Keep the old path working for anyone with it bookmarked */}
          <Route path="/family" element={<Navigate to="/settings" replace />} />
          {/* Anything else — including the removed /calendar — lands on home
              rather than an empty page. */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}
