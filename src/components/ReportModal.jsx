import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { submitReport } from '../services/feedbackService.js';

const REPORT_CATEGORIES = [
    'Incorrect event information',
    'Incorrect theme/problem',
    'Wrong calendar date',
    'Wrong state advisor/contact',
    'Broken official link',
    'Other incorrect information',
];

// Report Incorrect Information: category + description. The route the report
// is sent from is captured automatically (there is no page field). The exact
// text is previewed, then sent anonymously through the same endpoint as
// before. No name, email or other contact detail is asked for or sent.
export default function ReportModal({ onClose }) {
    const location = useLocation();
    const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [step, setStep] = useState('form'); // form | preview | sending | sent | error

    const lines = [
        `Category: ${category}`,
        location.pathname && `Page: ${location.pathname}`,
        '',
        description.trim(),
    ];
    const message = lines.filter((l) => typeof l === 'string').join('\n');

    async function send() {
        if (step === 'sending') return;
        setStep('sending');
        const res = await submitReport(message);
        setStep(res.ok ? 'sent' : 'error');
    }

    const title = 'Report Incorrect Information';
    return (
        <div className="rs-modal-backdrop" onClick={onClose}>
            <div className="rs-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
                <div className="rs-modal-head">
                    <h3>{title}</h3>
                    <button type="button" className="rs-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rs-modal-body">
                    {step === 'sent' ? (
                        <>
                            <p className="fb-thanks">Thanks! Your report was sent.</p>
                            <div className="fb-actions">
                                <button type="button" className="btn primary small" onClick={onClose}>Close</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="fb-hint">
                                See something wrong or out of date? Tell us what needs fixing. Please leave out personal information. If you’re under 13, ask a parent or teacher first.
                            </p>

                            <label className="fb-label" htmlFor="rep-cat">Category</label>
                            <select id="rep-cat" className="fb-select" value={category} onChange={(e) => setCategory(e.target.value)} disabled={step === 'sending'}>
                                {REPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <label className="fb-label" htmlFor="rep-desc">Description</label>
                            <textarea
                                id="rep-desc"
                                className="fb-textarea"
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={step === 'sending'}
                                placeholder="What’s incorrect, and what should it say instead?"
                            />

                            {step !== 'form' && (
                                <div className="fb-preview">
                                    <strong>This will be sent</strong>{'\n\n'}
                                    {message}
                                </div>
                            )}

                            {step === 'error' && <p className="fb-error">Couldn’t send right now. Please try again.</p>}

                            <div className="fb-actions">
                                <button type="button" className="btn ghost small" onClick={onClose}>Cancel</button>
                                {step === 'form' ? (
                                    <button type="button" className="btn primary small" disabled={!description.trim()} onClick={() => setStep('preview')}>
                                        Preview
                                    </button>
                                ) : (
                                    <button type="button" className="btn primary small" disabled={step === 'sending'} onClick={send}>
                                        {step === 'sending' ? 'Sending…' : 'Send'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
