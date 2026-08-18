import { useState } from 'react';
import { api, useApiMutation } from '../api/client.js';
import Modal from './Modal.jsx';
import IconPicker from './IconPicker.jsx';

const emptyStep = () => ({ title: '', icon: null });

// `timeOfDay` preselects the block — set when the add came from an empty
// morning/afternoon/evening block rather than the card's generic add button.
export default function RoutineModal({ memberId, timeOfDay: initialTimeOfDay, onClose }) {
  const [title, setTitle] = useState('');
  const [timeOfDay, setTimeOfDay] = useState(initialTimeOfDay || 'morning');
  const [steps, setSteps] = useState([emptyStep()]);

  const save = useApiMutation((body) => api.post('/routines', body), ['routines', 'progress']);

  const updateStep = (i, patch) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addStep = () => setSteps((prev) => [...prev, emptyStep()]);
  const removeStep = (i) => setSteps((prev) => prev.filter((_, idx) => idx !== i));

  const body = {
    member_id: memberId,
    title,
    time_of_day: timeOfDay,
    steps: steps
      .map((s) => ({ title: s.title.trim(), icon: s.icon }))
      .filter((s) => s.title),
  };

  return (
    <Modal
      title="Add routine"
      onClose={onClose}
      footer={
        <>
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn"
            disabled={!title.trim() || body.steps.length === 0}
            onClick={() => save.mutate(body, { onSuccess: onClose })}
          >
            Save
          </button>
        </>
      }
    >
      <div className="field">
        <label>Routine name</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Morning Routine" autoFocus />
      </div>
      <div className="field">
        <label>Time of day</label>
        <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)}>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </div>
      <div className="field">
        <label>Steps — tap a picture to change it</label>
        {steps.map((s, i) => (
          <div key={i} className="row" style={{ marginBottom: 6, flexWrap: 'nowrap' }}>
            <IconPicker
              compact
              value={s.icon}
              title={s.title}
              onChange={(icon) => updateStep(i, { icon })}
            />
            <input
              style={{ flex: 1, minWidth: 0 }}
              value={s.title}
              onChange={(e) => updateStep(i, { title: e.target.value })}
              placeholder={`Step ${i + 1}`}
            />
            {steps.length > 1 && (
              <button className="btn ghost small" onClick={() => removeStep(i)}>
                ✕
              </button>
            )}
          </div>
        ))}
        <button className="btn ghost small" onClick={addStep}>
          + Add step
        </button>
      </div>
    </Modal>
  );
}
