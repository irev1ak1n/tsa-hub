import { describe, it, expect } from 'vitest';
import { REMINDER_OPTIONS, computeReminderFireAt, defaultReminder, normalizeReminder, reminderLabel } from '../reminders.js';

describe('reminders: option list', () => {
    it('has exactly the 8 options the product spec calls for, in order', () => {
        expect(REMINDER_OPTIONS.map((o) => o.label)).toEqual([
            'At event time', '5 minutes before', '10 minutes before', '15 minutes before',
            '30 minutes before', '1 hour before', '1 day before', '1 week before',
        ]);
    });
});

describe('reminders: normalizeReminder / defaultReminder', () => {
    it('defaults to disabled with no minutesBefore', () => {
        expect(defaultReminder()).toEqual({ enabled: false, minutesBefore: null });
    });
    it('normalizes a missing/undefined reminder to the default', () => {
        expect(normalizeReminder(undefined)).toEqual({ enabled: false, minutesBefore: null });
        expect(normalizeReminder(null)).toEqual({ enabled: false, minutesBefore: null });
    });
    it('normalizes a malformed reminder (non-numeric minutesBefore) to the default', () => {
        expect(normalizeReminder({ enabled: true, minutesBefore: 'soon' })).toEqual({ enabled: false, minutesBefore: null });
    });
    it('passes through a well-formed reminder unchanged', () => {
        expect(normalizeReminder({ enabled: true, minutesBefore: 30 })).toEqual({ enabled: true, minutesBefore: 30 });
    });
});

describe('reminders: reminderLabel', () => {
    it('finds the label for a known minutesBefore value', () => {
        expect(reminderLabel(30)).toBe('30 minutes before');
        expect(reminderLabel(0)).toBe('At event time');
        expect(reminderLabel(60 * 24 * 7)).toBe('1 week before');
    });
    it('returns null for an unknown value', () => {
        expect(reminderLabel(999)).toBeNull();
        expect(reminderLabel(null)).toBeNull();
    });
});

describe('reminders: computeReminderFireAt', () => {
    it('returns null when minutesBefore is not a number', () => {
        expect(computeReminderFireAt({ startDate: '2026-09-01', startTime: '15:00' }, null)).toBeNull();
        expect(computeReminderFireAt({ startDate: '2026-09-01', startTime: '15:00' }, undefined)).toBeNull();
    });
    it('returns null when the item has no usable start date', () => {
        expect(computeReminderFireAt({ startDate: '', startTime: '15:00' }, 30)).toBeNull();
    });
    it('subtracts minutesBefore from a timed event\'s exact start time', () => {
        const fireAt = computeReminderFireAt({ startDate: '2026-09-01', startTime: '15:00', allDay: false }, 30);
        expect(fireAt.getFullYear()).toBe(2026);
        expect(fireAt.getMonth()).toBe(8); // September, 0-indexed
        expect(fireAt.getDate()).toBe(1);
        expect(fireAt.getHours()).toBe(14);
        expect(fireAt.getMinutes()).toBe(30);
    });
    it('"at event time" (minutesBefore: 0) fires exactly at the start time', () => {
        const fireAt = computeReminderFireAt({ startDate: '2026-09-01', startTime: '15:00', allDay: false }, 0);
        expect(fireAt.getHours()).toBe(15);
        expect(fireAt.getMinutes()).toBe(0);
    });
    it('"1 day before" correctly rolls back across a month boundary', () => {
        const fireAt = computeReminderFireAt({ startDate: '2026-09-01', startTime: '09:00', allDay: false }, 60 * 24);
        expect(fireAt.getMonth()).toBe(7); // August
        expect(fireAt.getDate()).toBe(31);
        expect(fireAt.getHours()).toBe(9);
    });
    it('an all-day item anchors to 9:00 AM local before subtracting minutesBefore', () => {
        const fireAt = computeReminderFireAt({ startDate: '2026-09-01', allDay: true, startTime: null }, 30);
        expect(fireAt.getDate()).toBe(1);
        expect(fireAt.getHours()).toBe(8);
        expect(fireAt.getMinutes()).toBe(30);
    });
    it('a reminder-type item with no startTime is treated the same as all-day', () => {
        const fireAt = computeReminderFireAt({ startDate: '2026-09-01', allDay: false, startTime: '' }, 0);
        expect(fireAt.getHours()).toBe(9);
        expect(fireAt.getMinutes()).toBe(0);
    });
});
