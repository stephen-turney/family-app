import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  useMembers,
  useRoutines,
  useProgress,
  useApiMutation,
  localDate,
} from '../api/client.js';
import RoutineModal from '../components/RoutineModal.jsx';
import RoutinePicturesModal from '../components/RoutinePicturesModal.jsx';
import StepAddModal from '../components/StepAddModal.jsx';
import StepRenameModal from '../components/StepRenameModal.jsx';
import Avatar from '../components/Avatar.jsx';
import { isUploadedImage, resolveCompletedIcon, resolveIcon } from '../lib/taskIcons.js';

function TaskPicture({ picture }) {
  return isUploadedImage(picture) ? <img src={picture} alt="" /> : picture;
}

// A local YYYY-MM-DD back to a Date at local midnight. Built by hand rather than
// with parseISO/new Date(iso), which read a bare date as UTC and land on the wrong
// day west of Greenwich — the same trap the server-side notes call out.
function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// setDate handles month, year and DST rollover, so ±1 needs no special cases.
function shiftDate(iso, days) {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

// The day is split into the same three blocks as a printed kids' chore sheet, in
// day order. `key` matches routines.time_of_day, so the grouping needs no new
// column. Tints echo the paper original: periwinkle morning, sage afternoon,
// slate evening. Blocks always all render, even when empty — a checklist a kid
// reads every day should keep the same shape.
const BLOCKS = [
  { key: 'morning', label: 'Morning', article: 'a', icon: '🌤️', tint: '#aab8d6' },
  { key: 'afternoon', label: 'Afternoon', article: 'an', icon: '☀️', tint: '#aec4a3' },
  { key: 'evening', label: 'Evening', article: 'an', icon: '🌙', tint: '#9cb0c9' },
];

// One group per routine in the block, its own name as the heading (the sheet's
// "BEFORE SCHOOL"), plus the done/total the heading shows.
function displayGroups(routines) {
  return routines.map((r) => ({
    key: `r${r.id}`,
    title: r.title,
    rows: r.steps,
    done: r.steps.filter((s) => s.done).length,
    total: r.steps.length,
    routine: r,
  }));
}

// Serves both /tasks (everyone, side by side) and /tasks/:memberId (one person,
// linked from the home page tiles).
export default function TasksPage() {
  const { memberId } = useParams();
  const focusId = memberId ? Number(memberId) : null;

  // Read per render rather than once at module load, so a display left open past
  // midnight at least labels the day correctly as soon as anything re-renders.
  const today = localDate();
  // The day being shown. Only /tasks/:memberId can move off today — the grid has
  // no date controls, so it stays on `today`.
  const [date, setDate] = useState(today);
  const shownDate = focusId ? date : today;

  const { data: members = [] } = useMembers();
  const { data: routines = [] } = useRoutines(shownDate);
  const { data: progress } = useProgress(shownDate, shownDate);
  const queryClient = useQueryClient();

  // The old iPad needs immediate feedback rather than waiting for a POST and two
  // refetches. If a save fails, undo only that step's optimistic change so
  // simultaneous taps on other rows remain intact.
  const pendingSteps = useRef(new Set());
  const [, renderPendingSteps] = useState(0);
  const [completionError, setCompletionError] = useState('');

  const setStepPending = (stepId, pending) => {
    if (pending) pendingSteps.current.add(stepId);
    else pendingSteps.current.delete(stepId);
    renderPendingSteps((version) => version + 1);
  };

  const setCompletion = useMutation({
    mutationFn: ({ stepId, date: completionDate, done }) =>
      api.post(`/routines/steps/${stepId}/completion`, { date: completionDate, done }),
    onMutate: ({ stepId, memberId, date: completionDate, done }) => {
      const routinesKey = ['routines', completionDate];
      const progressKey = ['progress', completionDate, completionDate];
      // Stop an older background refresh from repainting the pre-tap state over
      // this optimistic change. Cancellation is intentionally not awaited: the
      // checkmark should render in the same turn as the click.
      queryClient.cancelQueries({ queryKey: routinesKey });
      queryClient.cancelQueries({ queryKey: progressKey });

      queryClient.setQueryData(routinesKey, (old = []) => old.map((routine) => ({
        ...routine,
        steps: routine.steps.map((step) =>
          step.id === stepId ? { ...step, done } : step
        ),
      })));

      const delta = done ? 1 : -1;
      let pointsDelta = 0;
      queryClient.setQueryData(progressKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          members: old.members.map((member) => {
            if (member.member_id !== memberId) return member;
            const target = member.point_target || 200;
            const completed = Math.max(0, member.completed + delta);
            const points = Math.max(0, Math.min(target, member.points + delta * 10));
            pointsDelta = points - member.points;
            return {
              ...member,
              completed,
              points,
              point_percent: Math.round((points / target) * 100),
              percent: member.expected
                ? Math.round((completed / member.expected) * 100)
                : 0,
            };
          }),
        };
      });

      return { delta, pointsDelta };
    },
    onError: (_error, variables, optimistic) => {
      const routinesKey = ['routines', variables.date];
      const progressKey = ['progress', variables.date, variables.date];
      queryClient.setQueryData(routinesKey, (old = []) => old.map((routine) => ({
        ...routine,
        steps: routine.steps.map((step) =>
          step.id === variables.stepId ? { ...step, done: !variables.done } : step
        ),
      })));
      queryClient.setQueryData(progressKey, (old) => {
        if (!old || !optimistic) return old;
        return {
          ...old,
          members: old.members.map((member) => {
            if (member.member_id !== variables.memberId) return member;
            const target = member.point_target || 200;
            const completed = Math.max(0, member.completed - optimistic.delta);
            const points = Math.max(0, Math.min(target, member.points - optimistic.pointsDelta));
            return {
              ...member,
              completed,
              points,
              point_percent: Math.round((points / target) * 100),
              percent: member.expected
                ? Math.round((completed / member.expected) * 100)
                : 0,
            };
          }),
        };
      });
      setCompletionError('That check could not be saved. Please try again.');
    },
    onSuccess: () => setCompletionError(''),
    onSettled: (_data, _error, variables) => {
      const routinesKey = ['routines', variables.date];
      const progressKey = ['progress', variables.date, variables.date];
      setStepPending(variables.stepId, false);
      queryClient.invalidateQueries({ queryKey: routinesKey });
      queryClient.invalidateQueries({ queryKey: progressKey });
    },
  });

  const completeStep = (step, memberId) => {
    // A native disabled button handles ordinary double taps after the render;
    // this ref also closes the tiny same-frame gap before disabled reaches DOM.
    if (pendingSteps.current.has(step.id)) return;
    setStepPending(step.id, true);
    setCompletion.mutate({ stepId: step.id, memberId, date: shownDate, done: !step.done });
  };

  // {memberId, timeOfDay?} — timeOfDay preselects the block that was tapped.
  const [routineModal, setRoutineModal] = useState(null);
  const [picturesRoutine, setPicturesRoutine] = useState(null);
  const [renamingStep, setRenamingStep] = useState(null);
  const [addingTaskTo, setAddingTaskTo] = useState(null);
  const [editingRoutines, setEditingRoutines] = useState(false);
  const deleteStep = useApiMutation(
    (stepId) => api.del(`/routines/steps/${stepId}`),
    ['routines', 'progress']
  );

  const removeStep = (step) => {
    if (window.confirm(`Delete “${step.title}” from this routine? This cannot be undone.`)) {
      deleteStep.mutate(step.id);
    }
  };

  if (members.length === 0) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <h2>No family members yet</h2>
        <p className="muted">Add members on the Family page to start building their routines.</p>
      </div>
    );
  }

  const statFor = (id) => progress?.members.find((m) => m.member_id === id);

  // A bookmarked or stale /tasks/:id (member since deleted) shouldn't render blank.
  const focusMember = focusId ? members.find((m) => m.id === focusId) : null;
  if (focusId && !focusMember) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <h2>Member not found</h2>
        <p className="muted">Whoever this list belonged to isn't in the family any more.</p>
        <Link className="btn" to="/home" style={{ display: 'inline-block', marginTop: 8 }}>
          Back to family
        </Link>
      </div>
    );
  }
  const shown = focusMember ? [focusMember] : members;

  return (
    <div>
      {focusMember ? (
        // One person: their photo large and centred, title underneath. The back
        // link is absolutely placed so it doesn't pull the photo off-centre.
        <div className="checklist-head">
          <Link className="btn ghost small checklist-back" to="/home">← Family</Link>
          <span
            className="checklist-avatar"
            style={{ background: `${focusMember.color}59`, borderColor: focusMember.color }}
          >
            <Avatar member={focusMember} size={150} />
          </span>
          <h1 className="checklist-title">{focusMember.name}'s Daily Checklist</h1>

          {/* Which day this list is for, and a step either side of it. Arrows are
              46px like the checkboxes — the same finger is doing the tapping. */}
          <div className="checklist-daynav">
            <button
              className="daynav-btn previous"
              onClick={() => setDate(shiftDate(date, -1))}
              aria-label="Previous day"
              title="Previous day"
            >
              <svg className="daynav-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="daynav-date">
              <span className="daynav-date-text">
                {format(parseLocalDate(date), 'EEEE, MMMM d')}
              </span>
              {date === today && <span className="daynav-tag">Today</span>}
            </span>
            <button
              className="daynav-btn next"
              onClick={() => setDate(shiftDate(date, 1))}
              aria-label="Next day"
              title="Next day"
            >
              <svg className="daynav-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          {/* Absolutely placed, like the ← Family link it mirrors: in the centred
              row it would shift the date sideways as it appears and disappears. */}
          {date !== today && (
            <button className="btn ghost small daynav-today" onClick={() => setDate(today)}>
              Jump to today
            </button>
          )}

        </div>
      ) : (
        <h1>Daily Checklist · Today</h1>
      )}

      {completionError && (
        <p className="completion-error" role="alert">{completionError}</p>
      )}

      <div className={`member-columns${focusMember ? ' single' : ''}`}>
        {shown.map((m) => {
          const stat = statFor(m.id);
          const memberRoutines = routines.filter((r) => r.member_id === m.id);
          const blocks = BLOCKS.map((block) => ({
            block,
            groups: displayGroups(memberRoutines.filter((r) => r.time_of_day === block.key)),
          }));

          // Each completed routine step is worth 10 points, capped at the daily
          // 200-point target. Use the visible rows while progress is still loading.
          const rows = blocks.flatMap(({ groups }) => groups.flatMap((g) => g.rows));
          const shownDone = rows.filter((s) => s.done).length;
          const shownPoints = Math.min(stat?.points ?? shownDone * 10, 200);
          const shownPct = Math.round(shownPoints / 2);

          return (
            <div key={m.id} className="card checklist">
              {/* In single-member view the page header already names them. */}
              {!focusMember && (
                <div className="row">
                  <Avatar member={m} size={28} />
                  <strong style={{ fontSize: 17 }}>{m.name}</strong>
                  <div className="spacer" />
                </div>
              )}

              {rows.length > 0 && (
                <div style={{ margin: '12px 0' }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                    {/* "Today's" would be a lie on any other day. */}
                    <span className="muted">
                      {shownDate === today
                        ? "Today's progress"
                        : `${format(parseLocalDate(shownDate), 'EEEE')}'s progress`}
                    </span>
                    <span className="muted">
                      {shownPoints}/200 points
                    </span>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${shownPct}%`, background: m.color }} />
                  </div>
                </div>
              )}

              {blocks.map(({ block, groups }) => {
                // The panel is exactly as tall as this block's rows, so its top and
                // bottom edges land on the first and last one. Real blocks differ in
                // length, so the count has to come from the data rather than a
                // fixed --block-rows. A block with two routines pays an extra
                // heading, which the panel doesn't try to cover.
                const blockRows = groups.reduce((n, g) => n + g.rows.length, 0);
                return (
                  <section
                    key={block.key}
                    // An empty block keeps the compact stacked form even in a wide
                    // card: a full-height panel beside one "add" button looks broken.
                    className={`checklist-block${blockRows === 0 ? ' empty' : ''}`}
                    style={{
                      '--block-rows': blockRows,
                      // Direct pixels are also consumed by the iOS 10 fallback.
                      // That browser supports custom properties but cannot parse
                      // the newer multiplication syntax in CSS calc().
                      '--block-panel-h': `${Math.max(blockRows * 87, 260)}px`,
                    }}
                  >
                    <div className="block-panel" style={{ background: block.tint }}>
                      <span className="block-icon" aria-hidden="true">{block.icon}</span>
                      <span className="block-label">{block.label}</span>
                    </div>

                    <div className="block-body">
                      {groups.length === 0 ? (
                        // An empty block doubles as its own "add" button rather
                        // than sitting there as a dead line of text.
                        <button
                          className="block-empty"
                          onClick={() => setRoutineModal({ memberId: m.id, timeOfDay: block.key })}
                        >
                          + Add {block.article} {block.label.toLowerCase()} routine
                        </button>
                      ) : (
                        groups.map((g) => (
                          <div key={g.key} className="routine-group">
                            {g.title && (
                              <div className="routine-head">
                                <span className="routine-name">{g.title}</span>
                                <span className="routine-head-actions">
                                  {!editingRoutines && (
                                    <button
                                      className="routine-pictures-button"
                                      onClick={() => setPicturesRoutine(g.routine)}
                                    >
                                      🖼️ Pictures
                                    </button>
                                  )}
                                  <span className="routine-count">{g.done}/{g.total}</span>
                                </span>
                              </div>
                            )}
                            {g.rows.map((s) => (
                              <div
                                key={s.id}
                                className={`checkline-row${editingRoutines ? ' editing' : ''}`}
                              >
                                <button
                                  type="button"
                                  className={`checkline ${s.done ? 'done' : ''}`}
                                  role="checkbox"
                                  aria-checked={s.done}
                                  disabled={pendingSteps.current.has(s.id)}
                                  onClick={() => completeStep(s, m.id)}
                                >
                                  <span className="checkline-content">
                                    <span className="box">{s.done ? '✓' : ''}</span>
                                    {/* Pre-readers find their task by picture. */}
                                    <span className="task-icon" aria-hidden="true">
                                      <TaskPicture
                                        picture={s.done ? resolveCompletedIcon(s) : resolveIcon(s)}
                                      />
                                    </span>
                                    <span className="label">{s.title}</span>
                                  </span>
                                </button>
                                {editingRoutines && (
                                  <span className="task-edit-actions">
                                    <button
                                      type="button"
                                      className="task-edit-button"
                                      onClick={() => setRenamingStep(s)}
                                    >
                                      Rename
                                    </button>
                                    <button
                                      type="button"
                                      className="task-edit-button"
                                      onClick={() => setPicturesRoutine({ title: s.title, steps: [s] })}
                                    >
                                      Image
                                    </button>
                                    <button
                                      type="button"
                                      className="task-edit-button delete"
                                      disabled={deleteStep.isPending && deleteStep.variables === s.id}
                                      onClick={() => removeStep(s)}
                                    >
                                      {deleteStep.isPending && deleteStep.variables === s.id
                                        ? 'Deleting…'
                                        : 'Delete'}
                                    </button>
                                  </span>
                                )}
                              </div>
                            ))}
                            {editingRoutines && (
                              <button
                                type="button"
                                className="add-task-button"
                                onClick={() => setAddingTaskTo(g.routine)}
                              >
                                + Add task
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}

              <div className="checklist-foot">
                <button
                  className="btn ghost small"
                  onClick={() => setRoutineModal({ memberId: m.id })}
                >
                  + Add a routine
                </button>
                {focusMember && (
                  <button
                    className={`btn ghost small edit-routines-button${editingRoutines ? ' active' : ''}`}
                    onClick={() => setEditingRoutines((editing) => !editing)}
                  >
                    {editingRoutines ? 'Done editing' : 'Edit routines'}
                  </button>
                )}
              </div>
              {deleteStep.isError && (
                <p className="completion-error" role="alert">
                  That task could not be deleted. Please try again.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Rendered outside the cards on purpose: .checklist is a container query
          context, which would trap the modal's position:fixed backdrop. */}
      {routineModal && (
        <RoutineModal
          memberId={routineModal.memberId}
          timeOfDay={routineModal.timeOfDay}
          onClose={() => setRoutineModal(null)}
        />
      )}
      {picturesRoutine && (
        <RoutinePicturesModal
          routine={picturesRoutine}
          onClose={() => setPicturesRoutine(null)}
        />
      )}
      {renamingStep && (
        <StepRenameModal step={renamingStep} onClose={() => setRenamingStep(null)} />
      )}
      {addingTaskTo && (
        <StepAddModal routine={addingTaskTo} onClose={() => setAddingTaskTo(null)} />
      )}
    </div>
  );
}
