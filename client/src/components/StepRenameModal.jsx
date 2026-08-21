import { useState } from 'react';
import { api, useApiMutation } from '../api/client.js';
import Modal from './Modal.jsx';

export default function StepRenameModal({ step, onClose }) {
  const [title, setTitle] = useState(step.title);
  const trimmedTitle = title.trim();
  const save = useApiMutation(
    () => api.patch(`/routines/steps/${step.id}`, { title: trimmedTitle }),
    ['routines']
  );

  const submit = () => {
    if (trimmedTitle && trimmedTitle !== step.title && !save.isPending) {
      save.mutate(undefined, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      title="Rename task"
      onClose={onClose}
      footer={
        <>
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn"
            disabled={!trimmedTitle || trimmedTitle === step.title || save.isPending}
            onClick={submit}
          >
            {save.isPending ? 'Saving…' : 'Save name'}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="step-rename-title">Task name</label>
        <input
          id="step-rename-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
          autoFocus
        />
      </div>
      {save.isError && (
        <p className="icon-upload-error">Could not rename the task. Please try again.</p>
      )}
    </Modal>
  );
}
