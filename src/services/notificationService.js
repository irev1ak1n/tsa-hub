// ============================================================================
// NotificationService — the one place Calendar code asks for a reminder to
// be scheduled. Nothing else in the app should call the browser Notification
// API, a service worker, or (later) a native notification API directly.
//
// WHY THIS BOUNDARY EXISTS
// TSA Hub is a web app today but is expected to become a real iOS/Android
// app later. A personal event reminder ("remind me 30 minutes before my
// Webmaster meeting") belongs on the device as a LOCAL notification — it
// should fire even if TSA Hub isn't open, the phone is locked, or there's no
// network. A browser tab cannot do that reliably: there is no background
// process here, no service worker registered, and no push backend. Building
// one just for this milestone would be exactly the kind of temporary,
// throwaway infrastructure the product direction asked us to avoid — it
// would need to be thrown out the moment this becomes a real mobile app with
// actual OS-level local notifications.
//
// So the CURRENT web implementation only does what a browser can honestly
// promise: while this tab stays open, a reminder fires via the Notification
// API at the right moment. Close the tab and it's gone — callers must not
// present this as a reliable "closed-app" reminder. See LIMITATIONS below.
//
// FUTURE NATIVE IMPLEMENTATION
// When TSA Hub becomes a mobile app, replace the body of every exported
// function here with real platform calls — nothing above this module (the
// Calendar screen, the personal-calendar hook, the reminder UI) should need
// to change:
//   - Expo Notifications (`expo-notifications`), if the app ends up built
//     with Expo/React Native, or
//   - Capacitor's Local Notifications plugin, if TSA Hub is wrapped with
//     Capacitor, or
//   - iOS UserNotifications / Android AlarmManager-backed notifications
//     directly, for a fully custom native shell.
// Which one applies depends on how the future app is actually built — that
// decision is explicitly NOT made here. `scheduleEventReminder` would call
// the platform's schedule API with a real trigger date, `cancelEventReminder`
// would cancel by the same stored native id, and reminders would keep firing
// after app restarts, with the phone locked, and with TSA Hub fully closed,
// because the OS (not this module, not a running tab) owns the trigger.
//
// LIMITATIONS OF THE CURRENT WEB IMPLEMENTATION (be honest about these in
// the UI — never imply a reminder is guaranteed once the preference is set):
//   - Only fires while this browser tab is open. Closing the tab, closing
//     the browser, or the OS suspending the tab all silently cancel it.
//   - Does not survive a page reload — `rescheduleAll` re-arms anything
//     still in the future when the app next mounts, but there's a gap
//     between "tab closed" and "tab reopened" where nothing is scheduled.
//   - Requires the user to grant browser notification permission.
// None of this is faked or hidden from the user — see the copy used in
// src/screens/calendar/CalendarPanels.jsx.
// ============================================================================

// itemId -> { timeoutId, fireAt }
const scheduled = new Map();

export function isSupported() {
    return typeof window !== 'undefined' && typeof Notification !== 'undefined';
}

export function getPermissionStatus() {
    if (!isSupported()) return 'unsupported';
    return Notification.permission; // 'granted' | 'denied' | 'default'
}

export async function requestPermission() {
    if (!isSupported()) return 'unsupported';
    try {
        return await Notification.requestPermission();
    } catch {
        return getPermissionStatus();
    }
}

function fire(id, title, body) {
    scheduled.delete(id);
    if (!isSupported() || Notification.permission !== 'granted') return;
    try {
        new Notification(title, { body, tag: id });
    } catch {
        // Some browsers throw if the page isn't in a state that allows a
        // direct `new Notification(...)` call — nothing useful to do here,
        // this is the best-effort web fallback, not a guaranteed delivery.
    }
}

// entry: { id, title, body, fireAt: Date }. Replaces any existing timer for
// the same id, so callers never need to check "is one already scheduled".
export function scheduleEventReminder(entry) {
    cancelEventReminder(entry.id);
    if (!isSupported() || Notification.permission !== 'granted') return false;
    const delay = entry.fireAt.getTime() - Date.now();
    if (delay <= 0) return false; // already past — nothing to arm
    const timeoutId = setTimeout(() => fire(entry.id, entry.title, entry.body), delay);
    scheduled.set(entry.id, { timeoutId, fireAt: entry.fireAt });
    return true;
}

export function cancelEventReminder(id) {
    const existing = scheduled.get(id);
    if (existing) {
        clearTimeout(existing.timeoutId);
        scheduled.delete(id);
    }
}

// Cancel + reschedule in one call, so editing an event's time or its
// reminder preference can't leave a stale timer running alongside a new one.
export function updateEventReminder(entry) {
    cancelEventReminder(entry.id);
    return scheduleEventReminder(entry);
}

// Re-arms every still-future reminder in one pass — call this once when the
// Calendar data loads (app mount / page reload), since any timers from a
// previous page life are gone. Entries already in the past are silently
// skipped, not fired late.
export function rescheduleAll(entries) {
    for (const entry of entries) {
        if (entry.fireAt.getTime() > Date.now()) scheduleEventReminder(entry);
    }
}

export function isScheduled(id) {
    return scheduled.has(id);
}
