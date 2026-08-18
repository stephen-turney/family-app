import { useState } from 'react';
import { api, useApiMutation } from '../api/client.js';
import Modal from './Modal.jsx';
import IconPicker from './IconPicker.jsx';

const WEEKDAYS = [
  { n: 0, label: 'Sun' },
  { n: 1, label: 'Mon' },
  { n: 2, label: 'Tue' },
  { n: 3, label: 'Wed' },
  { n: 4, label: 'Thu' },
  { n: 5, label: 'Fri' },
  { n: 6, label: 'Sat' },
];

export default function ChoreModal({ chore, memberId, onClose }) {
  const isNew = !chore.id;
  const [title, setTitle] = useState(chore.title || '');
  const [recurrence, setRecurrence] = useState(chore.recurrence || 'daily');
  const [points, setPoints] = useState(chore.points ?? 5);
  const [icon, setIcon] = useState(chore.icon || null);
  const [weekdays, setWeekdays] = useState(
    new Set((chore.weekdays || '').split(',').filter(Boolean).map(Number))
  );

  const save = useApiMutation(
    (body) => (isNew ? api.post('/chores', body) : api.patch(`/chores/${chore.id}`, body)),
    ['chores', 'progress']
  );
  const remove = useApiMutation(() => api.del(`/chores/${chore.id}`), ['chores', 'progress']);

  const toggleDay = (n) =>
    setWeekdays((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });

  const body = {
    member_id: memberId,
    title,
    recurrence,
    icon, // null = let the title pick the picture
    points: Number(points),
    weekdays: recurrence === 'weekly' ? [...weekdays].sort().join(',') : null,
  };

  return (
    <Modal
      title={isNew ? 'Add chore' : 'Edit chore'}
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
            disabled={!title.trim() || (recurrence === 'weekly' && weekdays.size === 0)}
            onClick={() => save.mutate(body, { onSuccess: onClose })}
          >
            Save
          </button>
        </>
      }
    >
      <div className="field">
        <label>Chore</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label>Picture (for kids who can't read yet)</label>
        <IconPicker value={icon} title={title} onChange={setIcon} />
      </div>
      <div className="field">
        <label>Repeats</label>
        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
          <option value="daily">Every day</option>
          <option value="weekly">Certain weekdays</option>
          <option value="once">One-time</option>
        </select>
      </div>
      {recurrence === 'weekly' && (
        <div className="field">
          <label>On</label>
          <div className="row">
            {WEEKDAYS.map((d) => (
              <button
                key={d.n}
                className={`btn small ${weekdays.has(d.n) ? '' : 'ghost'}`}
                onClick={() => toggleDay(d.n)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="field">
        <label>Points (reward)</label>
        <input type="number" min="0" value={points} onChange={(e) => setPoints(e.target.value)} />
      </div>
    </Modal>
  );
}
