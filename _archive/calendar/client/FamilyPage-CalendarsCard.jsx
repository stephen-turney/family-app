// Removed from client/src/pages/FamilyPage.jsx when the calendar feature was stripped
// (2026-08-15). Needs useCalendars from api/client.js and the COLORS array from that page.

function CalendarsCard() {
  const { data: calendars = [] } = useCalendars();
  const { data: members = [] } = useMembers();
  const [editing, setEditing] = useState(null);
  const sync = useApiMutation((id) => api.post(`/calendars/${id}/sync`), ['calendars', 'events']);

  return (
    <div className="card">
      <div className="row">
        <h2>Calendars</h2>
        <div className="spacer" />
        <button className="btn small" onClick={() => setEditing({})}>
          + Add calendar
        </button>
      </div>
      <div className="grid" style={{ marginTop: 12 }}>
        {calendars.length === 0 && <span className="muted">No calendars yet.</span>}
        {calendars.map((c) => {
          const owner = members.find((m) => m.id === c.member_id);
          return (
            <div key={c.id} className="row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <span className="swatch" style={{ width: 14, height: 14, borderRadius: 4, background: c.color }} />
              <div>
                <strong>{c.name}</strong>{' '}
                <span className="muted">
                  · {c.type === 'ical' ? 'iCal feed' : 'Local'}
                  {owner ? ` · ${owner.emoji} ${owner.name}` : ''}
                </span>
                <div className="muted" style={{ fontSize: 12 }}>
                  {c.type === 'ical' &&
                    (c.sync_error
                      ? `⚠️ ${c.sync_error}`
                      : c.last_synced_at
                        ? `Last synced ${c.last_synced_at} UTC`
                        : 'Not synced yet')}
                </div>
              </div>
              <div className="spacer" />
              {c.type === 'ical' && (
                <button className="btn ghost small" onClick={() => sync.mutate(c.id)} disabled={sync.isPending}>
                  {sync.isPending ? 'Syncing…' : 'Sync now'}
                </button>
              )}
              <button className="btn ghost small" onClick={() => setEditing(c)}>
                Edit
              </button>
            </div>
          );
        })}
      </div>
      {editing && (
        <CalendarModal calendar={editing} members={members} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function CalendarModal({ calendar, members, onClose }) {
  const isNew = !calendar.id;
  const [name, setName] = useState(calendar.name || '');
  const [color, setColor] = useState(calendar.color || COLORS[2]);
  const [type, setType] = useState(calendar.type || 'local');
  const [icalUrl, setIcalUrl] = useState(calendar.ical_url || '');
  const [memberId, setMemberId] = useState(calendar.member_id || '');

  const save = useApiMutation(
    (body) =>
      isNew ? api.post('/calendars', body) : api.patch(`/calendars/${calendar.id}`, body),
    ['calendars', 'events']
  );
  const remove = useApiMutation(() => api.del(`/calendars/${calendar.id}`), ['calendars', 'events']);

  const body = {
    name,
    color,
    type,
    ical_url: type === 'ical' ? icalUrl : null,
    member_id: memberId ? Number(memberId) : null,
  };

  return (
    <Modal
      title={isNew ? 'Add calendar' : 'Edit calendar'}
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
            disabled={!name.trim() || (type === 'ical' && !icalUrl.trim())}
            onClick={() => save.mutate(body, { onSuccess: onClose })}
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {save.isError && <p style={{ color: 'var(--danger)' }}>{save.error.message}</p>}
      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)} disabled={!isNew}>
          <option value="local">Local (create events in-app)</option>
          <option value="ical">iCal feed (import .ics / webcal URL)</option>
        </select>
      </div>
      {type === 'ical' && (
        <div className="field">
          <label>iCal / webcal URL</label>
          <input
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            placeholder="https://calendar.google.com/…/basic.ics"
          />
        </div>
      )}
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
        <label>Assign to member (optional)</label>
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">— Whole family —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.emoji} {m.name}
            </option>
          ))}
        </select>
      </div>
    </Modal>
  );
}
