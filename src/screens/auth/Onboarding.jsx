import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import {
  saveMyProfile,
  isUsernameAvailable,
  suggestUsername,
  divisionForGrade,
} from '../../services/profileService.js';
import { STATES } from '../../data/meta.js';

const GRADES = ['6', '7', '8', '9', '10', '11', '12'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useApp();
  const editing = !!(profile && profile.first_name);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [usernameTouched, setUsernameTouched] = useState(!!profile?.username);
  const [usernameState, setUsernameState] = useState('idle');
  const [usernameError, setUsernameError] = useState('');
  const [state, setStateField] = useState(profile?.state || '');
  const [city, setCity] = useState(profile?.city || '');
  const [school, setSchool] = useState(profile?.school || '');
  const [grade, setGrade] = useState(profile?.grade || '');
  const [chapter, setChapter] = useState(profile?.chapter || '');

  useEffect(() => {
    if (!usernameTouched && (firstName || lastName)) {
      setUsername(suggestUsername(firstName, lastName));
    }
  }, [firstName, lastName, usernameTouched]);

  useEffect(() => {
    if (step !== 1) return;
    const clean = username.trim().toLowerCase();
    if (clean.length < 6) {
      setUsernameState('short');
      setUsernameError('');
      return;
    }
    setUsernameState('checking');
    setUsernameError('');
    const t = setTimeout(async () => {
      try {
        const free = await isUsernameAvailable(clean);
        setUsernameState(free ? 'ok' : 'taken');
      } catch (err) {
        setUsernameState('error');
        setUsernameError(err?.message || String(err) || 'Check failed');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username, step]);

  const stepChecks = [
    firstName.trim().length > 0 && lastName.trim().length > 0,
    usernameState === 'ok',
    state.trim().length > 0 && city.trim().length > 0,
    grade && school.trim().length > 0,
    true,
  ];
  const VISIBLE = 5;

  function next() {
    setError('');
    if (step < VISIBLE - 1) setStep(step + 1);
  }
  function back() {
    setError('');
    if (step > 0) setStep(step - 1);
  }

  async function finish() {
    setSaving(true);
    setError('');
    try {
      await saveMyProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim().toLowerCase(),
        state: state.trim(),
        city: city.trim(),
        school: school.trim(),
        grade,
        division: divisionForGrade(grade),
      });
      await refreshProfile();
      navigate('/');
    } catch (err) {
      if (err.code === '23505') setError('That username was just taken. Pick another.');
      else setError(err?.message || 'Could not save. Try again.');
      setStep(1);
    } finally {
      setSaving(false);
    }
  }

  const uMsg = {
    idle: '',
    checking: 'Checking…',
    ok: 'Available',
    taken: 'Taken — try another',
    short: 'At least 6 characters',
    error: `Couldn't check: ${usernameError}`,
  }[usernameState];

  const uColor =
      usernameState === 'ok'
          ? 'var(--ok)'
          : usernameState === 'taken' || usernameState === 'short' || usernameState === 'error'
              ? 'var(--red-400)'
              : 'var(--muted)';

  return (
      <div className="onb">
        <div className="onb-progress">
          {Array.from({ length: VISIBLE }).map((_, i) => (
              <span key={i} className={`onb-dot ${i <= step ? 'on' : ''}`} />
          ))}
        </div>

        {step === 0 && (
            <div className="onb-step">
              <h1 className="onb-h">What's your name?</h1>
              <p className="onb-p">This is how you'll show up to teammates and chapters.</p>
              <div className="field">
                <label htmlFor="onb-first">First name</label>
                <input
                    id="onb-first"
                    className="input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="onb-last">Last name</label>
                <input
                    id="onb-last"
                    className="input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Your last name"
                />
              </div>
            </div>
        )}

        {step === 1 && (
            <div className="onb-step">
              <h1 className="onb-h">Create a username</h1>
              <p className="onb-p">We suggested one from your name. Change it if you like — at least 6 characters.</p>
              <div className="field">
                <label htmlFor="onb-user">Username</label>
                <input
                    id="onb-user"
                    className="input"
                    value={username}
                    onChange={(e) => {
                      setUsernameTouched(true);
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''));
                    }}
                    placeholder="your_username"
                    autoFocus
                />
                <p className="small" style={{ margin: '6px 0 0', color: uColor }}>
                  {uMsg}
                </p>
              </div>
            </div>
        )}

        {step === 2 && (
            <div className="onb-step">
              <h1 className="onb-h">Where are you?</h1>
              <p className="onb-p">Your state sets your TSA delegation and conference dates. United States is assumed.</p>
              <div className="field">
                <label htmlFor="onb-state">State</label>
                <select id="onb-state" className="input" value={state} onChange={(e) => setStateField(e.target.value)}>
                  <option value="">Select your state…</option>
                  {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="onb-city">City</label>
                <input
                    id="onb-city"
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Your city"
                />
              </div>
            </div>
        )}

        {step === 3 && (
            <div className="onb-step">
              <h1 className="onb-h">Your school</h1>
              <p className="onb-p">Type your school's name. Autocomplete from a schools dataset is coming later.</p>
              <div className="field">
                <label htmlFor="onb-school">School</label>
                <input
                    id="onb-school"
                    className="input"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Your school's name"
                    autoFocus
                />
              </div>
              <div className="field">
                <label>Grade</label>
                <div className="chip-row">
                  {GRADES.map((g) => (
                      <button key={g} type="button" className={`chip ${grade === g ? 'on' : ''}`} onClick={() => setGrade(g)}>
                        {g}th
                      </button>
                  ))}
                </div>
                {grade && (
                    <p className="small muted" style={{ margin: '6px 0 0' }}>
                      {divisionForGrade(grade) === 'MS' ? 'Middle School' : 'High School'} division
                    </p>
                )}
              </div>
              <div className="field">
                <label htmlFor="onb-chapter">TSA chapter (optional)</label>
                <input
                    id="onb-chapter"
                    className="input"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="e.g., Ballantyne Ridge TSA"
                />
              </div>
            </div>
        )}

        {step === 4 && (
            <div className="onb-step">
              <h1 className="onb-h">One last thing</h1>
              <p className="onb-p">
                TSA Hub helps you organize your TSA season — it doesn't make you an official TSA member. Official membership
                happens through your school chapter and advisor.
              </p>
              <p className="onb-p">
                By continuing you agree that the info you enter is yours to share, and that this is a student tool, not an
                official TSA product.
              </p>
            </div>
        )}

        {error && (
            <div className="notice" style={{ marginTop: 12 }}>
              <span aria-hidden="true">⚠</span>
              <span>{error}</span>
            </div>
        )}

        <div className="onb-nav">
          {step > 0 ? (
              <button className="btn ghost" onClick={back} disabled={saving}>
                Back
              </button>
          ) : (
              <span />
          )}
          {step < VISIBLE - 1 ? (
              <button className="btn primary" onClick={next} disabled={!stepChecks[step]}>
                Next
              </button>
          ) : (
              <button className="btn primary" onClick={finish} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save' : 'Finish'}
              </button>
          )}
        </div>
      </div>
  );
}