import { useState, useEffect } from 'react';
import { api, useMembers, useSettings, useReports, useApiMutation } from '../api/client.js';
import Modal from '../components/Modal.jsx';
import Avatar from '../components/Avatar.jsx';
import { fileToAvatarDataUrl } from '../lib/image.js';

// "Six Pastels" palette.
const COLORS = ['#cce8db', '#c1d4e3', '#beb4d6', '#fadae2', '#f8b3ca', '#cc97c1'];
const EMOJIS = ['🙂', '👩', '👨', '🧒', '👧', '👦', '👶', '🐶', '🐱'];

export default function FamilyPage() {
  return (
    <div className="grid" style={{ maxWidth: 775, margin: '0 auto' }}>
      <h1>Settings</h1>
      <FamilyNameCard />
      <MembersCard />
      <ReportsCard />
      <BackupRestoreCard />
    </div>
  );
}

function ReportsCard() {
  const { data: reports = [], isLoading, error } = useReports();
  const generate = useApiMutation(() => api.post('/reports'), ['reports']);
  const remove = useApiMutation(
    (filename) => api.del(`/reports/${encodeURIComponent(filename)}`),
    ['reports']
  );

  const deleteReport = (filename) => {
    if (window.confirm(`Delete ${filename}? This cannot be undone.`)) {
      remove.mutate(filename);
    }
  };

  return (
    <div className="card">
      <div className="row">
        <h2 style={{ margin: 0 }}>Reports</h2>
        <div className="spacer" />
        <button
          className="btn small"
          disabled={generate.isPending}
          onClick={() => generate.mutate()}
        >
          {generate.isPending ? 'Generating…' : 'Generate report now'}
        </button>
      </div>
      {generate.isError && (
        <p className="report-message error">The report could not be generated.</p>
      )}
      {generate.isSuccess && (
        <p className="report-message">Created {generate.data.filename}</p>
      )}
      {isLoading && <span className="muted">Loading reports…</span>}
      {error && <span className="muted">Reports could not be loaded.</span>}
      {reports.length > 0 && (
        <div className="report-list">
          {reports.map((report) => (
            <div className="report-row" key={report.filename}>
              <a
                className="report-link"
                href={`/api/reports/${encodeURIComponent(report.filename)}`}
                download
              >
                <span aria-hidden="true">📄</span>
                {report.filename}
              </a>
              <button
                className="btn danger small report-delete"
                disabled={remove.isPending && remove.variables === report.filename}
                onClick={() => deleteReport(report.filename)}
                aria-label={`Delete ${report.filename}`}
              >
                {remove.isPending && remove.variables === report.filename ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
      {remove.isError && (
        <p className="report-message error">The report could not be deleted.</p>
      )}
    </div>
  );
}

function BackupRestoreCard() {
  const [restoreState, setRestoreState] = useState({ status: 'idle', message: '' });

  const waitForRestart = async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        const response = await fetch('/api/health', { cache: 'no-store' });
        if (response.ok) {
          window.location.assign('/home');
          return;
        }
      } catch {
        // The expected restart window: keep polling until launchd brings it back.
      }
    }
    setRestoreState({
      status: 'error',
      message: 'The database was restored, but the server has not restarted yet.',
    });
  };

  const restoreDatabase = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm(
      `Restore Family Hub from ${file.name}? The current database will be backed up first.`
    )) return;

    setRestoreState({ status: 'working', message: 'Validating and restoring…' });
    try {
      const response = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.sqlite3' },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Restore failed');
      setRestoreState({ status: 'working', message: 'Restored. Restarting Family Hub…' });
      waitForRestart();
    } catch (error) {
      setRestoreState({ status: 'error', message: error.message });
    }
  };

  return (
    <div className="card">
      <div className="row backup-actions">
        <h2 style={{ margin: 0 }}>Backup/Restore</h2>
        <div className="spacer" />
        <a className="btn ghost small" href="/api/backups/database" download>
          Download backup
        </a>
        <label className="btn small" style={{ cursor: 'pointer' }}>
          Restore database
          <input
            type="file"
            accept=".sqlite,.sqlite3,.db,application/vnd.sqlite3,application/x-sqlite3"
            hidden
            disabled={restoreState.status === 'working'}
            onChange={restoreDatabase}
          />
        </label>
      </div>
      {restoreState.message && (
        <p className={`report-message${restoreState.status === 'error' ? ' error' : ''}`}>
          {restoreState.message}
        </p>
      )}
    </div>
  );
}

