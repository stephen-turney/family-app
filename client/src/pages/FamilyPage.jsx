import { useState, useEffect } from 'react';
import { api, useMembers, useSettings, useApiMutation } from '../api/client.js';
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
      <div className="row" style={{ marginTop: 18, gap: 24 }}>
        {members.length === 0 && <span className="muted">No members yet.</span>}
        {members.map((m) => (
          <button
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
            onClick={() => save.mutate({ name, color, emoji, avatar }, { onSuccess: onClose })}
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

