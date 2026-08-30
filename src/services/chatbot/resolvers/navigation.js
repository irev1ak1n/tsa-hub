// ============================================================================
// Navigation resolver — the part of Coach that answers "how do I use this
// app" and "where is X" questions by pointing at a REAL screen, instead of
// trying to explain the whole feature in chat. See knowledge/appDestinations.js
// for the destination map this reads from.
//
// Every branch here returns { text, actions } where `actions` are NAVIGATE
// blocks carrying a real route from appDestinations.js — never a fabricated
// path. Checked in engine.js before the general intent pipeline runs, since
// these are app-usage questions, not TSA-content questions the existing
// resolvers already own.
// ============================================================================

import { findDestination, getDestination } from '../knowledge/appDestinations.js';

function navAction(label, route) {
    return { type: 'NAVIGATE', label, route };
}

// { match: RegExp, text, action: [label, destinationId] }
const HOWTO_TOPICS = [
    {
        match: /\bhow do i (add|create|make) (a |an )?reminder\b|\bhow do i (set|add) a reminder\b/,
        text: 'Open a day in Calendar, tap the + button, and choose Reminder. You can also turn on a notification for it right there.',
        action: ['Open Calendar', 'calendar'],
    },
    {
        match: /\bhow do i add (a |an |something )?(event|item|something)? ?to (my )?calendar\b|\bhow do i (add|create|make) (a |an )?event\b|\bhow do i put something on my calendar\b/,
        text: 'In Calendar, choose the day you want and tap the + button. You can create an event or reminder and keep it saved on this device.',
        action: ['Open Calendar', 'calendar'],
    },
    {
        match: /\bhow do i edit (a |an )?(event|reminder)\b|\bhow do i change (a |an )?(event|reminder)\b/,
        text: 'Open the event or reminder in Calendar and tap Edit to change its details.',
        action: ['Open Calendar', 'calendar'],
    },
    {
        match: /\bhow do i delete (a |an )?(event|reminder)\b|\bhow do i remove (a |an )?(event|reminder)\b|\bhow do i delete something from (my )?calendar\b/,
        text: 'Open the event or reminder in Calendar and tap Delete.',
        action: ['Open Calendar', 'calendar'],
    },
    {
        match: /\bhow do i export\b|\badd (this |it |an event )?to my (device )?calendar\b|\badd to (my )?calendar app\b|\bexport (this |it )?to my calendar\b|\bcan i add (a |an )?tsa date to my calendar\b/,
        text: 'Open the event and tap "Add to device calendar" — it downloads a calendar file your phone or computer\'s calendar app can open.',
        action: ['Open Calendar', 'calendar'],
    },
    {
        match: /\bhow do i (install|add (this|it) to my (home screen|phone))\b/,
        text: 'TSA Hub runs in your browser, so there\'s no app store download — add a shortcut to your home screen instead for quick access.',
        action: ['Open installation guide', 'help:install'],
    },
    {
        match: /\bhow do i contact support\b|\bwhere do i contact support\b|\bhow do i report a bug\b/,
        text: 'Contact Support is in the Help Center — pick a category and describe the issue, and you\'ll see exactly what gets sent before anything goes out.',
        action: ['Contact Support', 'help:contacting-support'],
    },
    {
        match: /\bhow (do|can) i report (incorrect|wrong) info(rmation)?\b|\bwhere do i report (wrong|incorrect) info(rmation)?\b|\bhow do i report something wrong\b/,
        text: 'You can report incorrect TSA Hub information through the Help Center — it helps keep things accurate for everyone.',
        action: ['Report incorrect information', 'help:reporting-incorrect-info'],
    },
    {
        match: /\bhow do i change (my )?settings\b|\bwhere do i change settings\b/,
        text: 'Settings has your appearance (light/dark) and your state preference.',
        action: ['Open Settings', 'settings'],
    },
    {
        match: /\bhow do i use (the )?(tsa )?(assistant|coach)\b|\bhow do i ask (you|coach) questions\b/,
        text: 'Just type naturally — ask about an event, a rule, a deadline, or say what you\'re trying to find, and I\'ll point you to the right place.',
        action: ['Using TSA Assistant', 'help:using-tsa-assistant'],
    },
    {
        match: /\bhow do i search (for )?events\b|\bhow do i find an event\b/,
        text: 'Use Event Search to look up an event directly by name, or browse and filter the full list in Events.',
        action: ['Search Events', 'eventSearch'],
    },
    {
        match: /\bwhat (data|information) .{0,25}\bsav(e|es)\b|\bwhat do you save\b/,
        text: 'Personal calendar items stay on your device. Support messages and reports are only sent after you review and confirm them.',
        action: ['Read Privacy Policy', 'privacy'],
    },
    {
        match: /\bwhat is today\b|\bwhat is this month\b|\bwhat is this week\b|^today$|^this week$|^this month$/,
        text: 'Calendar shows exactly what\'s scheduled today, this week, or this month, in whichever view you switch to.',
        action: ['Open Calendar', 'calendar'],
    },
    {
        match: /\bhow do i get (back )?to my events\b|\bhow do i get back to events\b/,
        text: 'Events is in the main navigation — tap it any time to browse or search the full list.',
        action: ['Open Events', 'events'],
    },
    {
        match: /^(reminder|reminders|my reminders|set a reminder|notifications?)$/,
        text: 'Reminders live in Calendar — open a day, tap the + button, choose Reminder, and turn on a notification for it.',
        action: ['Open Calendar', 'calendar'],
    },
    {
        match: /^(export|exports)$/,
        text: 'Open an event\'s details and tap "Add to device calendar" to download it as a calendar file your device can open.',
        action: ['Open Calendar', 'calendar'],
    },
];

