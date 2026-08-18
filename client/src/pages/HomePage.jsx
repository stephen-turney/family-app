import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useMembers, useProgress, localDate } from '../api/client.js';
import Avatar from '../components/Avatar.jsx';

// Landing page reached by clicking the family name in the header: one big photo
// per member, tapping through to that person's daily checklist.
export default function HomePage() {
  // Read per render, not once at module load. This heading is now the only place
  // the date shows (the topbar's copy was removed), so a stale one would be the
  // page claiming to be a day it isn't — and the tile counts have to agree with it.
  const today = localDate();
  const { data: members = [], isLoading } = useMembers();
  const { data: progress } = useProgress(today, today);

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
        <h1>{format(new Date(), 'EEEE, MMMM d')}</h1>
        <p className="muted">Tap a photo to open that person's daily checklist.</p>
      </div>

      <div className="home-grid">
        {members.map((m) => {
          const stat = statFor(m.id);
          const hasTasks = stat && stat.expected > 0;
          return (
            <Link key={m.id} to={`/tasks/${m.id}`} className="home-tile">
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
                    <span style={{ width: `${stat.percent}%`, background: m.color }} />
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {stat.completed}/{stat.expected} done
                    {stat.points > 0 && ` · ⭐ ${stat.points}`}
                  </span>
                </>
              ) : (
                <span className="muted" style={{ fontSize: 13 }}>Nothing due today</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
