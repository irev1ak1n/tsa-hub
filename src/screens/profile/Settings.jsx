import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';

function Row({ icon, label, value, onEdit, soon, onClick }) {
    const clickable = !!(onEdit || onClick);
    return (
        <div className={`set-row ${clickable ? '' : 'pf-static'}`}>
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

export default function Settings() {
    const navigate = useNavigate();
    const { prefs, setName } = useApp();

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [note, setNote] = useState('');

    function openEdit() {
        setDraft(prefs?.name || '');
        setEditing(true);
    }
    function saveName() {
        setName(draft.trim());
        setEditing(false);
        setNote('Saved.');
        setTimeout(() => setNote(''), 1600);
    }
    function soon(msg) {
        setNote(msg);
        setTimeout(() => setNote(''), 2200);
    }

    return (
        <>
            <div className="section">
                <div className="rs-eyebrow">Settings</div>
                <h1 className="cal-h1">Settings</h1>
            </div>

            {note && (
                <div className="notice info" role="status">
                    <span aria-hidden="true">ⓘ</span>
                    <span>{note}</span>
                </div>
            )}

            {/* Personalization */}
            <div className="set-group-label">Personalization</div>
            <div className="set-card">
                {editing ? (
                    <div className="pf-edit">
                        <div className="field">
                            <label htmlFor="s-name">Name</label>
                            <input
                                id="s-name"
                                className="input"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="Your name"
                                autoFocus
                            />
                            <p className="small muted" style={{ margin: '6px 0 0' }}>
                                This appears on your home page. Optional.
                            </p>
                        </div>
                        <div className="pf-edit-nav">
                            <button className="btn ghost small" onClick={() => setEditing(false)}>Cancel</button>
                            <button className="btn primary small" onClick={saveName}>Save</button>
                        </div>
                    </div>
                ) : (
                    <Row label="Name" value={prefs?.name || 'Not set'} onEdit={openEdit} />
                )}
            </div>

            {/* Content & display */}
            <div className="set-group-label">Content &amp; display</div>
            <div className="set-card">
                <Row icon="globe" label="Display language" value="English" soon onClick={() => soon("Language options aren't available yet.")} />
                <Row icon="accessibility" label="Accessibility" soon onClick={() => soon("Accessibility settings aren't available yet.")} />
                <Row icon="switch" label="Appearance" soon onClick={() => soon("Appearance settings aren't available yet.")} />
            </div>

            {/* Support & about */}
            <div className="set-group-label">Support &amp; about</div>
            <div className="set-card">
                <Row icon="help" label="Help Center" soon onClick={() => soon("Help Center isn't available yet.")} />
                <Row icon="shield" label="Privacy Policy" onClick={() => navigate('/privacy')} />
                <Row icon="file-text" label="Terms and Policies" soon onClick={() => soon("Terms and Policies aren't available yet.")} />
            </div>

            <p className="small muted set-version">TSA Hub v0.1.0</p>
        </>
    );
}