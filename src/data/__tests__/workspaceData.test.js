import { describe, it, expect } from 'vitest';
import { officialDeadlinesFor } from '../officialDeadlines.js';
import { restoreEventPlan } from '../workspacePlan.js';
import { WORKSPACE_TEMPLATES, newTemplateLabels, templatesForEvent } from '../workspaceTemplates.js';

let counter = 0;
const makeId = () => 'id-' + (counter += 1);

const baseState = () => ({
    myEvents: ['a', 'b'],
    checklists: { a: [{ id: 'c1', label: 'old a', done: false }], b: [{ id: 'c2', label: 'keep b', done: true }] },
    tasks: [
        { id: 't1', eventId: 'a', title: 'old milestone', status: 'todo', due: '2027-01-01', assignee: '' },
        { id: 't2', eventId: 'b', title: 'b milestone', status: 'done', due: '2027-02-01', assignee: '' },
        { id: 't3', eventId: '', title: 'general task', status: 'todo', due: '', assignee: '' },
    ],
    meetings: [{ id: 'm1', date: '2027-01-01', title: 'Meeting' }],
    prefs: { name: 'Sam' },
});

describe('restoreEventPlan', () => {
    it('replaces only the chosen event and leaves everything else identical', () => {
        const before = baseState();
        const after = restoreEventPlan(before, 'a', [{ label: 'new step', done: true }], [{ title: 'new milestone', due: '2027-03-04', status: 'done' }], makeId);
        expect(after.checklists.a).toEqual([{ id: expect.any(String), label: 'new step', done: true }]);
        expect(after.tasks.filter((t) => t.eventId === 'a')).toEqual([{ id: expect.any(String), eventId: 'a', title: 'new milestone', due: '2027-03-04', status: 'done', assignee: '' }]);
        expect(after.checklists.b).toBe(before.checklists.b);
        expect(after.tasks.find((t) => t.id === 't2')).toBe(before.tasks[1]);
        expect(after.tasks.find((t) => t.id === 't3')).toBe(before.tasks[2]);
        expect(after.meetings).toBe(before.meetings);
        expect(after.prefs).toBe(before.prefs);
        expect(after.myEvents).toBe(before.myEvents);
    });

    it('keeps current data for sections the backup does not contain', () => {
        const before = baseState();
        const after = restoreEventPlan(before, 'a', null, null, makeId);
        expect(after.checklists.a).toBe(before.checklists.a);
        expect(after.tasks).toBe(before.tasks);
    });

    it('sanitizes rows: drops blanks, bad dates and bad statuses, and trims length', () => {
        const after = restoreEventPlan(baseState(), 'a',
            [{ label: '   ' }, { label: 'x'.repeat(500) }, null, { label: 'ok', done: 'yes' }],
            [{ title: '' }, { title: 'Bad date', due: 'tomorrow', status: 'weird' }, { title: 'Good', due: '2027-05-01' }], makeId);
        expect(after.checklists.a.map((r) => r.label.length)).toEqual([180, 2]);
        expect(after.checklists.a[1].done).toBe(true);
        const mine = after.tasks.filter((t) => t.eventId === 'a');
        expect(mine.map((t) => [t.title, t.due, t.status])).toEqual([['Bad date', '', 'todo'], ['Good', '2027-05-01', 'todo']]);
    });

    it('restoring an empty checklist and milestone list clears just that event', () => {
        const after = restoreEventPlan(baseState(), 'a', [], [], makeId);
        expect(after.checklists.a).toEqual([]);
        expect(after.tasks.map((t) => t.id)).toEqual(['t2', 't3']);
    });
});

describe('checklist templates', () => {
    it('recommends a matching template first, then the general ones', () => {
        const names = templatesForEvent({ category: 'Computing & Coding' }).map((t) => t.id);
        expect(names[0]).toBe('digital');
        expect(names).toEqual(expect.arrayContaining(['starter', 'conference']));
        expect(names).not.toContain('build');
        expect(templatesForEvent({ category: 'Unknown' }).map((t) => t.id)).toEqual(['starter', 'conference']);
    });

    it('only offers steps the checklist does not already have (case-insensitive)', () => {
        const starter = WORKSPACE_TEMPLATES.find((t) => t.id === 'starter');
        const existing = [{ label: starter.steps[0].toUpperCase() }, { label: 'My own task' }];
        const fresh = newTemplateLabels(starter, existing);
        expect(fresh).toHaveLength(starter.steps.length - 1);
        expect(newTemplateLabels(starter, starter.steps.map((label) => ({ label })))).toEqual([]);
    });

    it('every template has unique, non-empty steps', () => {
        for (const template of WORKSPACE_TEMPLATES) {
            expect(template.steps.length).toBeGreaterThan(3);
            expect(new Set(template.steps).size).toBe(template.steps.length);
            expect(template.steps.every((s) => s.trim().length > 0 && s.length <= 180)).toBe(true);
        }
    });
});

describe('officialDeadlinesFor', () => {
    it('lists national conference dates and competitor registration deadlines in order', () => {
        const items = officialDeadlinesFor();
        const titles = items.map((i) => i.title);
        expect(titles).toEqual(expect.arrayContaining([
            'Conference Registration Opens',
            'Competitive event participant conference registration deadline',
        ]));
        expect(items.some((i) => i.kind === 'conference' && i.startDate === '2027-06-23')).toBe(true);
        expect([...items].map((i) => i.startDate)).toEqual([...items].map((i) => i.startDate).sort());
        expect(items.every((i) => i.url.startsWith('https://') && i.provider)).toBe(true);
    });

    it('leaves out unrelated administrative dates', () => {
        const titles = officialDeadlinesFor().map((i) => i.title.toLowerCase());
        expect(titles.some((t) => t.includes('refund') || t.includes('room request') || t.includes('special needs'))).toBe(false);
    });

    it('adds the user’s state conference only when a state is chosen', () => {
        expect(officialDeadlinesFor().some((i) => i.kind === 'state')).toBe(false);
        const withState = officialDeadlinesFor({ stateName: 'North Carolina' }).filter((i) => i.kind === 'state');
        expect(withState).toHaveLength(1);
        expect(withState[0].title).toMatch(/^North Carolina TSA/);
        expect(officialDeadlinesFor({ stateName: 'Atlantis' }).some((i) => i.kind === 'state')).toBe(false);
    });
});
