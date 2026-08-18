import { useState } from 'react';
import { api, useApiMutation } from '../api/client.js';
import { DEFAULT_COMPLETED_ICON } from '../lib/taskIcons.js';
import IconPicker from './IconPicker.jsx';
import Modal from './Modal.jsx';

// Picture-only editing for an existing routine. Keeping the task names read-only
// makes this safe to use without turning the checklist into a full routine editor.
export default function RoutinePicturesModal({ routine, onClose }) {
  const [steps, setSteps] = useState(() =>
    routine.steps.map((step) => ({
      id: step.id,
      title: step.title,
      icon: step.icon || null,
      completed_icon: step.completed_icon || null,
    }))
  );

  const updateStep = (id, patch) =>
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));

  const save = useApiMutation(
    () =>
      Promise.all(
        steps.map((step) =>
          api.patch(`/routines/steps/${step.id}`, {
            icon: step.icon,
            completed_icon: step.completed_icon,
          })
        )
      ),
    ['routines']
  );

  return (
    <Modal
      title={`Pictures for ${routine.title}`}
      onClose={onClose}
      footer={
        <>
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn"
            disabled={save.isPending}
            onClick={() => save.mutate(undefined, { onSuccess: onClose })}
          >
            {save.isPending ? 'Saving…' : 'Save pictures'}
          </button>
        </>
      }
    >
      <p className="muted routine-pictures-help">
        Choose an emoji or upload a custom image for each state.
      </p>
      <div className="routine-picture-columns" aria-hidden="true">
        <span>Task</span>
        <span>To do</span>
        <span>Done</span>
      </div>
      {steps.map((step) => (
        <div className="routine-picture-row" key={step.id}>
          <strong>{step.title}</strong>
          <IconPicker
            compact
            value={step.icon}
            title={step.title}
            onChange={(icon) => updateStep(step.id, { icon })}
            pickerLabel={`Choose the to-do picture for ${step.title}`}
            allowUpload
          />
          <IconPicker
            compact
            value={step.completed_icon}
            onChange={(completed_icon) => updateStep(step.id, { completed_icon })}
            matchTitle={false}
            fallback={DEFAULT_COMPLETED_ICON}
            pickerLabel={`Choose the done picture for ${step.title}`}
            allowUpload
          />
        </div>
      ))}
      {save.isError && <p className="icon-upload-error">Could not save the pictures. Please try again.</p>}
    </Modal>
  );
}
