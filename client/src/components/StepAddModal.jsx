import { useState } from 'react';
import { api, useApiMutation } from '../api/client.js';
import { DEFAULT_COMPLETED_ICON } from '../lib/taskIcons.js';
import IconPicker from './IconPicker.jsx';
import Modal from './Modal.jsx';

export default function StepAddModal({ routine, onClose }) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState(null);
  const [completedIcon, setCompletedIcon] = useState(null);
  const trimmedTitle = title.trim();

  const save = useApiMutation(
    () => api.post(`/routines/${routine.id}/steps`, {
      title: trimmedTitle,
      icon,
      completed_icon: completedIcon,
    }),
    ['routines', 'progress']
  );

  const submit = () => {
    if (trimmedTitle && !save.isPending) {
      save.mutate(undefined, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      title={`Add task to ${routine.title}`}
      onClose={onClose}
      footer={
        <>
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={!trimmedTitle || save.isPending} onClick={submit}>
            {save.isPending ? 'Adding…' : 'Add task'}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="new-step-title">Task name</label>
        <input
          id="new-step-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
          placeholder="New task"
          autoFocus
        />
      </div>
      <div className="field">
        <label>Pictures</label>
        <div className="routine-step-key" aria-hidden="true">
          <span>To do</span>
          <span>Done</span>
        </div>
        <div className="new-step-pictures">
          <IconPicker
            compact
            value={icon}
            title={title}
            onChange={setIcon}
            pickerLabel="Choose the to-do picture for the new task"
            allowUpload
          />
          <IconPicker
            compact
            value={completedIcon}
            onChange={setCompletedIcon}
            matchTitle={false}
            fallback={DEFAULT_COMPLETED_ICON}
            pickerLabel="Choose the done picture for the new task"
            allowUpload
          />
        </div>
      </div>
      {save.isError && (
        <p className="icon-upload-error">Could not add the task. Please try again.</p>
      )}
    </Modal>
  );
}
