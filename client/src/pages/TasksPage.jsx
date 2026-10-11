import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
import CompletionMark from '../components/CompletionMark.jsx';
import { isUploadedImage, resolveCompletedIcon, resolveIcon } from '../lib/taskIcons.js';
import { memberColor } from '../lib/theme.js';

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
// column. Palette colors: pumpkin morning, lavender afternoon, sea-green evening.
// Keep the familiar sun/moon pictures. Blocks always render, even when empty — a checklist a kid
// reads every day should keep the same shape.
const BLOCKS = [
  { key: 'morning', label: 'Morning', article: 'a', icon: '🌤️', tint: '#FF7518' },
  { key: 'afternoon', label: 'Afternoon', article: 'an', icon: '☀️', tint: '#9370DB' },
  { key: 'evening', label: 'Evening', article: 'an', icon: '🌙', tint: '#2E8B57' },
];

const CELEBRATION_PARTICLES = [
  [-105, -82, '#FFA500', 0], [-72, -112, '#C71585', .08], [-34, -125, '#9400D3', .16],
  [8, -122, '#9370DB', .04], [47, -108, '#32CD32', .12], [86, -76, '#FF7518', .2],
  [116, -35, '#FFA500', .07], [108, 18, '#C71585', .18], [77, 59, '#9400D3', .1],
  [39, 86, '#9370DB', .24], [-6, 93, '#32CD32', .14], [-50, 83, '#FF7518', .03],
  [-91, 51, '#FFA500', .2], [-117, 8, '#C71585', .11], [-122, -34, '#9400D3', .25],
  [-67, -49, '#9370DB', .29], [65, -48, '#32CD32', .31], [90, 42, '#FF7518', .27],
  [-32, 56, '#FFA500', .34], [29, 49, '#C71585', .37],
];

// Long enough for the surrounding rows to visibly glide into their new slots,
// while keeping the list responsive as the pointer changes direction.
const REORDER_GLIDE_MS = 800;
const DRAG_SETTLE_MS = 420;

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

function rowsInDragOrder(rows, routineId, dragDisplayOrder) {
  if (!dragDisplayOrder || dragDisplayOrder.routineId !== routineId) return rows;
  return dragDisplayOrder.stepIds
    .map((id) => rows.find((step) => step.id === id))
    .filter(Boolean);
}

