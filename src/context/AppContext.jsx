import { createContext, useContext, useEffect, useState } from 'react';
import { fetchEvents } from '../services/eventsService.js';
import { setEvents } from '../data/events.js';

const KEY = 'tsa-hub-state-v1';

// No accounts. Everything lives locally on the device.
// `prefs` holds the small set of user-chosen preferences (name, state, ...).
// `theme` is 'dark' | 'light' and is applied to <html data-theme>.
const EMPTY = {
  prefs: { name: '', state: '' },
  theme: 'dark',
  myEvents: [],
  tasks: [],
  checklists: {},
  notes: '',
  meetings: [],
  teamMembers: [],
  coachCount: 0,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw);
    // Merge, and make sure prefs always has its default shape.
    return {
      ...EMPTY,
      ...saved,
      theme: saved.theme === 'light' ? 'light' : 'dark',
      prefs: { ...EMPTY.prefs, ...(saved.prefs || {}) },
    };
  } catch {
    return EMPTY;
  }
}

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(load);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Persist everything (there is no account, so all state is local).
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
    }
  }, [state]);

  // Apply the chosen theme to the document root so token overrides kick in.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme || 'dark');
  }, [state.theme]);

  const uid = () => Math.random().toString(36).slice(2, 9);

  // Events are read anonymously (no login required).
  useEffect(() => {
    let alive = true;
    fetchEvents()
        .then((rows) => {
          if (!alive) return;
          console.log('EVENT SAMPLE:', rows[0]);   // ← добавь эту строку
          setEvents(rows);
        })
        .catch(() => {
          if (alive) setEvents([]);
        })
        .finally(() => {
          if (alive) setEventsLoading(false);
        });
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
    // ---- preferences ----
    setName(name) {
      setState((s) => ({ ...s, prefs: { ...s.prefs, name } }));
    },
    setStatePref(stateName) {
      setState((s) => ({ ...s, prefs: { ...s.prefs, state: stateName } }));
    },

    // ---- theme ----
    setTheme(theme) {
      setState((s) => ({ ...s, theme: theme === 'light' ? 'light' : 'dark' }));
    },
    toggleTheme() {
      setState((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
    },

    // ---- my events / checklists ----
    addEvent(eventId) {
      setState((s) => {
        if (s.myEvents.includes(eventId)) return s;
        return {
          ...s,
          myEvents: [...s.myEvents, eventId],
          checklists: { ...s.checklists, [eventId]: s.checklists[eventId] || [] },
        };
      });
    },

    addChecklistItem(eventId, label) {
      setState((s) => ({
        ...s,
        checklists: {
          ...s.checklists,
          [eventId]: [...(s.checklists[eventId] || []), { id: uid(), label, done: false }],
        },
      }));
    },

    removeChecklistItem(eventId, itemId) {
      setState((s) => ({
        ...s,
        checklists: { ...s.checklists, [eventId]: (s.checklists[eventId] || []).filter((i) => i.id !== itemId) },
      }));
    },

    removeEvent(eventId) {
      setState((s) => ({
        ...s,
        myEvents: s.myEvents.filter((id) => id !== eventId),
      }));
    },

    toggleChecklist(eventId, itemId) {
      setState((s) => ({
        ...s,
        checklists: {
          ...s.checklists,
          [eventId]: (s.checklists[eventId] || []).map((it) =>
              it.id === itemId ? { ...it, done: !it.done } : it
          ),
        },
      }));
    },

    // ---- tasks ----
    addTask({ title, assignee, eventId, due }) {
      setState((s) => ({
        ...s,
        tasks: [...s.tasks, { id: uid(), title, assignee, eventId: eventId || '', status: 'todo', due: due || '' }],
      }));
    },

    moveTask(taskId, status) {
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      }));
    },

    deleteTask(taskId) {
      setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }));
    },

    // ---- notes ----
    setNotes(notes) {
      setState((s) => ({ ...s, notes }));
    },

    // ---- meetings ----
    addMeeting({ date, title }) {
      setState((s) => ({
        ...s,
        meetings: [...s.meetings, { id: uid(), date, title }].sort((a, b) =>
            a.date.localeCompare(b.date)
        ),
      }));
    },

    removeMeeting(id) {
      setState((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== id) }));
    },

    // ---- team ----
    addMember({ name, role }) {
      setState((s) => ({
        ...s,
        teamMembers: [...s.teamMembers, { id: uid(), name, role }],
      }));
    },

    removeMember(id) {
      setState((s) => ({ ...s, teamMembers: s.teamMembers.filter((m) => m.id !== id) }));
    },

    // ---- coach ----
    bumpCoach() {
      setState((s) => ({ ...s, coachCount: s.coachCount + 1 }));
    },

    resetAll() {
      localStorage.removeItem(KEY);
      setState(EMPTY);
    },
  };

  function progressFor(eventId) {
    const list = state.checklists[eventId] || [];
    const tasks = state.tasks.filter((t) => t.eventId === eventId);
    const total = list.length + tasks.length;
    if (total === 0) return 0;
    const done = list.filter((i) => i.done).length + tasks.filter((t) => t.status === 'done').length;
    return Math.round((done / total) * 100);
  }

  return (
      <Ctx.Provider
          value={{
            ...state,
            ...actions,
            eventsLoading,
            progressFor,
            // back-compat shims (there is no account/profile or chats anymore)
            profile: null,
            unreadTotal: 0,
            unreadFor: () => 0,
          }}
      >
        {children}
      </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}