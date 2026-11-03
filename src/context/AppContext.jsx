import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchEvents, readCachedEvents, writeCachedEvents } from '../services/eventsService.js';
import { setEvents } from '../data/events.js';

const KEY = 'tsa-hub-state-v1';

// No accounts. Everything lives locally on the device.
// `prefs` holds the small set of user-chosen preferences (name, state, ...).
// `theme` is 'dark' | 'light' and is applied to <html data-theme>.
const EMPTY = {
  prefs: { name: '', state: '' },
  theme: 'dark',
  myEvents: [],
  coachCount: 0,
  // Home "Quick Actions" customization: null means "use the default 9"
  // (src/data/quickActions.js); once set, an ordered array of registry ids.
  quickActions: null,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw);
    // Drop data from the removed project-management features.
    for (const key of ['tasks', 'checklists', 'notes', 'meetings', 'teamMembers']) delete saved[key];
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

const EVENTS_TIMEOUT_MS = 20000;

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(load);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [eventsAttempt, setEventsAttempt] = useState(0);
  const reloadEvents = useCallback(() => {
    setEventsError(false);
    setEventsLoading(true);
    setEventsAttempt((n) => n + 1);
  }, []);

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

  // Events are read anonymously (no login required).
  useEffect(() => {
    let alive = true;
    // Offline or slow: fall back to the last good copy, if there is one.
    const useCachedOrFail = () => {
      const cached = readCachedEvents();
      if (cached) {
        setEvents(cached);
        setEventsError(false);
      } else {
        setEvents([]);
        setEventsError(true);
      }
    };
    const timer = setTimeout(() => {
      if (!alive) return;
      useCachedOrFail();
      setEventsLoading(false);
    }, EVENTS_TIMEOUT_MS);
    fetchEvents()
        .then((rows) => {
          if (!alive) return;
          setEvents(rows);
          setEventsError(false);
          writeCachedEvents(rows);
        })
        .catch(() => {
          if (!alive) return;
          useCachedOrFail();
        })
        .finally(() => {
          clearTimeout(timer);
          if (alive) setEventsLoading(false);
        });
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [eventsAttempt]);

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

    // ---- my events ----
    addEvent(eventId) {
      setState((s) => {
        if (s.myEvents.includes(eventId)) return s;
        return { ...s, myEvents: [...s.myEvents, eventId] };
      });
    },

    removeEvent(eventId) {
      setState((s) => ({
        ...s,
        myEvents: s.myEvents.filter((id) => id !== eventId),
      }));
    },

    // ---- home quick actions ----
    setQuickActions(ids) {
      setState((s) => ({ ...s, quickActions: ids }));
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

  return (
      <Ctx.Provider
          value={{
            ...state,
            ...actions,
            eventsLoading,
            eventsError,
            reloadEvents,
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