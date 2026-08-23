import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { answer, resetConversation } from '../services/chatbot/engine.js';

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
    ],
  },
  {
    id: 'rules',
    label: 'Rules & Requirements',
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
    ],
  },
  {
    id: 'deadlines',
    label: 'Deadlines & Conference',
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
    ],
  },
  {
    id: 'careers',
    label: 'Careers & Majors',
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
    ],
  },
  {
    id: 'start',
    label: 'Getting Started',
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
    ],
  },
  {
    id: 'other',
    label: 'Other',
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
    ],
  },
];

const PAGE_SIZE = 4;

function slice(pool, page) {
  if (pool.length <= PAGE_SIZE) return pool;
  const start = (page * PAGE_SIZE) % pool.length;
  const out = [];
  for (let i = 0; i < PAGE_SIZE; i++) out.push(pool[(start + i) % pool.length]);
  return out;
}

export default function Coach() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Every message, typed or tapped, goes through this one path so buttons and
  // typing can never drift apart.
  function send(text) {
    const q = (text || '').trim();
    if (!q) return;
    const res = answer(q);
    setMessages((m) => [
      ...m,
      { role: 'user', text: q },
      { role: 'bot', text: res.text, suggestions: res.suggestions || [] },
    ]);
    setInput('');
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

  // Clearing the screen must also clear the engine's conversation memory,
  // otherwise the assistant still remembers the previous event.
  function clearChat() {
    setMessages([]);
    setInput('');
    resetConversation();
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
                            <span className="cch-who-dot" aria-hidden="true" />
                            TSA Assistant
                          </div>
                          <div className="cch-card">
                            Here are some frequently asked questions related to "{m.label}":
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
                  return (
                      <div className="cch-block" key={i}>
                        <div className="cch-who">
                          <span className="cch-who-dot" aria-hidden="true" />
                          TSA Assistant
                        </div>
                        <div className="cch-card">{m.text}</div>
                        {m.suggestions && m.suggestions.length > 0 && (
                            <div className="cch-chips">
                              {m.suggestions.map((s) => (
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
              send(input);
            }}
        >
          <div className="cch-field">
            <input
                className="cch-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
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