import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { answer, resetConversation, getActiveState, getConversationState, setConversationState } from '../services/chatbot/engine.js';
import { EVENTS, getEvent, eventsForDivision, teamSizeLabel } from '../data/events.js';
import { US_STATES } from '../data/stateTsa.js';
import { answerEventFilter } from '../services/chatbot/resolvers/eventFilters.js';
import { preconferenceFor } from '../services/chatbot/resolvers/events.js';
import {
  renderStep,
  createGuidedFlow,
  applyStep,
  applyBack,
  applyReset,
  applySelect,
  matchFreeText,
} from '../services/chatbot/flows/coachFlows.js';
import { saveCoachSession, loadCoachSession, clearCoachSession } from '../services/coachSession.js';
import { useApp } from '../context/AppContext.jsx';
import coachAvatar from '../assets/img/coach.png';

// Single source of truth for the TSA Assistant avatar, used everywhere the
// "who said this" label is shown in the chat thread.
function AssistantAvatar() {
  return (
      <span className="cch-who-avatar">
        <img src={coachAvatar} alt="TSA Assistant" />
      </span>
  );
}

// Topic icons, each one colored so the grid reads at a glance.
function CalendarIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
  );
}
function ShieldIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
  );
}
function ClockIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
  );
}
function CapIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9l10-5 10 5-10 5z" />
        <path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
      </svg>
  );
}
function RocketIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.5 3.5c3.5 0 7 3.5 7 7 0 5-5.5 8.5-9 10L5 14c1.5-3.5 5-10.5 8.5-10.5z" />
        <circle cx="14.5" cy="9.5" r="1.8" />
        <path d="M6.5 15.5c-1.5 1.5-1.5 4-1.5 4s2.5 0 4-1.5" />
      </svg>
  );
}
function MenuIcon() {
  return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
  );
}

