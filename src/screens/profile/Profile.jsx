import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { saveMyProfile, isUsernameAvailable, divisionForGrade } from '../../services/profileService.js';
import { resizeImage, AVATAR_MAX } from '../../services/images.js';
import { initialsOf } from '../../data/people.js';
import { Icon } from '../../components/UI.jsx';

const GRADES = ['6', '7', '8', '9', '10', '11', '12'];

function fullName(p) {
  return [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Student';
}

function Row({ icon, label, value, onEdit, soon, onClick, danger }) {
  const clickable = !!(onEdit || onClick);
  return (
      <div className={`set-row ${danger ? 'danger' : ''} ${clickable ? '' : 'pf-static'}`}>
        {icon && (
            <span className="set-ico">
          <Icon name={icon} size={20} />
        </span>
        )}
        <span className="set-label">
        {label}
          {value && <span className="set-sub">{value}</span>}
      </span>
        {soon && <span className="set-soon">Soon</span>}
        {onEdit && (
            <button className="link linkbtn pf-change" onClick={onEdit}>
              Change
            </button>
        )}
        {onClick && !onEdit && (
            <button className="pf-rowbtn" onClick={onClick} aria-label={label}>
              <Icon name="chevron-right" size={18} />
            </button>
        )}
      </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useApp();
  const { user, signOut } = useAuth();
  const avatarRef = useRef(null);

  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [uname, setUname] = useState('');
  const [unameState, setUnameState] = useState('idle');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');

  function openEdit(which) {
    setNote('');
    setFirst(profile?.first_name || '');
    setLast(profile?.last_name || '');
    setUname(profile?.username || '');
    setSchool(profile?.school || '');
    setGrade(profile?.grade || '');
    setUnameState('idle');
    setEditing(which);
  }

  async function checkUsername(v) {
    setUname(v);
    if (v.trim().length < 6) {
      setUnameState('short');
      return;
    }
    setUnameState('checking');
    try {
      const free = await isUsernameAvailable(v);
      setUnameState(free ? 'ok' : 'taken');
    } catch (err) {
      setUnameState('error');
    }
  }

  async function save(fields) {
    setBusy(true);
    try {
      await saveMyProfile(fields);
      await refreshProfile();
      setEditing(null);
      setNote('Saved.');
      setTimeout(() => setNote(''), 1800);
    } catch (err) {
      setNote(err?.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  async function pickAvatar(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, AVATAR_MAX);
      await save({ avatar_url: dataUrl });
    } catch (err) {
      setNote(err?.message || 'Could not use that image.');
    }
  }

  const place = [profile?.city, profile?.state].filter(Boolean).join(', ');
  const sub = [profile?.school, place].filter(Boolean).join(' · ');

  return (
      <>
        <div className="pf-head">
          <div className="pf-av-wrap">
            {profile?.avatar_url ? (
                <img className="pf-av" src={profile.avatar_url} alt="" />
            ) : (
                <span className="pf-av pf-av-fallback">{initialsOf(fullName(profile))}</span>
            )}
            <button className="pf-av-btn" onClick={() => avatarRef.current?.click()} aria-label="Change photo">
              <Icon name="camera" size={13} />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
          </div>
          <div className="pf-head-text">
            <div className="pf-head-name">{fullName(profile)}</div>
            <div className="pf-head-handle">@{profile?.username}</div>
            {sub && <div className="pf-head-sub">{sub}</div>}
          </div>
        </div>

        {note && (
            <div className="notice info" role="status">
              <span aria-hidden="true">ⓘ</span>
              <span>{note}</span>
            </div>
        )}

        <div className="set-group-label">Profile</div>
        <div className="set-card">
          {editing === 'name' ? (
              <div className="pf-edit">
                <div className="field">
                  <label htmlFor="e-first">First name</label>
                  <input id="e-first" className="input" value={first} onChange={(e) => setFirst(e.target.value)} autoFocus />
                </div>
                <div className="field">
                  <label htmlFor="e-last">Last name</label>
                  <input id="e-last" className="input" value={last} onChange={(e) => setLast(e.target.value)} />
                </div>
                <div className="pf-edit-nav">
                  <button className="btn ghost small" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button
                      className="btn primary small"
                      disabled={busy || !first.trim() || !last.trim()}
                      onClick={() => save({ first_name: first.trim(), last_name: last.trim() })}
                  >
                    {busy ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
          ) : (
              <Row label="Name" value={fullName(profile)} onEdit={() => openEdit('name')} />
          )}

          {editing === 'username' ? (
              <div className="pf-edit">
                <div className="field">
                  <label htmlFor="e-user">Username</label>
                  <input
                      id="e-user"
                      className="input"
                      value={uname}
                      onChange={(e) => checkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                      autoFocus
                  />
                  <p
                      className="small"
                      style={{
                        margin: '6px 0 0',
                        color:
                            unameState === 'ok'
                                ? 'var(--ok)'
                                : ['taken', 'short', 'error'].includes(unameState)
                                    ? 'var(--red-400)'
                                    : 'var(--muted)',
                      }}
                  >
                    {
                      {
                        idle: '',
                        checking: 'Checking…',
                        ok: 'Available',
                        taken: 'Taken — try another',
                        short: 'At least 6 characters',
                        error: "Couldn't check right now",
                      }[unameState]
                    }
                  </p>
                </div>
                <div className="pf-edit-nav">
                  <button className="btn ghost small" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button
                      className="btn primary small"
                      disabled={busy || unameState !== 'ok'}
                      onClick={() => save({ username: uname.trim().toLowerCase() })}
                  >
                    {busy ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
          ) : (
              <Row label="Username" value={`@${profile?.username || ''}`} onEdit={() => openEdit('username')} />
          )}

          {editing === 'school' ? (
              <div className="pf-edit">
                <div className="field">
                  <label htmlFor="e-school">School</label>
                  <input
                      id="e-school"
                      className="input"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      autoFocus
                  />
                </div>
                <div className="pf-edit-nav">
                  <button className="btn ghost small" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button
                      className="btn primary small"
                      disabled={busy || !school.trim()}
                      onClick={() => save({ school: school.trim() })}
                  >
                    {busy ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
          ) : (
              <Row label="School" value={profile?.school} onEdit={() => openEdit('school')} />
          )}

          {editing === 'grade' ? (
              <div className="pf-edit">
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
                <div className="pf-edit-nav">
                  <button className="btn ghost small" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button
                      className="btn primary small"
                      disabled={busy || !grade}
                      onClick={() => save({ grade, division: divisionForGrade(grade) })}
                  >
                    {busy ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
          ) : (
              <Row
                  label="Grade"
                  value={profile?.grade ? `${profile.grade}th · ${profile.division === 'MS' ? 'Middle School' : 'High School'}` : ''}
                  onEdit={() => openEdit('grade')}
              />
          )}
        </div>

        <div className="set-group-label">Account</div>
        <div className="set-card">
          <Row icon="user" label="Email" value={user?.email} />
          <Row
              icon="lock"
              label="Private account"
              value={profile?.is_private ? 'Private' : 'Public'}
              onClick={() => navigate('/settings/privacy')}
          />
          <Row icon="log-out" label="Sign out" danger onClick={async () => {
            if (window.confirm('Sign out of TSA Hub?')) await signOut();
          }} />
          <Row icon="x" label="Delete account" danger soon onClick={() => {
            setNote("Deleting an account needs a server function — it can't be done safely from the browser. Coming later.");
            setTimeout(() => setNote(''), 4000);
          }} />
        </div>

        <div className="set-group-label">Content &amp; display</div>
        <div className="set-card">
          <Row icon="globe" label="Display language" value="English" soon onClick={() => {
            setNote("Language options aren't available yet.");
            setTimeout(() => setNote(''), 2200);
          }} />
          <Row icon="accessibility" label="Accessibility" soon onClick={() => {
            setNote("Accessibility settings aren't available yet.");
            setTimeout(() => setNote(''), 2200);
          }} />
        </div>

        <div className="set-group-label">Support &amp; about</div>
        <div className="set-card">
          <Row icon="help" label="Help Center" soon onClick={() => {
            setNote("Help Center isn't available yet.");
            setTimeout(() => setNote(''), 2200);
          }} />
          <Row icon="shield" label="Privacy Policy" onClick={() => navigate('/privacy')} />
          <Row icon="file-text" label="Terms and Policies" soon onClick={() => {
            setNote("Terms and Policies aren't available yet.");
            setTimeout(() => setNote(''), 2200);
          }} />
        </div>

        <p className="small muted set-version">TSA Hub v0.1.0</p>
      </>
  );
}