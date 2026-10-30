// Pure state helpers for one event's checklist and milestones, so restoring
// a backup can be tested without React.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ROWS = 300;

function clean(value, max = 180) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function sanitizeChecklist(rows, makeId) {
    if (!Array.isArray(rows)) return null;
    return rows
        .slice(0, MAX_ROWS)
        .filter((row) => clean(row?.label))
        .map((row) => ({ id: makeId(), label: clean(row.label), done: Boolean(row.done) }));
}

export function sanitizeMilestones(rows, eventId, makeId) {
    if (!Array.isArray(rows)) return null;
    return rows
        .slice(0, MAX_ROWS)
        .filter((row) => clean(row?.title))
        .map((row) => ({
            id: makeId(),
            eventId,
            title: clean(row.title),
            due: typeof row.due === 'string' && DATE_RE.test(row.due) ? row.due : '',
            status: row.status === 'done' ? 'done' : 'todo',
            assignee: clean(row.assignee),
        }));
}

// Replaces only this event's checklist and milestones. Every other event's
// plan, and all other app state, is returned untouched. A null section means
// the backup did not include it, so the current data is kept.
export function restoreEventPlan(state, eventId, checklist, milestones, makeId) {
    const nextChecklist = sanitizeChecklist(checklist, makeId);
    const nextMilestones = sanitizeMilestones(milestones, eventId, makeId);
    return {
        ...state,
        checklists: { ...state.checklists, [eventId]: nextChecklist ?? (state.checklists[eventId] || []) },
        tasks: nextMilestones ? [...state.tasks.filter((task) => task.eventId !== eventId), ...nextMilestones] : state.tasks,
    };
}
