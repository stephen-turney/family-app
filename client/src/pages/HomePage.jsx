import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useMembers, useProgress, localDate } from '../api/client.js';
import Avatar from '../components/Avatar.jsx';

function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function shiftDate(iso, days) {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

// Landing page reached by clicking the family name in the header: one big photo
// per member, tapping through to that person's daily checklist.
export default function HomePage() {
  // Read per render, not once at module load. This heading is now the only place
  // the date shows (the topbar's copy was removed), so a stale one would be the
  // page claiming to be a day it isn't — and the tile counts have to agree with it.
  const today = localDate();
  const [searchParams] = useSearchParams();
  const requestedDate = searchParams.get('date');
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '') ? requestedDate : today;
  const [date, setDate] = useState(initialDate);
  const { data: members = [], isLoading } = useMembers();
  const { data: progress } = useProgress(date, date);

  const statFor = (id) => progress?.members.find((m) => m.member_id === id);

  if (isLoading) return <p className="muted">Loading…</p>;

  if (members.length === 0) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <h2>No family members yet</h2>
        <p className="muted">Add everyone on the Settings page and they'll show up here.</p>
        <Link className="btn" to="/settings" style={{ display: 'inline-block', marginTop: 8 }}>
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="home-head">
        <div className="checklist-daynav-wrap">
          <div className="checklist-daynav">
            <button
              className="daynav-btn previous"
              onClick={() => setDate(shiftDate(date, -1))}
              aria-label="Previous day"
              title="Previous day"
            >
              <svg className="daynav-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="daynav-date">
              {format(parseLocalDate(date), 'EEEE, MMMM d')}
            </h1>
            <button
              className="daynav-btn next"
              onClick={() => setDate(shiftDate(date, 1))}
              aria-label="Next day"
              title="Next day"
            >
              <svg className="daynav-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <div className="daynav-tag-slot">
            {date === today ? (
              <span className="daynav-tag">Today</span>
            ) : (
              <button className="btn ghost small daynav-jump" onClick={() => setDate(today)}>
                Jump to today
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="home-grid">
        {members.map((m) => {
          const stat = statFor(m.id);
          const hasTasks = stat && stat.expected > 0;
          const points = Math.min(stat?.points || 0, 200);
          return (
            <Link key={m.id} to={`/tasks/${m.id}?date=${date}`} className="home-tile">
              <span
                className="home-avatar"
                style={{ background: `${m.color}59`, borderColor: m.color }}
              >
                <Avatar member={m} size={200} />
              </span>

              <strong className="home-name">{m.name}</strong>

              {hasTasks ? (
                <>
                  <div className="progress">
                    <span style={{ width: `${Math.round(points / 2)}%`, background: m.color }} />
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {points}/200 points
                  </span>
                </>
              ) : (
                <span className="muted" style={{ fontSize: 13 }}>
                  Nothing due {date === today ? 'today' : format(parseLocalDate(date), 'EEEE')}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
