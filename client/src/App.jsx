import { Link, NavLink, Route, Routes, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import FamilyPage from './pages/FamilyPage.jsx';
import { useSettings, useMembers } from './api/client.js';
import { pluralizeFamily } from './lib/familyName.js';
import Avatar from './components/Avatar.jsx';

export default function App() {
  const { data: settings } = useSettings();
  // One tab per person, so adding someone in Settings gives them a tab — no
  // hardcoded Everett/Beau to fall out of step with the family.
  const { data: members = [] } = useMembers();
  const brand = pluralizeFamily(settings?.family_name) || 'Family Hub';

  return (
    <div className="app">
      <header className="topbar">
        {/* The family name doubles as the home link, the usual place people
            click to get back to a hub page. */}
        <Link to="/home" className="brand" title="Family home">
          {brand}
        </Link>
        <nav className="nav">
          {/* `end` matters: without it /tasks/3 would light up Overview too. */}
          <NavLink to="/tasks" end className={({ isActive }) => (isActive ? 'active' : '')}>
            ✅ Overview
          </NavLink>
          {members.map((m) => (
            <NavLink
              key={m.id}
              to={`/tasks/${m.id}`}
              className={({ isActive }) => `tab-member${isActive ? ' active' : ''}`}
            >
              <Avatar member={m} size={24} />
              {m.name}
            </NavLink>
          ))}
        </nav>
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
