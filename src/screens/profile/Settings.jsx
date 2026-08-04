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

// Appearance theme row: a real Dark/Light toggle wired to app state.
function ThemeRow({ dark, onToggle }) {
    return (
        <div className="set-row set-toggle-row">
            <span className="set-label">
                <span className="set-uplabel">THEME</span>
                <span className="set-theme-value">{dark ? 'Dark mode' : 'Light mode'}</span>
            </span>
            <button
                type="button"
                className={`set-theme-switch ${dark ? 'is-dark' : 'is-light'}`}
                role="switch"
                aria-checked={dark}
                aria-label="Toggle theme"
                onClick={onToggle}
            >
                <span className="set-theme-knob">
                    <Icon name="spark" size={13} />
                </span>
            </button>
        </div>
    );
}

export default function Settings() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useApp();
    const [note, setNote] = useState('');

    const dark = theme !== 'light';

    function soon(msg) {
        setNote(msg);
        setTimeout(() => setNote(''), 2200);
    }

    return (
        <>
            <div className="section">
                <div className="rs-eyebrow">SYSTEM & STYLE</div>
                <h1 className="cal-h1">Settings</h1>
            </div>

            {note && (
                <div className="notice info" role="status">
                    <span aria-hidden="true">ⓘ</span>
                    <span>{note}</span>
                </div>
            )}

            {/* Appearance */}
            <div className="set-card">
                <div className="set-card-title">Appearance</div>
                <ThemeRow dark={dark} onToggle={toggleTheme} />
            </div>

            {/* Support */}
            <div className="set-card">
                <div className="set-card-title">Support</div>
                <Row icon="help" label="Help Center" soon onClick={() => soon("Help Center isn't available yet.")} />
                <Row icon="chat" label="Send Feedback" soon onClick={() => soon("Feedback isn't available yet.")} />
                <Row icon="info" label="Report Incorrect Information" soon onClick={() => soon("Reporting isn't available yet.")} />
            </div>

            {/* About */}
            <div className="set-card">
                <div className="set-card-title">About</div>
                <Row icon="shield" label="Privacy Policy" onClick={() => navigate('/privacy')} />
                <Row icon="file-text" label="Terms and Policies" onClick={() => navigate('/terms')} />
            </div>

            <p className="small muted set-version">TSA Hub v0.1.0</p>
        </>
    );
}