function resolveHowTo(t) {
    for (const topic of HOWTO_TOPICS) {
        if (topic.match.test(t)) {
            const [label, destId] = topic.action;
            const dest = getDestination(destId);
            if (!dest) continue;
            return { text: topic.text, actions: [navAction(label, dest.route)] };
        }
    }
    return null;
}

// "open X" / "go to X" / "show me X" / "take me to X" / "where is X" /
// "where can i find/see X" — a direct navigation command naming a real
// screen. Never fires without a confident destination match.
const NAV_COMMAND_RE = /^(open|go to|take me to|navigate to)\s+(.+)$|^show me\s+(.+)$|^where (?:is|are)\s+(.+?)[?.\s]*$|^where (?:can|do) i (?:find|see|read)\s+(.+?)[?.\s]*$/;

function resolveNavCommand(t) {
    const m = t.match(NAV_COMMAND_RE);
    if (!m) return null;
    const phrase = (m[2] || m[3] || m[4] || m[5] || '').trim();
    if (!phrase) return null;
    const dest = findDestination(phrase);
    if (!dest) return null;
    return {
        text: `Here's ${dest.title}.`,
        actions: [navAction(`Open ${dest.title}`, dest.route)],
    };
}

// A bare search fragment ("advisor", "privacy", "calendar") that matches a
// real screen directly (not an event name — that's handled separately in
// engine.js, since it needs the event resolver's own confidence signals).
// Deliberately restricted to short messages, same reasoning as the
// event-filter queries: a destination word appearing inside a much longer
// sentence is not a signal to jump straight to that screen.
export function resolveBareFragment(t, wordCount) {
    if (wordCount > 4) return null;
    const dest = findDestination(t);
    if (!dest) return null;
    return {
        text: `${dest.description}`,
        actions: [navAction(`Open ${dest.title}`, dest.route)],
    };
}

export function resolveNavigation(t, wordCount) {
    return resolveHowTo(t) || resolveNavCommand(t) || resolveBareFragment(t, wordCount);
}
