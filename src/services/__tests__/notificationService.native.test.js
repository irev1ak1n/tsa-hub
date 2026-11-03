import { describe, it, expect, vi, beforeEach } from 'vitest';

const plugin = {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    schedule: vi.fn(),
    cancel: vi.fn(),
};

vi.mock('../../native/platform.js', () => ({ isNativeApp: () => true }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));

const svc = await import('../notificationService.js');

const flush = () => new Promise((r) => setTimeout(r, 0));
const inAnHour = () => new Date(Date.now() + 3600 * 1000);

beforeEach(() => {
    Object.values(plugin).forEach((fn) => fn.mockReset().mockResolvedValue({ display: 'granted' }));
});

describe('native reminders', () => {
    it('reports support and starts undetermined', () => {
        expect(svc.isSupported()).toBe(true);
    });

    it('does not schedule until permission is granted', async () => {
        plugin.requestPermissions.mockResolvedValue({ display: 'denied' });
        expect(await svc.requestPermission()).toBe('denied');
        expect(svc.scheduleEventReminder({ id: 'a', title: 't', body: 'b', fireAt: inAnHour() })).toBe(false);
        await flush();
        expect(plugin.schedule).not.toHaveBeenCalled();
    });

    it('schedules with the OS once granted and cancels by the same id', async () => {
        plugin.requestPermissions.mockResolvedValue({ display: 'granted' });
        expect(await svc.requestPermission()).toBe('granted');
        const fireAt = inAnHour();
        expect(svc.scheduleEventReminder({ id: 'evt-1', title: 'Webmaster', body: 'in 30 min', fireAt })).toBe(true);
        await vi.waitFor(() => expect(plugin.schedule).toHaveBeenCalled());
        const call = plugin.schedule.mock.calls[0][0].notifications[0];
        expect(call.id).toBe(svc.nativeReminderId('evt-1'));
        expect(call.schedule.at).toBe(fireAt);
        expect(svc.isScheduled('evt-1')).toBe(true);

        svc.cancelEventReminder('evt-1');
        await vi.waitFor(() => expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: svc.nativeReminderId('evt-1') }] }));
        expect(svc.isScheduled('evt-1')).toBe(false);
    });

    it('skips reminders whose time has passed', async () => {
        await svc.requestPermission();
        expect(svc.scheduleEventReminder({ id: 'old', title: 't', body: 'b', fireAt: new Date(Date.now() - 1000) })).toBe(false);
    });

    it('derives a stable positive numeric id', () => {
        const id = svc.nativeReminderId('personal-123');
        expect(id).toBe(svc.nativeReminderId('personal-123'));
        expect(Number.isInteger(id) && id > 0 && id <= 0x7fffffff).toBe(true);
        expect(svc.nativeReminderId('x')).not.toBe(svc.nativeReminderId('y'));
    });
});