// Topics shown in the grid. Each holds a pool of questions, the FAQ block shows
// a slice of four and Regenerate rotates to the next slice.
const TOPICS = [
  {
    id: 'events',
    label: 'Events',
    intro: "I can explain any TSA event, tell you what the current challenge is, compare events, or help you pick one based on what you like. If you already have an event in mind, tell me its name. If not, I can help narrow it down.",
    tone: 'blue',
    Icon: CalendarIcon,
    pool: [
      'How big is the team for Webmaster?',
      'How much does Animatronics cost?',
      'How hard is Video Game Design?',
      'What is Audio Podcasting about?',
      'What category is Architectural Design?',
      'How much time does Animatronics take?',
      'What is the theme for Audio Podcasting?',
      'Can I do Audio Podcasting solo?',
      'What careers does Webmaster lead to?',
      'What is the eligibility for Software Development?',
      'Does Webmaster need state advisor approval?',
      'What is the preconference submission for Video Game Design?',
      'How hard is Coding?',
      'Can I compete alone in Software Development?',
      'What is the team size for Robotics?',
      'How much does Flight Endurance cost?',
      'What category is Cybersecurity?',
      'What is Forensic Science about?',
      'How much time does Digital Video Production take?',
      'What careers does Data Science lead to?',

      'How big is the team for Structural Engineering?',
      'What is Extemporaneous Speech about?',
      'Can I do Photographic Technology solo?',
      'How much does Drone Challenge cost?',
      'What category is Music Production?',
      'How hard is Engineering Design?',
      'What is the theme for Children\'s Stories?',
      'How much time does Coding take?',
      'What careers does Biotechnology Design lead to?',
      'Does Digital Video Production need advisor approval?',
      'What is the eligibility for Fashion Design?',
      'What is the preconference submission for Music Production?',
    ],
  },
  {
    id: 'rules',
    label: 'Rules & Requirements',
    intro: "I can help with things like team size, materials, submissions, AI use, presentation requirements, and what you can bring to competition. Tell me the event you're working on and what you're unsure about.",
    tone: 'blue',
    Icon: ShieldIcon,
    pool: [
      'Can we use AI on our project?',
      'What is the TSA dress code?',
      'How do I cite my sources?',
      'Can teammates switch after registration?',
      'What happens if I plagiarize?',
      'Are we allowed to use ChatGPT?',
      'What is the submission deadline?',
      'Can I reuse last year\'s project?',
      'What are the display size limits?',
      'Do I need talent releases for my video?',
      'What are the rules about original work?',
      'How does judging work?',
      'What is a 20% rules violation?',
      'Can I get disqualified?',
      'How do I file a grievance?',
      'What devices can I bring to a test?',
      'Are external keyboards allowed?',
      'What is the honor statement?',
      'How many events can I enter?',
      'Do all team members take the test?',

      'What citation styles are accepted?',
      'Can I use stock images?',
      'What are the copyright rules?',
      'Are we allowed to use code libraries?',
      'What happens if my video is too long?',
      'Can I use music I found online?',
      'What is the maximum display height?',
      'Do I need a copyright checklist?',
      'Can my advisor help with my project?',
      'What counts as original work?',
      'Are AI generated images allowed?',
      'What is the LEAP component?',
    ],
  },
  {
    id: 'deadlines',
    label: 'Deadlines & Conference',
    intro: "I can check National TSA dates, conference deadlines, registration dates, TSA Week, and other official calendar items. You can ask something simple like \"what's coming up next?\"",
    tone: 'purple',
    Icon: ClockIcon,
    pool: [
      'When is my state conference?',
      'How many days until nationals?',
      'When are regionals?',
      'When is the preconference deadline?',
      'When is the registration deadline?',
      'When does chapter registration close?',
      'How many days until state conference?',
      'When is the national conference?',
      'What are the important dates this season?',
      'When do I need to upload my submission?',
      'When is the submission window for nationals?',
      'How much time do I have until regionals?',
      'When are the 2027 regionals for Virginia?',
      'What is the nationals date?',
      'When does the conference start?',
      'How many days until the awards ceremony?',
      'When is the opening session?',
      'When are advisor meetings?',
      'What day is the business meeting?',
      'When is the awards ceremony?',

      'When is the last day to register?',
      'How long is the submission upload window?',
      'When do semifinalist results come out?',
      'When is the pin exchange?',
      'When is the meet and greet?',
      'When does the TSA store open?',
      'How many days until state for Virginia?',
      'When does the conference end?',
      'When is the recognition assembly?',
      'When are the shuttle hours?',
      'What time does the opening session start?',
      'When is luggage storage available?',
    ],
  },
  {
    id: 'careers',
    label: 'Careers & Majors',
    intro: "I can connect TSA events to majors and careers and help you find events that fit what you're interested in. Tell me what you enjoy or what career you're thinking about.",
    tone: 'green',
    Icon: CapIcon,
    pool: [
      'What careers does Architectural Design lead to?',
      'Which events connect to software careers?',
      'What careers does Animatronics lead to?',
      'Which events fit engineering majors?',
      'What careers does Coding connect to?',
      'Which events are good for someone interested in medicine?',
      'What careers does Video Game Design lead to?',
      'Which events connect to cybersecurity?',
      'What careers does Fashion Design lead to?',
      'Which events are good for marketing majors?',
      'What career paths does Robotics support?',
      'Which events connect to aerospace careers?',
      'What careers does Digital Video Production lead to?',
      'Which events fit a business major?',
      'What careers does Audio Podcasting connect to?',
      'Which events are good for graphic design?',
      'What careers does Data Science lead to?',
      'Which events fit civil engineering?',
      'What careers does STEM Mass Media connect to?',
      'Which events are good for education majors?',

      'What careers does Structural Engineering lead to?',
      'Which events are good for computer science?',
      'What careers does Extemporaneous Speech lead to?',
      'Which events fit a pre-med student?',
      'What careers does Drone Challenge lead to?',
      'Which events connect to manufacturing?',
      'What careers does Forensic Science lead to?',
      'Which events are good for film production?',
      'What careers does Music Production lead to?',
      'Which events fit transportation careers?',
      'What careers does Photographic Technology lead to?',
      'Which events connect to game development?',
    ],
  },
  {
    id: 'start',
    label: 'Getting Started',
    intro: "If you're new to TSA, I can help you figure out what competitions are like, choose your first event, understand what you should do next, or prepare for your first conference. You don't need to know where to start.",
    tone: 'orange',
    Icon: RocketIcon,
    pool: [
      'How do I pick an event?',
      'What events can I do solo?',
      'What is a beginner friendly event?',
      'What are the low cost events?',
      'How do TSA competitions work?',
      'What is TSA?',
      'How many events are there?',
      'What divisions does TSA have?',
      'Can I compete as an individual?',
      'What do I need to get started?',
      'How do I join a TSA chapter?',
      'What events involve coding?',
      'What events involve building?',
      'What events involve video?',
      'Are there events about robotics?',
      'What is the cheapest event to enter?',
      'Which events have no preconference submission?',
      'What events are good for beginners?',
      'Can I do more than one event?',
      'How do I find my state TSA website?',

      'What events involve presentations?',
      'What events involve research?',
      'Are there events about fashion?',
      'What is the easiest event to start with?',
      'How many events should I sign up for?',
      'Can beginners compete at nationals?',
      'What events need materials or supplies?',
      'What events are fully digital?',
      'Are there events about architecture?',
      'What events involve a written test?',
      'Do all events have interviews?',
      'What events involve audio or music?',
    ],
  },
  {
    id: 'other',
    label: 'Other',
    intro: "Sure. Ask me whatever you're trying to figure out about TSA or TSA Hub. You can phrase it normally — if I need more information, I'll ask.",
    tone: 'grey',
    Icon: MenuIcon,
    pool: [
      'What is TSA?',
      'What divisions are there?',
      'How many events are there?',
      'What can you help me with?',
      'Who are the national officers?',
      'Where is the national conference?',
      'What is the conference theme?',
      'How do I contact TSA?',
      'What is the TSA Store?',
      'Where do I find official rules?',
      'What is the TSA pin exchange?',
      'How do semifinalists get selected?',
      'What is the awards ceremony?',
      'How does the business meeting work?',
      'What are conference ribbons?',
      'Is there a conference app?',
      'What should I bring to the conference?',
      'Where is the information desk?',
      'Are there shuttles at the conference?',
      'What is the TSA Meet and Greet?',

      'What is Forward to Fifty?',
      'How do voting delegates work?',
      'What is the Parade of State Flags?',
      'Who is the TSA president?',
      'What is Chapter Team?',
      'How do I become a national officer?',
      'What is the conference dress code?',
      'Can parents attend the conference?',
      'What is the code of conduct?',
      'Are there scholarships through TSA?',
      'What is the Achievement Program?',
      'How does the national officer election work?',
    ],
  },
];

