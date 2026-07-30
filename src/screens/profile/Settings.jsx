import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Icon } from '../../components/UI.jsx';

function Row({ icon, label, value, onClick, danger, soon }) {
    return (
        <button className={`set-row ${danger ? 'danger' : ''}`} onClick={onClick}>
      <span className="set-ico">
        <Icon name={icon} size={20} />
      </span>
            <span className="set-label">{label}</span>
            {soon && <span className="set-soon">Soon</span>}
            {value && <span className="set-value">{value}</span>}
            <Icon name="chevron-right" size={18} />
        </button>
    );
}

function handleOf(profile) {
    if (profile?.username) return profile.username;
    const slug = (profile?.name || '').toLowerCase().replace(/[^a-z0-9._]/g, '');
    return slug || 'student';
}

export default function Settings() {
    const navigate = useNavigate();
    const { profile } = useApp();
    const { signOut } = useAuth();
    const [note, setNote] = useState('');

    const isPrivate = !!profile?.isPrivate;

    async function shareProfile() {
        try {
            await navigator.clipboard.writeText(handleOf(profile));
            setNote('Profile username copied to clipboard.');
        } catch {
            setNote('Could not copy — clipboard is blocked.');
        }
        setTimeout(() => setNote(''), 2200);
    }

    function comingSoon(what) {
        setNote(`${what} isn't available in this demo yet.`);
        setTimeout(() => setNote(''), 2200);
    }

    async function logOut() {
        if (window.confirm('Log out of TSA Hub?')) {
            await signOut();
        }
    }

    return (
        <>
            <div className="set-head">
                <button className="set-back" onClick={() => navigate('/profile')} aria-label="Back">
                    <Icon name="arrow-left" size={22} />
                </button>
                <h1 className="set-title">Settings</h1>
            </div>

            <div className="set-group-label">Account</div>
            <div className="set-card">
                <Row icon="user" label="Account" soon onClick={() => comingSoon('Account center')} />
                <Row icon="switch" label="Share profile" onClick={shareProfile} />
                <Row
                    icon="lock"
                    label="Private account"
                    value={isPrivate ? 'Private' : 'Public'}
                    onClick={() => navigate('/settings/privacy')}
                />
            </div>

            <div className="set-group-label">Content &amp; display</div>
            <div className="set-card">
                <Row icon="globe" label="Display Language" value="English" soon onClick={() => comingSoon('Display language')} />
                <Row icon="accessibility" label="Accessibility" soon onClick={() => comingSoon('Accessibility settings')} />
            </div>

            <div className="set-group-label">Support &amp; about</div>
            <div className="set-card">
                <Row icon="help" label="Help Center" soon onClick={() => comingSoon('Help Center')} />
                <Row icon="shield" label="Privacy Center" soon onClick={() => comingSoon('Privacy Center')} />
                <Row icon="file-text" label="Terms and Policies" soon onClick={() => comingSoon('Terms and Policies')} />
            </div>

            <div className="set-group-label">Login</div>
            <div className="set-card">
                <Row icon="switch" label="Switch account" soon onClick={() => comingSoon('Switching accounts')} />
                <Row icon="log-out" label="Log out" danger onClick={logOut} />
            </div>

            {note && (
                <div className="notice info" role="status">
                    <span aria-hidden="true">ⓘ</span>
                    <span>{note}</span>
                </div>
            )}

            <p className="small muted set-version">TSA Hub v0.1.0 — demo build</p>
        </>
    );
}