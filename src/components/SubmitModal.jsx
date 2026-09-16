import { useState } from 'react';

// Shared submit modal: a textarea + submit. `onSubmit` returns { ok }.
// Used for Send Feedback and Report Incorrect Information, from both
// Settings and Home's Quick Actions — one implementation, reused everywhere
// this flow is offered.
export default function SubmitModal({ title, hint, placeholder, doneText, onSubmit, onClose }) {
    const [text, setText] = useState('');
    const [status, setStatus] = useState('idle'); // idle | sending | done | error

    async function send() {
        const msg = text.trim();
        if (!msg || status === 'sending') return;
        setStatus('sending');
        const res = await onSubmit(msg);
        setStatus(res.ok ? 'done' : 'error');
    }

    return (
        <div className="rs-modal-backdrop" onClick={onClose}>
            <div
                className="rs-modal"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rs-modal-head">
                    <h3>{title}</h3>
                    <button type="button" className="rs-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rs-modal-body">
                    {status === 'done' ? (
                        <p className="fb-thanks">{doneText}</p>
                    ) : (
                        <>
                            <p className="fb-hint">{hint}</p>
                            <textarea
                                className="fb-textarea"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={placeholder}
                                rows={5}
                                autoFocus
                                disabled={status === 'sending'}
                            />
                            {status === 'error' && (
                                <p className="fb-error">Couldn&rsquo;t send right now. Please try again.</p>
                            )}
                            <div className="fb-actions">
                                <button type="button" className="btn ghost small" onClick={onClose}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn primary small"
                                    onClick={send}
                                    disabled={!text.trim() || status === 'sending'}
                                >
                                    {status === 'sending' ? 'Sending…' : 'Send'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
