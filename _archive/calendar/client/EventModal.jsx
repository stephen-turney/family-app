import { useState } from 'react';
import { api, useCalendars, useApiMutation } from '../api/client.js';
import Modal from './Modal.jsx';

// Format a Date into the value a datetime-local input expects (local time).
function toInputValue(d) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function EventModal({ event, onClose }) {
  const { data: calendars = [] } = useCalendars();
  const localCals = calendars.filter((c) => c.type === 'local');

  const isNew = !event.id;
  const readOnly = event.source === 'ical'; // synced events can't be edited

  // When created by clicking inside a member's Day-view column, event.member is
  // that person. Prefer their existing local calendar; if they have none, we'll
  // create one on save (the special 'create' option below).
  const targetMember = event.member || null;
  const memberCal = targetMember
    ? localCals.find((c) => c.member_id === targetMember.id)
    : null;
  const defaultCalId =
    event.calendar_id ||
    memberCal?.id ||
    (targetMember ? 'create' : localCals[0]?.id) ||
    '';

  const [title, setTitle] = useState(event.title || '');
  const [calendarId, setCalendarId] = useState(defaultCalId);
  const [start, setStart] = useState(toInputValue(event.start || new Date()));
  const [end, setEnd] = useState(
    toInputValue(event.end || new Date((event.start || new Date()).getTime() + 3600000))
  );
  const [allDay, setAllDay] = useState(Boolean(event.all_day));
  const [location, setLocation] = useState(event.location || '');

  const save = useApiMutation(
    async (body) => {
      // 'create' means: this member has no local calendar yet — make one first.
      let calId = calendarId;
      if (calId === 'create' && targetMember) {
        const cal = await api.post('/calendars', {
          name: `${targetMember.name}'s Calendar`,
          color: targetMember.color,
          type: 'local',
          member_id: targetMember.id,
        });
        calId = cal.id;
      }
      const payload = { ...body, calendar_id: Number(calId) };
      return isNew ? api.post('/events', payload) : api.patch(`/events/${event.id}`, payload);
    },
    ['events', 'calendars']
  );
  const remove = useApiMutation(() => api.del(`/events/${event.id}`), ['events']);

  const body = {
    title,
    starts_at: new Date(start).toISOString(),
    ends_at: new Date(end).toISOString(),
    all_day: allDay,
    location,
  };

  if (readOnly) {
    return (
      <Modal title="Event" onClose={onClose} footer={<button className="btn" onClick={onClose}>Close</button>}>
        <h2 style={{ marginTop: 0 }}>{event.title}</h2>
        <p className="muted">
          Synced from “{event.calendar_name}” · read-only.
          <br />
          {event.start.toLocaleString()} — {event.end.toLocaleString()}
        </p>
        {event.location && <p>📍 {event.location}</p>}
        {event.description && <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>}
      </Modal>
    );
  }

  return (
    <Modal
      title={`${title.trim() || (isNew ? 'New event' : 'Edit event')}${
        targetMember ? ` · ${targetMember.emoji} ${targetMember.name}` : ''
      }`}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button className="btn danger" onClick={() => remove.mutate(undefined, { onSuccess: onClose })}>
              Delete
            </button>
          )}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn"
            disabled={!title.trim() || !calendarId}
            onClick={() => save.mutate(body, { onSuccess: onClose })}
          >
            Save
          </button>
        </>
      }
    >
      {localCals.length === 0 && !targetMember && (
        <p style={{ color: 'var(--danger)' }}>
          You need a local calendar first — add one on the Family page.
        </p>
      )}
      <div className="field">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label>Calendar</label>
        <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>
          {targetMember && !memberCal && (
            <option value="create">➕ New calendar for {targetMember.name}</option>
          )}
          {localCals.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          All day
        </label>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Starts</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Ends</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
    </Modal>
  );
}
