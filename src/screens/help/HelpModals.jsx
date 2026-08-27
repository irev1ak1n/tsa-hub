import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '../../components/UI.jsx';
import { TSA_HUB_SUPPORT_EMAIL, NATIONAL_TSA, SUPPORT_CATEGORIES } from '../../data/contacts.js';
import { buildSupportMailto } from '../../services/supportMailto.js';

const REPORT_CATEGORIES = [
    'Incorrect event information',
    'Incorrect theme/problem',
    'Wrong calendar date',
    'Wrong state advisor/contact',
    'Broken official link',
    'Other incorrect information',
];

function ModalShell({ title, onClose, children }) {
    return (
        <div className="rs-modal-backdrop" onClick={onClose}>
            <div className="rs-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
                <div className="rs-modal-head">
                    <h3>{title}</h3>
                    <button type="button" className="rs-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="rs-modal-body">{children}</div>
            </div>
        </div>
    );
}

// Report Incorrect Information — category + page/section + description,
// preview the exact email, then the user sends it themselves.
export function ReportIncorrectInfoModal({ onClose }) {
    const location = useLocation();
    const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
    const [page, setPage] = useState(location.pathname || '');
    const [description, setDescription] = useState('');
    const [step, setStep] = useState('form'); // form | preview | sent

    const subject = `TSA Hub Report — ${category}`;
    const bodyLines = [
        `Category: ${category}`,
        page.trim() && `Page/section: ${page.trim()}`,
        '',
        description.trim() || '(no description provided)',
    ];
    const mailto = buildSupportMailto({ subject, lines: bodyLines });

    function send() {
        window.location.href = mailto;
        setStep('sent');
    }

    return (
        <ModalShell title="Report Incorrect Information" onClose={onClose}>
            {step === 'sent' ? (
                <p className="fb-thanks">
                    Your email app should now be open with your report ready to send to {TSA_HUB_SUPPORT_EMAIL}.
                    We can’t confirm it’s received until you hit send there.
                </p>
            ) : (
                <>
                    <p className="fb-hint">See something wrong or out of date? Tell us what needs fixing and where.</p>

                    <label className="fb-label" htmlFor="rep-cat">Category</label>
                    <select id="rep-cat" className="fb-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                        {REPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <label className="fb-label" htmlFor="rep-page">Page/section (optional)</label>
                    <input
                        id="rep-page"
                        className="fb-input"
                        value={page}
                        onChange={(e) => setPage(e.target.value)}
                        placeholder="e.g. Robotics event page"
                    />

                    <label className="fb-label" htmlFor="rep-desc">Description</label>
                    <textarea
                        id="rep-desc"
                        className="fb-textarea"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What’s incorrect, and what should it say instead?"
                    />

                    {step === 'preview' && (
                        <div className="fb-preview">
                            <strong>To:</strong> {TSA_HUB_SUPPORT_EMAIL}{'\n'}
                            <strong>Subject:</strong> {subject}{'\n\n'}
                            {bodyLines.filter(Boolean).join('\n')}
                        </div>
                    )}

                    <div className="fb-actions">
                        <button type="button" className="btn ghost small" onClick={onClose}>Cancel</button>
                        {step === 'form' ? (
                            <button
                                type="button"
                                className="btn primary small"
                                disabled={!description.trim()}
                                onClick={() => setStep('preview')}
                            >
                                Preview
                            </button>
                        ) : (
                            <button type="button" className="btn primary small" onClick={send}>Send</button>
                        )}
                    </div>
                </>
            )}
        </ModalShell>
    );
}

// Contact Support — TSA Hub support (mailto, previewed) clearly separated
// from real National TSA organizational contact info (never blended).
export function ContactSupportModal({ onClose }) {
    const [category, setCategory] = useState(SUPPORT_CATEGORIES[0]);
    const [message, setMessage] = useState('');
    const [replyEmail, setReplyEmail] = useState('');
    const [step, setStep] = useState('form'); // form | preview | sent

    const subject = `TSA Hub Support — ${category}`;
    const bodyLines = [
        `Category: ${category}`,
        replyEmail.trim() && `Reply to: ${replyEmail.trim()}`,
        '',
        message.trim(),
    ];
    const mailto = buildSupportMailto({ subject, lines: bodyLines });

    function send() {
        window.location.href = mailto;
        setStep('sent');
    }

    return (
        <ModalShell title="Contact Support" onClose={onClose}>
            <div className="help-contact-block">
                <div className="help-contact-block-title">TSA Hub Support</div>
                <p className="help-contact-block-sub">
                    For TSA Hub bugs, wrong app information, Coach problems, search issues, Calendar issues, or product feedback.
                </p>

                {step === 'sent' ? (
                    <p className="fb-thanks">
                        Your email app should now be open with your message ready to send to {TSA_HUB_SUPPORT_EMAIL}.
                        We can’t confirm it’s received until you hit send there.
                    </p>
                ) : (
                    <>
                        <label className="fb-label" htmlFor="sup-cat">Category</label>
                        <select id="sup-cat" className="fb-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                            {SUPPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <label className="fb-label" htmlFor="sup-msg">Message</label>
                        <textarea
                            id="sup-msg"
                            className="fb-textarea"
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="What's going on?"
                        />

                        <label className="fb-label" htmlFor="sup-email">Reply email (optional)</label>
                        <input
                            id="sup-email"
                            type="email"
                            className="fb-input"
                            value={replyEmail}
                            onChange={(e) => setReplyEmail(e.target.value)}
                            placeholder="you@example.com"
                        />

                        {step === 'preview' && (
                            <div className="fb-preview">
                                <strong>To:</strong> {TSA_HUB_SUPPORT_EMAIL}{'\n'}
                                <strong>Subject:</strong> {subject}{'\n\n'}
                                {bodyLines.filter(Boolean).join('\n')}
                            </div>
                        )}

                        <div className="fb-actions">
                            <button type="button" className="btn ghost small" onClick={onClose}>Cancel</button>
                            {step === 'form' ? (
                                <button
                                    type="button"
                                    className="btn primary small"
                                    disabled={!message.trim()}
                                    onClick={() => setStep('preview')}
                                >
                                    Preview
                                </button>
                            ) : (
                                <button type="button" className="btn primary small" onClick={send}>Send</button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="help-contact-block">
                <div className="help-contact-block-title">National TSA</div>
                <p className="help-contact-block-sub">For official National TSA organizational contact.</p>
                <a className="help-contact-line" href={`mailto:${NATIONAL_TSA.email}`}>
                    <Icon name="mail" size={16} />
                    <span>{NATIONAL_TSA.email}</span>
                </a>
                <a className="help-contact-line" href={`tel:${NATIONAL_TSA.phone.replace(/[^\d+]/g, '')}`}>
                    <Icon name="phone" size={16} />
                    <span>Phone: {NATIONAL_TSA.phone}</span>
                </a>
                <a className="help-contact-line" href={`tel:${NATIONAL_TSA.tollFree.replace(/[^\d+]/g, '')}`}>
                    <Icon name="phone" size={16} />
                    <span>Toll Free: {NATIONAL_TSA.tollFree}</span>
                </a>
            </div>
        </ModalShell>
    );
}