// Serves both /tasks (everyone, side by side) and /tasks/:memberId (one person,
// linked from the home page tiles).
export default function TasksPage() {
  const { memberId } = useParams();
  const [searchParams] = useSearchParams();
  const focusId = memberId ? Number(memberId) : null;

  // Read per render rather than once at module load, so a display left open past
  // midnight at least labels the day correctly as soon as anything re-renders.
  const today = localDate();
  // The day being shown. Both the focused checklist and Overview can browse
  // dates, keeping family-wide progress and routine rows in step.
  // Home passes its currently displayed day in the URL so opening a family
  // member keeps the date visually continuous. Bookmarks and direct visits
  // without a valid date continue to open on today.
  const requestedDate = searchParams.get('date');
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '') ? requestedDate : today;
  const [date, setDate] = useState(initialDate);
  const shownDate = date;

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
  const [celebratingBlocks, setCelebratingBlocks] = useState(() => new Set());
  const celebrationTimers = useRef(new Map());

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
      // completion picture should render in the same turn as the click.
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

  const completeStep = (step, memberId, blockKey) => {
    // A native disabled button handles ordinary double taps after the render;
    // this ref also closes the tiny same-frame gap before disabled reaches DOM.
    if (pendingSteps.current.has(step.id)) return;
    const done = !step.done;
    if (done) {
      const blockSteps = routines
        .filter((routine) => routine.member_id === memberId && routine.time_of_day === blockKey)
        .flatMap((routine) => routine.steps);
      if (blockSteps.length && blockSteps.every((candidate) => candidate.id === step.id || candidate.done)) {
        const celebrationKey = `${shownDate}:${memberId}:${blockKey}`;
        clearTimeout(celebrationTimers.current.get(celebrationKey));
        setCelebratingBlocks((current) => new Set(current).add(celebrationKey));
        celebrationTimers.current.set(
          celebrationKey,
          setTimeout(() => {
            setCelebratingBlocks((current) => {
              const next = new Set(current);
              next.delete(celebrationKey);
              return next;
            });
            celebrationTimers.current.delete(celebrationKey);
          }, 2300)
        );
      }
    }
    setStepPending(step.id, true);
    setCompletion.mutate({ stepId: step.id, memberId, date: shownDate, done });
  };

  // {memberId, timeOfDay?} — timeOfDay preselects the block that was tapped.
  const [routineModal, setRoutineModal] = useState(null);
  const [picturesRoutine, setPicturesRoutine] = useState(null);
  const [renamingStep, setRenamingStep] = useState(null);
  const [addingTaskTo, setAddingTaskTo] = useState(null);
  const [editingRoutines, setEditingRoutines] = useState(false);
  const dragState = useRef(null);
  const touchDragCleanup = useRef(null);
  const mouseDragCleanup = useRef(null);
  const settlingDragCleanup = useRef(null);
  const pendingReorderAnimation = useRef(null);
  const [draggingStepId, setDraggingStepId] = useState(null);
  const [dragOverStepId, setDragOverStepId] = useState(null);
  const [dragDisplayOrder, setDragDisplayOrder] = useState(null);
  const [reorderError, setReorderError] = useState('');

  // Run after React has committed the reordered DOM. This guarantees that the
  // distance is measured between two different layouts; scheduling this from
  // the pointer event could run before the rows had actually changed places.
  useLayoutEffect(() => {
    const pending = pendingReorderAnimation.current;
    if (!pending) return;
    pendingReorderAnimation.current = null;
    const selector = `.checkline-row[data-routine-id="${pending.routineId}"]`;
    document.querySelectorAll(selector).forEach((row) => {
      if (Number(row.dataset.stepId) === pending.stepId) return;
      const previousTop = pending.previousTops.get(row.dataset.stepId);
      if (previousTop == null) return;
      row._reorderAnimationCleanup?.();
      const delta = previousTop - row.getBoundingClientRect().top;
      if (!delta) return;
      // Commit the cleared animation before reusing the same keyframes during
      // a quick direction change, so Safari reliably restarts the glide.
      void row.offsetWidth;
      row.style.setProperty('--reorder-from-y', `${delta}px`);
      row.style.animation =
        `reorder-row-glide ${REORDER_GLIDE_MS}ms cubic-bezier(.22, 1, .36, 1)`;
      const cleanup = () => {
        row.removeEventListener('animationend', cleanup);
        row.style.removeProperty('--reorder-from-y');
        row.style.removeProperty('animation');
        if (row._reorderAnimationCleanup === cleanup) row._reorderAnimationCleanup = null;
      };
      row._reorderAnimationCleanup = cleanup;
      row.addEventListener('animationend', cleanup);
    });
  }, [dragDisplayOrder]);

  const deleteStep = useApiMutation(
    (stepId) => api.del(`/routines/steps/${stepId}`),
    ['routines', 'progress']
  );

  const reorderSteps = useMutation({
    mutationFn: ({ routineId, stepIds }) =>
      api.patch(`/routines/${routineId}/steps/order`, { step_ids: stepIds }),
    onError: (_error, variables) => {
      queryClient.setQueryData(['routines', variables.date], (old = []) => old.map((routine) =>
        routine.id === variables.routineId
          ? {
              ...routine,
              steps: variables.originalStepIds
                .map((id) => routine.steps.find((step) => step.id === id))
                .filter(Boolean),
            }
          : routine
      ));
      setReorderError('That new task order could not be saved. Please try again.');
    },
    onSuccess: () => setReorderError(''),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routines', variables.date] });
    },
  });

  const beginStepDrag = (routine, step) => {
    if (!editingRoutines || reorderSteps.isPending) return null;
    const drag = {
      routineId: routine.id,
      stepId: step.id,
      date: shownDate,
      originalStepIds: routine.steps.map((item) => item.id),
      targetStepId: step.id,
      displayStepIds: routine.steps.map((item) => item.id),
    };
    dragState.current = drag;
    setDraggingStepId(step.id);
    setDragOverStepId(step.id);
    setDragDisplayOrder({ routineId: routine.id, stepIds: [...drag.displayStepIds] });
    return drag;
  };

  const moveDraggedStep = (targetStepId, pointerDirection = 0) => {
    const drag = dragState.current;
    if (!drag) return;
    // Once the list has shifted, the blank placeholder sits underneath the
    // pointer. Treat crossing it as leaving the previous target so that the
    // same neighboring row can become active again on the trip back. Without
    // this reset, a task can move away from its starting slot but not return.
    if (targetStepId === drag.stepId) {
      drag.targetStepId = drag.stepId;
      setDragOverStepId(drag.stepId);
      return;
    }
    // An animated neighbor can remain visually beneath the pointer after the
    // first swap. Ignore continued travel in that direction, but let reversing
    // across the same row move the task back toward its previous/original slot.
    if (
      drag.targetStepId === targetStepId &&
      (!pointerDirection || pointerDirection === drag.lastMoveDirection)
    ) return;
    const selector = `.checkline-row[data-routine-id="${drag.routineId}"]`;
    const previousTops = new Map(
      Array.from(document.querySelectorAll(selector), (row) => [
        row.dataset.stepId,
        row.getBoundingClientRect().top,
      ])
    );
    drag.targetStepId = targetStepId;
    const from = drag.displayStepIds.indexOf(drag.stepId);
    const to = drag.displayStepIds.indexOf(targetStepId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...drag.displayStepIds];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    drag.displayStepIds = next;
    drag.lastMoveDirection = pointerDirection || Math.sign(to - from);
    pendingReorderAnimation.current = {
      routineId: drag.routineId,
      stepId: drag.stepId,
      previousTops,
    };
    setDragDisplayOrder({ routineId: drag.routineId, stepIds: [...next] });
    setDragOverStepId(targetStepId);
  };

  const removeDragPreview = (drag) => {
    if (drag?.preview?.parentNode) drag.preview.parentNode.removeChild(drag.preview);
  };

  const settleDragPreview = (drag, onComplete) => {
    const preview = drag.preview;
    const target = document.querySelector(
      `.checkline-row[data-routine-id="${drag.routineId}"][data-step-id="${drag.stepId}"]`
    );
    if (!preview || !target) {
      removeDragPreview(drag);
      onComplete();
      return;
    }

    const rect = target.getBoundingClientRect();
    let timeoutId;
    let finished = false;
    const finish = (complete = true) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      preview.removeEventListener('transitionend', handleTransitionEnd);
      if (settlingDragCleanup.current === finish) settlingDragCleanup.current = null;
      if (complete) {
        // Remove the placeholder styling in the same paint that removes the
        // floating preview. Waiting for React's next render here exposes one
        // frame of the dashed outline after the preview has landed.
        document.querySelectorAll(
          `.checkline-row[data-routine-id="${drag.routineId}"]`
        ).forEach((row) => row.classList.remove('dragging', 'drag-over'));
        onComplete();
      }
      removeDragPreview(drag);
    };
    const handleTransitionEnd = (event) => {
      if (event.propertyName === 'transform') finish();
    };
    settlingDragCleanup.current?.();
    settlingDragCleanup.current = finish;
    preview.addEventListener('transitionend', handleTransitionEnd);
    preview.style.transition =
      `transform ${DRAG_SETTLE_MS}ms cubic-bezier(.22, 1, .36, 1), ` +
      `box-shadow ${DRAG_SETTLE_MS}ms ease`;
    void preview.offsetWidth;
    preview.classList.add('settling');
    preview.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) rotate(0)`;
    // A fallback is needed for older Safari versions that occasionally omit
    // transitionend when the destination is only a few pixels away.
    timeoutId = window.setTimeout(() => finish(), DRAG_SETTLE_MS + 80);
  };

  const createDragPreview = (row, point) => {
    const rect = row.getBoundingClientRect();
    const preview = row.cloneNode(true);
    preview.classList.remove('dragging', 'drag-over');
    preview.classList.add('task-drag-preview');
    preview.setAttribute('aria-hidden', 'true');
    preview.removeAttribute('data-step-id');
    preview.removeAttribute('data-routine-id');
    Array.prototype.forEach.call(
      preview.querySelectorAll('button'),
      (button) => { button.tabIndex = -1; }
    );
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${rect.height}px`;

    const offsetX = point.clientX - rect.left;
    const offsetY = point.clientY - rect.top;
    preview.style.transform =
      `translate3d(${point.clientX - offsetX}px, ${point.clientY - offsetY}px, 0) rotate(1deg)`;
    preview._dragOffset = { x: offsetX, y: offsetY };
    document.body.appendChild(preview);
    return preview;
  };

  const orderedStepIds = (drag) => {
    return [...drag.displayStepIds];
  };

  const finishStepDrag = (commit = true) => {
    const drag = dragState.current;
    if (!drag) return;
    const stepIds = orderedStepIds(drag);
    dragState.current = null;
    if (commit && stepIds.some((id, index) => id !== drag.originalStepIds[index])) {
      queryClient.setQueryData(['routines', drag.date], (old = []) => old.map((routine) => {
        if (routine.id !== drag.routineId) return routine;
        return {
          ...routine,
          steps: stepIds
            .map((id) => routine.steps.find((step) => step.id === id))
            .filter(Boolean),
        };
      }));
      reorderSteps.mutate({
        routineId: drag.routineId,
        date: drag.date,
        originalStepIds: drag.originalStepIds,
        stepIds,
      });
    }
    setDragDisplayOrder(null);
    const clearDragVisuals = () => {
      setDraggingStepId(null);
      setDragOverStepId(null);
    };
    if (commit && drag.preview) settleDragPreview(drag, clearDragVisuals);
    else {
      removeDragPreview(drag);
      clearDragVisuals();
    }
  };

  const moveStepWithKeyboard = (routine, step, direction) => {
    const index = routine.steps.findIndex((item) => item.id === step.id);
    const target = routine.steps[index + direction];
    if (!target || reorderSteps.isPending) return;
    beginStepDrag(routine, step);
    moveDraggedStep(target.id);
    finishStepDrag();
  };

  const moveFloatingDrag = (clientX, clientY, routineId) => {
    const drag = dragState.current;
    if (!drag || drag.routineId !== routineId) return;
    const pointerDirection = Math.sign(clientY - (drag.lastClientY ?? clientY));
    drag.lastClientY = clientY;

    if (drag.preview) {
      const { x, y } = drag.preview._dragOffset;
      drag.preview.style.transform =
        `translate3d(${clientX - x}px, ${clientY - y}px, 0) rotate(1deg)`;
    }

    // Keep long routines draggable without requiring a second gesture. The
    // content pane is the actual scroller on both the phone and old iPad.
    const scroller = document.querySelector('.content');
    const edge = 72;
    if (scroller && clientY < edge) scroller.scrollTop -= 14;
    else if (scroller && clientY > window.innerHeight - edge) scroller.scrollTop += 14;

    // FLIP animations temporarily transform neighboring rows from their old
    // positions. Hit-test their final layout slots instead of their animated
    // pixels, otherwise a quick reversal can appear to miss the original slot.
    const rows = document.querySelectorAll(
      `.checkline-row[data-routine-id="${routineId}"][data-step-id]`
    );
    const row = Array.from(rows).find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      const transform = getComputedStyle(candidate).transform;
      const matrix = transform && transform !== 'none'
        ? transform.match(/^matrix(3d)?\((.+)\)$/)
        : null;
      const values = matrix?.[2].split(',').map(Number);
      const translateY = values
        ? values[matrix[1] ? 13 : 5] || 0
        : 0;
      const layoutTop = rect.top - translateY;
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= layoutTop &&
        clientY < layoutTop + candidate.offsetHeight
      );
    });
    if (!row) return;
    moveDraggedStep(Number(row.dataset.stepId), pointerDirection);
  };

  const handleTouchMove = (event, routineId) => {
    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    moveFloatingDrag(touch.clientX, touch.clientY, routineId);
  };

  const beginTouchDrag = (routine, step, event) => {
    const drag = beginStepDrag(routine, step);
    const touch = event.touches[0];
    const row = event.currentTarget.closest('.checkline-row');
    if (!drag || !touch || !row) return;
    drag.lastClientY = touch.clientY;
    drag.preview = createDragPreview(row, touch);

    touchDragCleanup.current?.();
    const move = (event) => handleTouchMove(event, routine.id);
    const end = () => {
      touchDragCleanup.current?.();
      finishStepDrag();
    };
    const cancel = () => {
      touchDragCleanup.current?.();
      finishStepDrag(false);
    };
    const cleanup = () => {
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
      document.removeEventListener('touchcancel', cancel);
      touchDragCleanup.current = null;
    };
    touchDragCleanup.current = cleanup;
    // React's delegated touch listener may be passive in newer browsers. A
    // native non-passive listener also keeps dragging reliable on the old iPad.
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', cancel);
  };

  const beginMouseDrag = (routine, step, event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const drag = beginStepDrag(routine, step);
    const row = event.currentTarget.closest('.checkline-row');
    if (!drag || !row) return;
    drag.lastClientY = event.clientY;
    drag.preview = createDragPreview(row, event);

    mouseDragCleanup.current?.();
    const move = (mouseEvent) => {
      mouseEvent.preventDefault();
      moveFloatingDrag(mouseEvent.clientX, mouseEvent.clientY, routine.id);
    };
    const end = () => {
      mouseDragCleanup.current?.();
      finishStepDrag();
    };
    const cancel = () => {
      mouseDragCleanup.current?.();
      finishStepDrag(false);
    };
    const cleanup = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      window.removeEventListener('blur', cancel);
      mouseDragCleanup.current = null;
    };
    mouseDragCleanup.current = cleanup;
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    window.addEventListener('blur', cancel);
  };

  useEffect(() => () => {
    touchDragCleanup.current?.();
    mouseDragCleanup.current?.();
    settlingDragCleanup.current?.(false);
    removeDragPreview(dragState.current);
    celebrationTimers.current.forEach((timer) => clearTimeout(timer));
  }, []);

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
  const focusRows = focusMember
    ? routines.filter((routine) => routine.member_id === focusMember.id).flatMap((routine) => routine.steps)
    : [];
  const focusDone = focusRows.filter((step) => step.done).length;
  const focusPoints = Math.min(statFor(focusMember?.id)?.points ?? focusDone * 10, 200);
  const focusPercent = focusRows.length ? Math.round((focusDone / focusRows.length) * 100) : 0;

  return (
    <div>
      {focusMember ? (
        // One person: their photo large and centred, title underneath. The back
        // link is absolutely placed so it doesn't pull the photo off-centre.
        <div className="checklist-head">
          <Link className="btn ghost small checklist-back" to={`/home?date=${date}`}>← Family</Link>
          <div className="checklist-head-actions">
            <button
              className={`btn ghost small edit-routines-button${editingRoutines ? ' active' : ''}`}
              onClick={() => setEditingRoutines((editing) => !editing)}
            >
              {editingRoutines ? 'Done editing' : 'Edit routines'}
            </button>
          </div>
          {/* Which day this list is for, and a step either side of it. */}
          <div className="checklist-daynav-wrap">
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
                {format(parseLocalDate(date), 'EEEE, MMMM d')}
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
            <div className="daynav-tag-slot">
              {date === today ? (
                <span className="daynav-tag">Today</span>
              ) : (
                <button className="btn ghost small daynav-jump" onClick={() => setDate(today)}>
                  <span className="daynav-tag">Jump to today</span>
                </button>
              )}
            </div>
          </div>
          <span
            className="checklist-avatar"
            style={{ background: `${memberColor(focusMember)}59`, borderColor: memberColor(focusMember) }}
          >
            <Avatar member={focusMember} size={150} />
          </span>
          <h1 className="checklist-title">{focusMember.name}'s Daily Checklist</h1>
        </div>
      ) : (
        <div className="overview-daynav-head">
          <div className="checklist-daynav-wrap">
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
                {format(parseLocalDate(date), 'EEEE, MMMM d')}
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
            <div className="daynav-tag-slot">
              {date === today ? (
                <span className="daynav-tag">Today</span>
              ) : (
                <button className="btn ghost small daynav-jump" onClick={() => setDate(today)}>
                  <span className="daynav-tag">Jump to today</span>
                </button>
              )}
            </div>
          </div>
          <button
            className={`btn ghost small edit-routines-button${editingRoutines ? ' active' : ''}`}
            onClick={() => setEditingRoutines((editing) => !editing)}
          >
            {editingRoutines ? 'Done editing' : 'Edit routines'}
          </button>
        </div>
      )}

      {completionError && (
        <p className="completion-error" role="alert">{completionError}</p>
      )}

      {focusMember && (
        <section className="card checklist-progress-summary" aria-label="Daily progress">
          <div className="checklist-progress-heading">
            <span>{shownDate === today ? "Today's Progress" : `${format(parseLocalDate(shownDate), 'EEEE')} Progress`}</span>
            <strong>{focusPoints}/200 points</strong>
          </div>
          <div className="progress" aria-label={`${focusPercent}% complete`}>
            <span style={{ width: `${focusPercent}%`, backgroundColor: memberColor(focusMember) }} />
          </div>
        </section>
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
                  <Link className="overview-member-link" to={`/tasks/${m.id}?date=${shownDate}`}>
                    <Avatar member={m} size={28} />
                    <strong>{m.name}</strong>
                  </Link>
                  <div className="spacer" />
                </div>
              )}

              {!focusMember && rows.length > 0 && (
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
                    <span style={{ width: `${shownPct}%`, backgroundColor: memberColor(m) }} />
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
                const blockDone = groups.reduce(
                  (n, group) => n + group.rows.filter((step) => step.done).length,
                  0
                );
                const blockPercent = blockRows ? Math.round((blockDone / blockRows) * 100) : 0;
                const blockComplete = blockRows > 0 && blockDone === blockRows;
                const celebrationKey = `${shownDate}:${m.id}:${block.key}`;
                const isCelebrating = celebratingBlocks.has(celebrationKey);
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
                    {(isCelebrating || blockComplete) && (
                      <div className={`block-celebration${isCelebrating ? '' : ' is-complete'}`} aria-label={`${block.label} complete!`}>
                        <div className="celebration-stage">
                          {isCelebrating && <>
                            <span className="celebration-spark spark-one">✦</span>
                            <span className="celebration-spark spark-two">✦</span>
                            <span className="celebration-spark spark-three">✦</span>
                            <span className="celebration-spark spark-four">✦</span>
                            <span className="celebration-spark spark-five">✦</span>
                            <span className="celebration-confetti confetti-one" />
                            <span className="celebration-confetti confetti-two" />
                            <span className="celebration-confetti confetti-three" />
                            <span className="celebration-confetti confetti-four" />
                            <span className="celebration-confetti confetti-five" />
                            <span className="celebration-confetti confetti-six" />
                            <div className="celebration-particle-cloud" aria-hidden="true">
                              {CELEBRATION_PARTICLES.map(([x, y, color, delay], index) => (
                                <span
                                  key={index}
                                  className="celebration-particle"
                                  style={{
                                    '--burst-x': `${x}px`, '--burst-y': `${y}px`,
                                    '--particle-color': color, '--particle-delay': `${delay}s`,
                                  }}
                                />
                              ))}
                            </div>
                          </>}
                          <svg className="celebration-icon" viewBox="0 0 100 100" aria-hidden="true">
                            <circle cx="50" cy="50" r="42" />
                            <path d="M27 51 L43 67 L74 34" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="block-panel" style={{ backgroundColor: block.tint }}>
                      <span className="block-icon" aria-hidden="true">{block.icon}</span>
                      <span className="block-label">{block.label}</span>
                    </div>

                    <div className="block-body">
                      <div className="block-progress">
                        <div className="routine-head">
                          <span className="routine-name">{groups[0]?.title || block.label}</span>
                          <span className="routine-head-actions">
                            <span className="routine-count">
                              {blockRows ? `${blockDone}/${blockRows}` : 'No tasks yet'}
                            </span>
                          </span>
                        </div>
                        <div className="progress" aria-label={`${block.label}: ${blockPercent}% complete`}>
                          <span style={{ width: `${blockPercent}%`, backgroundColor: block.tint }} />
                        </div>
                      </div>
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
                        groups.map((g, index) => (
                          <div key={g.key} className="routine-group">
                            {g.title && index > 0 && (
                              <div className="routine-head">
                                <span className="routine-name">{g.title}</span>
                                <span className="routine-head-actions">
                                  <span className="routine-count">{g.done}/{g.total}</span>
                                </span>
                              </div>
                            )}
                            {rowsInDragOrder(g.rows, g.routine.id, dragDisplayOrder).map((s) => {
                              const ChecklineElement = editingRoutines ? 'div' : 'button';
                              const checklineInteraction = editingRoutines
                                ? {}
                                : {
                                    type: 'button',
                                    role: 'checkbox',
                                    'aria-checked': s.done,
                                    disabled: pendingSteps.current.has(s.id),
                                    onClick: () => completeStep(s, m.id, block.key),
                                  };
                              return (
                                <div
                                  key={s.id}
                                  className={
                                    `checkline-row${editingRoutines ? ' editing' : ''}` +
                                    `${draggingStepId === s.id ? ' dragging' : ''}` +
                                    `${dragOverStepId === s.id ? ' drag-over' : ''}`
                                  }
                                  data-routine-id={g.routine.id}
                                  data-step-id={s.id}
                                >
                                <ChecklineElement
                                  className={`checkline ${s.done ? 'done' : ''}`}
                                  {...checklineInteraction}
                                >
                                  <span className="checkline-content">
                                    {editingRoutines ? (
                                      <button
                                        type="button"
                                        className="task-drag-handle"
                                        disabled={reorderSteps.isPending}
                                        aria-label={`Reorder ${s.title}. Use the arrow keys or drag.`}
                                        title="Drag to reorder"
                                        onMouseDown={(event) => beginMouseDrag(g.routine, s, event)}
                                        onTouchStart={(event) => beginTouchDrag(g.routine, s, event)}
                                        onKeyDown={(event) => {
                                          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
                                          event.preventDefault();
                                          moveStepWithKeyboard(
                                            g.routine,
                                            s,
                                            event.key === 'ArrowUp' ? -1 : 1
                                          );
                                        }}
                                      >
                                        <span aria-hidden="true">☰</span>
                                      </button>
                                    ) : (
                                      <span className="box" aria-hidden="true">
                                        {s.done && <CompletionMark />}
                                      </span>
                                    )}
                                    {/* Pre-readers find their task by picture. */}
                                    <span className="task-icon" aria-hidden="true">
                                      <TaskPicture
                                        picture={s.done ? resolveCompletedIcon(s) : resolveIcon(s)}
                                      />
                                    </span>
                                    <span className="label">{s.title}</span>
                                  </span>
                                </ChecklineElement>
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
                              );
                            })}
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

              {focusMember && (
                <div className="checklist-foot">
                  <button
                    className={`btn ghost small edit-routines-button${editingRoutines ? ' active' : ''}`}
                    onClick={() => setEditingRoutines((editing) => !editing)}
                  >
                    {editingRoutines ? 'Done editing' : 'Edit routines'}
                  </button>
                </div>
              )}
              {deleteStep.isError && (
                <p className="completion-error" role="alert">
                  That task could not be deleted. Please try again.
                </p>
              )}
              {reorderError && (
                <p className="completion-error" role="alert">{reorderError}</p>
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
