import { useState } from 'react';
import { supabase } from '../../services/supabase.js';

function readError(err) {
    if (!err) return 'Something went wrong.';
    if (typeof err === 'string') return err;
    if (err.message && err.message.trim()) return err.message;
    if (err.error_description) return err.error_description;
    if (err.msg) return err.msg;
    return 'Something went wrong. Please try again.';
}

export default function Login() {
    const [mode, setMode] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    async function submit(e) {
        e.preventDefault();
        setError('');
        setInfo('');

        const mail = email.trim();

        if (mode === 'forgot') {
            if (!mail) {
                setError('Enter your email so we can send a reset link.');
                return;
            }
            setBusy(true);
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(mail);
                if (error) throw error;
                setInfo('If that email has an account, a password reset link is on its way.');
            } catch (err) {
                setError(readError(err));
            } finally {
                setBusy(false);
            }
            return;
        }

        if (!mail || !password) {
            setError('Enter your email and password.');
            return;
        }
        if (mode === 'signup' && password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setBusy(true);
        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email: mail, password });
                if (error) throw error;
                setInfo('Account created. If asked, check your email to confirm, then log in.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
                if (error) throw error;
            }
        } catch (err) {
            const raw = readError(err).toLowerCase();
            if (raw.includes('already') || raw.includes('registered') || raw.includes('exists')) {
                setError('That email already has an account. Try logging in instead.');
            } else if (raw.includes('invalid') || raw.includes('credentials')) {
                setError('Email or password is incorrect.');
            } else {
                setError(readError(err));
            }
        } finally {
            setBusy(false);
        }
    }

    const title =
        mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';
    const sub =
        mode === 'signup'
            ? 'Sign up to start organizing your TSA season.'
            : mode === 'forgot'
                ? "Enter your email and we'll send you a reset link."
                : 'Log in to pick up where you left off.';

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <div className="auth-brand">
          <span className="wordmark">
            TSA <span className="mark">HUB</span>
          </span>
                </div>

                <h1 className="auth-title">{title}</h1>
                <p className="auth-sub">{sub}</p>

                <form onSubmit={submit}>
                    <div className="field">
                        <input
                            className="input"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            aria-label="Email"
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div className="field auth-passwrap">
                            <input
                                className="input"
                                type={showPass ? 'text' : 'password'}
                                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                aria-label="Password"
                            />
                            <button
                                type="button"
                                className="auth-eye"
                                onClick={() => setShowPass((v) => !v)}
                                aria-label={showPass ? 'Hide password' : 'Show password'}
                            >
                                {showPass ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
                                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="notice" style={{ marginTop: 4 }}>
                            <span aria-hidden="true">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}
                    {info && (
                        <div className="notice info" style={{ marginTop: 4 }}>
                            <span aria-hidden="true">ⓘ</span>
                            <span>{info}</span>
                        </div>
                    )}

                    <button className="btn primary auth-submit" type="submit" disabled={busy}>
                        {busy
                            ? 'Working…'
                            : mode === 'signup'
                                ? 'Create account'
                                : mode === 'forgot'
                                    ? 'Send reset link'
                                    : 'Log in'}
                    </button>
                </form>

                {mode === 'signin' && (
                    <button
                        className="link linkbtn auth-forgot"
                        onClick={() => {
                            setMode('forgot');
                            setError('');
                            setInfo('');
                        }}
                    >
                        Forgot password?
                    </button>
                )}

                {mode === 'forgot' ? (
                    <p className="auth-switch">
                        Remembered it?{' '}
                        <button
                            className="link linkbtn"
                            onClick={() => {
                                setMode('signin');
                                setError('');
                                setInfo('');
                            }}
                        >
                            Back to log in
                        </button>
                    </p>
                ) : (
                    <p className="auth-switch">
                        {mode === 'signup' ? 'Already have an account?' : 'New to TSA Hub?'}{' '}
                        <button
                            className="link linkbtn"
                            onClick={() => {
                                setMode(mode === 'signup' ? 'signin' : 'signup');
                                setError('');
                                setInfo('');
                            }}
                        >
                            {mode === 'signup' ? 'Log in' : 'Create one'}
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}