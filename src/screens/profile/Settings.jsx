import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from '../../components/UI.jsx';

// One settings row. If `onClick` is passed the WHOLE row is clickable
// (button), not just the chevron. `onEdit`/plain rows are unchanged.
function Row({ icon, label, value, onEdit, soon, onClick }) {
    const content = (
        <>
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
                <button
                    className="link linkbtn pf-change"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                    Change
                </button>
            )}
            {(onClick || onEdit) && <Icon name="chevron-right" size={18} />}
        </>
    );

    if (onClick && !onEdit) {
        return (
            <button type="button" className="set-row" onClick={onClick}>
                {content}
            </button>
        );
    }
    return <div className="set-row">{content}</div>;
}

export default function Settings() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useApp();

    const dark = theme !== 'light';

    return (
        <>
            <div className="section">
                <div className="rs-eyebrow">SYSTEM & STYLE</div>
                <h1 className="cal-h1">Settings</h1>
            </div>

            {/* Appearance */}
            <div className="set-card">
                <div className="set-card-title">Appearance</div>
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
                        onClick={toggleTheme}
                    >
                        <span className="set-theme-knob"><Icon name="spark" size={13} /></span>
                    </button>
                </div>
            </div>

            {/* Support */}
            <div className="set-card">
                <div className="set-card-title">Support</div>
                <Row icon="help" label="Help Center" onClick={() => navigate('/help')} />
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