const PAGE_SIZE = 4;

// Auto-welcome copy, reflecting Coach's positioning as TSA Hub's search /
// navigation / help layer rather than a general-purpose chatbot.
const WELCOME_TEXT = "Hey, I'm TSA Assistant. I can help you find things in TSA Hub. Pick something below, or just type what you're looking for.";

// Module-level, not component state: this must survive Coach unmounting and
// remounting (navigating away and back) so the greeting only ever plays once
// per app session. Only a full page reload resets it.
let coachWelcomed = false;

function slice(pool, page) {
  if (pool.length <= PAGE_SIZE) return pool;
  const start = (page * PAGE_SIZE) % pool.length;
  const out = [];
  for (let i = 0; i < PAGE_SIZE; i++) out.push(pool[(start + i) % pool.length]);
  return out;
}

export default function Coach() {
  const navigate = useNavigate();
  const { eventsLoading } = useApp();

  // Read once, synchronously, before any other state initializes — this is
  // what lets a restored conversation land fully-formed on the very first
  // render, so the welcome effect below never sees an empty `messages` and
  // never replays for a session that's actually being continued.
  const [initialSession] = useState(() => {
    const s = loadCoachSession();
    // coachWelcomed is module-scoped, so it survives across mounts within
    // the same SPA lifetime. A truly-expired (or never-existing) session
    // must still get the FULL delayed welcome, even if the welcome already
    // played once earlier in this browser tab — otherwise an expired return
    // would wrongly skip straight to the no-greeting instant home-menu.
    // Only an explicit-clear-then-quick-return (which saves a fresh,
    // still-valid, empty session — see clearChat()) should keep skipping
    // the greeting, and that case has a truthy `s`, so this reset never
    // fires for it.
    if (!s) {
      coachWelcomed = false;
      // An expired (or never-existing) session must be a genuinely fresh
      // start, not just an empty-looking chat thread — the engine's own
      // conversation memory (activeEvent, pendingClarification, etc.) is a
      // separate, persistent module-level store that survives a Coach
      // remount on its own and is NOT cleared just by the UI resetting its
      // messages. Without this, a truly expired session could silently
      // resume answering as if the old (erased) conversation were still
      // active.
      resetConversation();
    }
    return s;
  });

  const [messages, setMessages] = useState(() => initialSession?.messages || []);
  const [input, setInput] = useState('');
  const [guidedFlow, setGuidedFlow] = useState(() => initialSession?.guidedFlow || null);
  const [shownEventIds, setShownEventIds] = useState(() => initialSession?.shownEventIds || []);
  const endRef = useRef(null);
  const inputRef = useRef('');

  // Canonical app data handed to the flow registry — coachFlows.js stays
  // framework-free and doesn't import any of this itself.
  const flowData = useMemo(() => ({
    EVENTS, getEvent, eventsForDivision, teamSizeLabel, answerEventFilter, preconferenceFor,
    US_STATES, activeState: getActiveState(), shownEventIds,
  }), [messages, shownEventIds]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Restore the engine's full conversation state (activeEvent, activeState,
  // pendingClarification, etc.) once on mount, and mark the module-level
  // welcome flag so a successfully-restored session never replays the
  // greeting. Declared before the welcome effect so it always runs first.
  useEffect(() => {
    if (initialSession) {
      coachWelcomed = true;
      if (initialSession.engineState) setConversationState(initialSession.engineState);
    }
  }, []);

  // Save the latest snapshot exactly once, on unmount (i.e. on actually
  // leaving Coach) — this is what starts the 5-minute grace window. A ref is
  // kept in sync every render so the cleanup (which otherwise closes over
  // stale state) always sees the latest values.
  const latestRef = useRef();
  latestRef.current = { messages, guidedFlow, shownEventIds };
  useEffect(() => () => {
    saveCoachSession({ ...latestRef.current, engineState: getConversationState() });
  }, []);

  // A restored session can render its very first paint before the app's
  // event catalog has finished loading (EVENTS starts empty and is filled in
  // asynchronously elsewhere) — a fresh session never notices this because
  // the 2.5s welcome delay comfortably outlasts the fetch, but a restored
  // guided-flow step showing an event list renders immediately. `EVENTS` is
  // a plain mutable module array, not reactive state, so once it's actually
  // populated nothing would otherwise prompt Coach to recompute the step
  // that already rendered against the empty array. Forcing one extra
  // render right when loading finishes fixes that with no restore-logic
  // changes needed.
  const wasEventsLoading = useRef(eventsLoading);
  useEffect(() => {
    if (wasEventsLoading.current && !eventsLoading) {
      setMessages((m) => [...m]);
    }
    wasEventsLoading.current = eventsLoading;
  }, [eventsLoading]);

  // Fire the auto-welcome once ever this session, after a short delay, only
  // into a still-empty conversation the user hasn't already started typing
  // or sending into. On every OTHER fresh/cleared conversation (the welcome
  // already played once), the guided home menu still seeds immediately, with
  // no delay and no repeated greeting — the guided tree stays reachable
  // without ever showing the intro disclaimer twice. Both cases share the
  // same "home" guided-flow step taps use later.
  useEffect(() => {
    if (messages.length > 0) return;
    if (coachWelcomed) {
      setGuidedFlow(createGuidedFlow());
      setMessages([{ role: 'flow', stepId: 'home', context: {}, searchQuery: '' }]);
      return;
    }
    const timer = setTimeout(() => {
      if (inputRef.current.trim()) return;
      setMessages((current) => {
        if (current.length > 0) return current;
        coachWelcomed = true;
        setGuidedFlow(createGuidedFlow());
        return [{ role: 'flow', stepId: 'home', context: {}, intro: WELCOME_TEXT, searchQuery: '' }];
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [messages.length]);

  // Every message, typed or tapped, goes through this one path so buttons and
  // typing can never drift apart.
  function send(text) {
    const q = (text || '').trim();
    if (!q) return;
    const res = answer(q);
    setMessages((m) => [
      ...m,
      { role: 'user', text: q },
      { role: 'bot', text: res.text, suggestions: res.suggestions || [], actions: res.actions || [], mailto: res.mailto || null },
    ]);
    setInput('');
    inputRef.current = '';
  }

  // Like send(), but shows the engine's answer without a matching user
  // bubble — used when free text already got its own bubble and we're just
  // resolving the guided step it matched, not asking a second question.
  function appendAnswer(question) {
    const res = answer(question);
    setMessages((m) => [
      ...m,
      { role: 'bot', text: res.text, suggestions: res.suggestions || [], actions: res.actions || [], mailto: res.mailto || null },
    ]);
  }

  function pushFlowMessage(gf) {
    setMessages((m) => [...m, { role: 'flow', stepId: gf.stepId, context: gf.context, searchQuery: '' }]);
    // Record any event ids this step is about to preview, so later branch
    // previews / recommendation regenerations can prefer events the session
    // hasn't shown yet. Rendering here is cheap and pure — coachFlows.js
    // steps do no side effects.
    const rendered = renderStep(gf.stepId, gf.context, flowData);
    if (rendered.previewEventIds?.length) {
      setShownEventIds((ids) => [...new Set([...ids, ...rendered.previewEventIds])]);
    }
  }

  // Every guided-flow tap echoes the exact label the user tapped as a plain
  // user bubble — same component/style as a typed message — before the
  // structured action runs. This never goes through the NLU engine; it's
  // purely a rendering step so the guided flow reads like a conversation.
  function pushUserLabel(label) {
    setMessages((m) => [...m, { role: 'user', text: label }]);
  }

  // Handles a tap (or a free-text match standing in for one) on a guided-flow
  // block. NAVIGATE and FLOW_ASK are leaves — they don't move the flow
  // cursor. FLOW_STEP does, and may itself resolve straight to an answer
  // (e.g. the state-advisor shortcut when the state is already known).
  // fromFreeText taps skip the echo — the user's own typed text already
  // appears as the bubble (added by submitTyped before calling this).
  function runFlowAction(b, fromFreeText, base) {
    const action = b.action;
    if (!fromFreeText) pushUserLabel(b.label);
    if (action.type === 'NAVIGATE') {
      navigate(action.route);
      return;
    }
    if (action.type === 'FLOW_ASK') {
      appendAnswer(action.question);
      return;
    }
    const next = applyStep(base, b, flowData);
    setGuidedFlow(next);
    pushFlowMessage(next);
    if (next.leaf?.type === 'SEND') appendAnswer(next.leaf.question);
  }

  function handleFlowSelect(kind, itemId, itemLabel, base) {
    pushUserLabel(itemLabel);
    const next = applySelect(base, kind, itemId, flowData);
    setGuidedFlow(next);
    pushFlowMessage(next);
    if (next.leaf?.type === 'SEND') appendAnswer(next.leaf.question);
  }

  function handleFlowBack() {
    pushUserLabel('Back');
    const next = applyBack(guidedFlow);
    setGuidedFlow(next);
    pushFlowMessage(next);
  }

  function handleFlowReset() {
    pushUserLabel('Start over');
    const next = applyReset();
    setGuidedFlow(next);
    pushFlowMessage(next);
  }

  // The message-bar submit path only: checks whether typed text looks like
  // an answer to the currently-showing guided step before falling through to
  // the normal engine. A guided flow is guidance, never a trap — anything
  // that doesn't match abandons it and answers normally.
  function submitTyped(text) {
    const q = (text || '').trim();
    if (!q) return;
    if (guidedFlow) {
      const stepResult = renderStep(guidedFlow.stepId, guidedFlow.context, flowData);
      const matched = matchFreeText(stepResult, q);
      if (matched) {
        setMessages((m) => [...m, { role: 'user', text: q }]);
        setInput('');
        inputRef.current = '';
        runFlowAction(matched, true, guidedFlow);
        return;
      }
      setGuidedFlow(null);
    }
    send(q);
  }

  // Tapping a topic posts a FAQ block with that topic's questions.
  function openTopic(topic) {
    setMessages((m) => [
      ...m,
      { role: 'user', text: topic.label },
      { role: 'faq', topicId: topic.id, label: topic.label, page: 0 },
    ]);
  }

  // Regenerate rotates the FAQ block to the next slice of its pool.
  function regenerate(index) {
    setMessages((m) => m.map((msg, i) => (i === index ? { ...msg, page: msg.page + 1 } : msg)));
  }

  function updateFlowSearch(index, value) {
    setMessages((m) => m.map((msg, i) => (i === index ? { ...msg, searchQuery: value } : msg)));
  }

  // Clearing the screen must also clear the engine's conversation memory
  // and the persisted 5-minute session — otherwise the assistant still
  // remembers the previous event, or a later return restores the chat this
  // explicit clear was meant to erase.
  function clearChat() {
    setMessages([]);
    setInput('');
    inputRef.current = '';
    setGuidedFlow(null);
    setShownEventIds([]);
    resetConversation();
    clearCoachSession();
  }

  const started = messages.length > 0;

  return (
      <div className="cch-page">
        {/* Header with back arrow, title, and a clear chat action */}
        <header className="cch-head">
          <button className="cch-icon-btn" onClick={() => navigate('/')} aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="cch-head-title">TSA Assistant</h1>
          <button className="cch-icon-btn" onClick={clearChat} aria-label="Clear chat">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
          </button>
        </header>

        <div className="cch-scroll">
          {/* Topic picker, always available at the top of the conversation */}
          <div className="cch-intro">
            <h2 className="cch-lead">
              We're here to help!
              <br />
              Select a topic.
            </h2>

            <div className="cch-grid">
              {TOPICS.map((t) => (
                  <button className="cch-topic" key={t.id} onClick={() => openTopic(t)}>
                    <span className={`cch-topic-ico cch-tone-${t.tone}`}>
                      <t.Icon />
                    </span>
                    <span className="cch-topic-label">{t.label}</span>
                  </button>
              ))}
            </div>

            <p className="cch-note">
              Answers are based on TSA resources and may not always be perfect.{' '}
              <button className="cch-note-link" onClick={() => send('What can you help me with?')}>
                Learn more
              </button>
            </p>
          </div>

          {started && (
              <div className="cch-thread">
                {messages.map((m, i) => {
                  if (m.role === 'faq') {
                    const topic = TOPICS.find((t) => t.id === m.topicId);
                    const questions = slice(topic ? topic.pool : [], m.page);
                    return (
                        <div className="cch-block" key={i}>
                          <div className="cch-who">
                            <AssistantAvatar />
                            TSA Assistant
                          </div>
                          <div className="cch-card">
                            {topic?.intro ? `${topic.intro} Here are a few common questions to start with:` : `Here are some frequently asked questions related to "${m.label}":`}
                          </div>
                          {questions.map((q) => (
                              <button className="cch-faq-item" key={q} onClick={() => send(q)}>
                                <span>{q}</span>
                                <span className="cch-faq-arrow" aria-hidden="true">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M13 6l6 6-6 6" />
                                  </svg>
                                </span>
                              </button>
                          ))}
                          {topic && topic.pool.length > PAGE_SIZE && (
                              <button className="cch-regen" onClick={() => regenerate(i)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                                  <path d="M21 3v6h-6" />
                                </svg>
                                Regenerate
                              </button>
                          )}
                        </div>
                    );
                  }
                  if (m.role === 'user') {
                    return (
                        <div className="cch-user" key={i}>
                          {m.text}
                        </div>
                    );
                  }
                  if (m.role === 'flow') {
                    const stepResult = renderStep(m.stepId, m.context, flowData);
                    const base = { stepId: m.stepId, context: m.context, history: guidedFlow?.history || [] };
                    // "Current" means this message IS the guided flow's active
                    // step — not merely the last message in the thread, since
                    // a FLOW_ASK leaf appends its answer below without moving
                    // the flow cursor, and Back/Start over should still show.
                    const isCurrent = guidedFlow && guidedFlow.stepId === m.stepId && JSON.stringify(guidedFlow.context) === JSON.stringify(m.context);
                    const query = (m.searchQuery || '').trim().toLowerCase();
                    const rowBlocks = stepResult.blocks.filter((b) => b.kind !== 'chip');
                    const chipBlocks = stepResult.blocks.filter((b) => b.kind === 'chip');
                    return (
                        <div className="cch-block" key={i}>
                          <div className="cch-who">
                            <AssistantAvatar />
                            TSA Assistant
                          </div>
                          <div className="cch-card">{m.intro || stepResult.prompt}</div>
                          {rowBlocks.length > 0 && (
                              <div className="cch-actions">
                                {rowBlocks.map((b) => {
                                  const className = b.kind === 'topic' ? 'cch-topic-block' : 'cch-faq-item';
                                  return (
                                      <button className={className} key={b.id} onClick={() => runFlowAction(b, false, base)}>
                                        <span>
                                          {b.label}
                                          {b.kind === 'event-result' && b.meta && <span className="cch-event-result-meta">{b.meta}</span>}
                                        </span>
                                        <span className="cch-faq-arrow" aria-hidden="true">
                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M13 6l6 6-6 6" />
                                          </svg>
                                        </span>
                                      </button>
                                  );
                                })}
                              </div>
                          )}
                          {chipBlocks.length > 0 && (
                              <div className="cch-chips">
                                {chipBlocks.map((b) => (
                                    <button className="cch-chip" key={b.id} onClick={() => runFlowAction(b, false, base)}>{b.label}</button>
                                ))}
                              </div>
                          )}
                          {stepResult.selector && (
                              <div className="cch-selector">
                                <input
                                    className="cch-selector-search"
                                    value={m.searchQuery || ''}
                                    onChange={(e) => updateFlowSearch(i, e.target.value)}
                                    placeholder={stepResult.selector.placeholder || 'Search...'}
                                    aria-label={stepResult.selector.placeholder || 'Search'}
                                />
                                <div className="cch-selector-list">
                                  {stepResult.selector.items
                                      .filter((it) => !query || it.label.toLowerCase().includes(query))
                                      .slice(0, 60)
                                      .map((it) => (
                                          <button className="cch-faq-item" key={it.id} onClick={() => handleFlowSelect(stepResult.selector.kind, it.id, it.label, base)}>
                                            <span>{it.label}</span>
                                            <span className="cch-faq-arrow" aria-hidden="true">
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14M13 6l6 6-6 6" />
                                              </svg>
                                            </span>
                                          </button>
                                      ))}
                                  {stepResult.selector.items.filter((it) => !query || it.label.toLowerCase().includes(query)).length === 0 && (
                                      <div className="cch-selector-empty">No matches — try a different search.</div>
                                  )}
                                </div>
                              </div>
                          )}
                          {isCurrent && (guidedFlow.history.length > 0 || guidedFlow.stepId !== 'home') && (
                              <div className="cch-chips">
                                {guidedFlow.history.length > 0 && (
                                    <button className="cch-chip" onClick={handleFlowBack}>Back</button>
                                )}
                                {guidedFlow.stepId !== 'home' && (
                                    <button className="cch-chip" onClick={handleFlowReset}>Start over</button>
                                )}
                              </div>
                          )}
                        </div>
                    );
                  }
                  return (
                      <div className="cch-block" key={i}>
                        <div className="cch-who">
                          <AssistantAvatar />
                          TSA Assistant
                        </div>
                        <div className="cch-card">{m.text}</div>
                        {m.actions && m.actions.length > 0 && (
                            <div className="cch-actions">
                              {m.actions.map((a, ai) => (
                                  <button className="cch-faq-item" key={ai} onClick={() => navigate(a.route)}>
                                    <span>{a.label}</span>
                                    <span className="cch-faq-arrow" aria-hidden="true">
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M13 6l6 6-6 6" />
                                      </svg>
                                    </span>
                                  </button>
                              ))}
                            </div>
                        )}
                        {(m.mailto || (m.suggestions && m.suggestions.length > 0)) && (
                            <div className="cch-chips">
                              {m.mailto && (
                                  <a className="cch-chip cch-chip-mailto" href={m.mailto} target="_blank" rel="noreferrer">
                                    Open email
                                  </a>
                              )}
                              {(m.suggestions || []).map((s) => (
                                  <button className="cch-chip" key={s} onClick={() => send(s)}>
                                    {s}
                                  </button>
                              ))}
                            </div>
                        )}
                      </div>
                  );
                })}
                <div ref={endRef} />
              </div>
          )}
        </div>

        {/* Message field, send only, no attachment button */}
        <form
            className="cch-bar"
            onSubmit={(e) => {
              e.preventDefault();
              submitTyped(input);
            }}
        >
          <div className="cch-field">
            <input
                className="cch-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  inputRef.current = e.target.value;
                }}
                placeholder="Send a message..."
                aria-label="Send a message"
            />
            <button type="submit" className="cch-send" aria-label="Send" disabled={!input.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </div>
        </form>
      </div>
  );
}