function FamilyNameCard() {
  const { data: settings } = useSettings();
  const [name, setName] = useState('');
  // Sync local input when the stored value loads/changes.
  useEffect(() => setName(settings?.family_name || ''), [settings?.family_name]);

  const save = useApiMutation((body) => api.patch('/settings', body), ['settings']);

  return (
    <div className="card">
      <div className="row">
        <h2 style={{ margin: 0 }}>Family name</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Smith"
          style={{ minWidth: 220 }}
        />
        <button
          className="btn"
          disabled={save.isPending}
          onClick={() => save.mutate({ family_name: name.trim() })}
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function MembersCard() {
  const { data: members = [] } = useMembers();
  const [editing, setEditing] = useState(null); // member object or {} for new

  return (
    <div className="card">
      <div className="row">
        <h2 style={{ margin: 0 }}>Members</h2>
        <div className="spacer" />
        <button className="btn small" onClick={() => setEditing({})}>
          + Add member
        </button>
      </div>
      <div className="row members-list" style={{ marginTop: 18, gap: 24 }}>
        {members.length === 0 && <span className="muted">No members yet.</span>}
        {members.map((m) => (
          <button
            className="member-editor"
            key={m.id}
            onClick={() => setEditing(m)}
            title={`Edit ${m.name}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                padding: 3,
                borderRadius: '50%',
                border: `3px solid ${m.color}`,
                display: 'inline-flex',
              }}
            >
              <Avatar member={m} size={112} />
            </span>
            <span style={{ fontWeight: 600 }}>{m.name}</span>
          </button>
        ))}
      </div>
      {editing && <MemberModal member={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function MemberModal({ member, onClose }) {
  const isNew = !member.id;
  const [name, setName] = useState(member.name || '');
  const [color, setColor] = useState(member.color || COLORS[2]);
  const [emoji, setEmoji] = useState(member.emoji || EMOJIS[0]);
  const [avatar, setAvatar] = useState(member.avatar || null);
  const [allowance, setAllowance] = useState(
    member.weekly_allowance_cents == null ? '' : (member.weekly_allowance_cents / 100).toFixed(2)
  );

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatar(await fileToAvatarDataUrl(file));
    } catch (err) {
      alert(err.message);
    }
    e.target.value = ''; // allow re-selecting the same file
  };

  const save = useApiMutation(
    (body) => (isNew ? api.post('/members', body) : api.patch(`/members/${member.id}`, body)),
    ['members', 'progress']
  );
  const remove = useApiMutation(() => api.del(`/members/${member.id}`), [
    'members',
    'progress',
    'chores',
    'routines',
  ]);

  return (
    <Modal
      title={isNew ? 'Add member' : 'Edit member'}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button
              className="btn danger"
              onClick={() => remove.mutate(undefined, { onSuccess: onClose })}
            >
              Delete
            </button>
          )}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn"
            disabled={!name.trim()}
            onClick={() => save.mutate({
              name,
              color,
              emoji,
              avatar,
              weekly_allowance_cents: allowance === '' ? null : Math.round(Number(allowance) * 100),
            }, { onSuccess: onClose })}
          >
            Save
          </button>
        </>
      }
    >
      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label>Full weekly allowance</label>
        <input
          type="number"
          min="0"
          step="0.10"
          value={allowance}
          onChange={(e) => setAllowance(e.target.value)}
          placeholder="0.00"
        />
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
          The amount earned for 1,000 points. Leave blank to exclude this member from reports.
        </p>
      </div>
      <div className="field">
        <label>Photo</label>
        <div className="row">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--panel-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            {avatar ? (
              <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              emoji
            )}
          </div>
          <label className="btn ghost small" style={{ cursor: 'pointer' }}>
            {avatar ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/*" hidden onChange={handleFile} />
          </label>
          {avatar && (
            <button className="btn ghost small" onClick={() => setAvatar(null)}>
              Remove
            </button>
          )}
        </div>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
          A photo replaces the emoji.
        </p>
      </div>
      <div className="field">
        <label>Color</label>
        <div className="row">
          {COLORS.map((c) => (
            <span
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: c,
                cursor: 'pointer',
                outline: color === c ? '2px solid var(--text)' : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>
      <div className="field">
        <label>Emoji</label>
        <div className="row">
          {EMOJIS.map((e) => (
            <span
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                fontSize: 22,
                cursor: 'pointer',
                padding: 4,
                borderRadius: 8,
                background: emoji === e ? 'var(--panel-2)' : 'transparent',
              }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </Modal>
  );
}
