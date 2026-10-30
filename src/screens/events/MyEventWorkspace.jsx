import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { getEvent } from '../../data/events.js';
import {
    addPortfolioFile, deletePortfolioFile, downloadPortfolioFile, emptyPortfolio,
    exportPortfolio, listPortfolioFiles, newWorkspaceId, readPortfolio, savePortfolio,
} from '../../services/eventWorkspaceDb.js';
import { Icon } from '../../components/UI.jsx';

const STARTER_STEPS = [
    'Read the official rules and eligibility requirements',
    'Check the event theme, deadlines, and submission instructions',
    'Brainstorm ideas and select a project direction',
    'Assign responsibilities and plan the work',
    'Build or research the first prototype or draft',
    'Review progress and collect feedback',
    'Improve and test the final deliverables',
    'Prepare the documentation and presentation',
    'Double-check requirements before submission',
];

function todayLocal() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
function deadlineStatus(date, done) {
    if (done) return { label: 'Complete', tone: 'done' };
    if (!date) return { label: 'Set a date', tone: 'undated' };
    const days = Math.round((new Date(date + 'T12:00:00').getTime() - new Date(todayLocal() + 'T12:00:00').getTime()) / 86400000);
    if (days < 0) return { label: Math.abs(days) + 'd overdue', tone: 'overdue' };
    if (days === 0) return { label: 'Due today', tone: 'soon' };
    if (days === 1) return { label: 'Tomorrow', tone: 'soon' };
    return { label: days + ' days left', tone: days <= 7 ? 'soon' : 'upcoming' };
}
function fmtDate(date) {
    if (!date) return 'No date set';
    return new Date(date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function safeUrl(value) {
    try {
        const url = new URL(String(value).trim());
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch { return null; }
}
function FileSize({ bytes }) {
    return <span>{bytes < 1024 * 1024 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB'}</span>;
}
function Field({ label, value, onChange, placeholder, multiline, ...props }) {
    return (
        <label className="ew-field">
            <span className="ew-label">{label}</span>
            {multiline ? (
                <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} {...props} />
            ) : (
                <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} {...props} />
            )}
        </label>
    );
}
function Collection({ title, hint, entries, fields, onAdd, onUpdate, onRemove }) {
    return (
        <section className="ew-panel">
            <div className="ew-panel-head">
                <div><h2>{title}</h2>{hint && <p>{hint}</p>}</div>
                <button type="button" className="ew-button ew-button-light" onClick={onAdd}><Icon name="plus" size={15} /> Add</button>
            </div>
            {!entries.length && <p className="ew-empty">Nothing saved here yet.</p>}
            <div className="ew-collection">
                {entries.map((entry) => (
                    <div className="ew-entry" key={entry.id}>
                        <div className="ew-entry-fields">
                            {fields.map((field) => (
                                <Field key={field.key} label={field.label} value={entry[field.key] || ''}
                                    onChange={(value) => onUpdate(entry.id, field.key, value)}
                                    placeholder={field.placeholder || ''} type={field.type || 'text'} />
                            ))}
                            {entry.url && safeUrl(entry.url) && <a className="ew-open-link" href={safeUrl(entry.url)} target="_blank" rel="noopener noreferrer">Open reference <Icon name="chevron-right" size={13} /></a>}
                        </div>
                        <button type="button" className="ew-icon-button ew-delete" onClick={() => onRemove(entry.id)} aria-label={'Remove ' + title.toLowerCase().replace(/s$/, '')}><Icon name="trash" size={16} /></button>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function MyEventWorkspace() {
    const { id } = useParams();
    const { myEvents, eventsLoading, checklists, tasks, addChecklistItem, toggleChecklist, removeChecklistItem, addTask, moveTask, deleteTask } = useApp();
    const event = getEvent(id);
    const isSaved = myEvents.includes(id);
    const checklist = checklists?.[id] || [];
    const milestones = tasks.filter((task) => task.eventId === id);
    const [tab, setTab] = useState('checklist');
    const [newTask, setNewTask] = useState('');
    const [newMilestone, setNewMilestone] = useState('');
    const [newDue, setNewDue] = useState('');
    const [portfolio, setPortfolio] = useState(null);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const portfolioRef = useRef(null);
    const saveQueue = useRef(Promise.resolve());

    useEffect(() => {
        let alive = true;
        setPortfolio(null);
        setFiles([]);
        setError('');
        portfolioRef.current = null;
        Promise.all([readPortfolio(id), listPortfolioFiles(id)]).then(([data, entries]) => {
            if (!alive) return;
            portfolioRef.current = data;
            setPortfolio(data);
            setFiles(entries);
        }).catch((err) => {
            if (alive) {
                setError(err.message || 'Local storage could not be opened.');
                const fallback = emptyPortfolio(id);
                portfolioRef.current = fallback;
                setPortfolio(fallback);
            }
        });
        return () => { alive = false; };
    }, [id]);

    function updatePortfolio(change) {
        if (!portfolioRef.current) return;
        const next = typeof change === 'function' ? change(portfolioRef.current) : { ...portfolioRef.current, ...change };
        portfolioRef.current = next;
        setPortfolio(next);
        saveQueue.current = saveQueue.current.catch(() => {}).then(() => savePortfolio(next)).catch((err) => {
            setError((err && err.message) || 'Could not save locally. Export your work before closing this page.');
        });
    }

    function mutateList(key, updater) {
        updatePortfolio((old) => ({ ...old, [key]: updater(old[key] || []) }));
    }
    function addEntry(key, fields) {
        mutateList(key, list => [...list, { id: newWorkspaceId(), ...fields }]);
    }
    function editEntry(key, idToEdit, field, value) {
        mutateList(key, list => list.map(row => row.id === idToEdit ? { ...row, [field]: value } : row));
    }
    function removeEntry(key, entryId) {
        mutateList(key, list => list.filter(row => row.id !== entryId));
    }

    async function uploadFiles(e) {
        const selection = Array.from(e.target.files || []);
        e.target.value = '';
        if (!selection.length) return;
        setBusy(true);
        setError('');
        try {
            for (const file of selection) await addPortfolioFile(id, file);
            setFiles(await listPortfolioFiles(id));
        } catch (err) {
            setError(err.message || 'Unable to store file locally.');
            setFiles(await listPortfolioFiles(id).catch(() => []));
        } finally { setBusy(false); }
    }

    async function downloadFile(fileId) {
        try { await downloadPortfolioFile(fileId); }
        catch (err) { setError(err.message || 'Could not download this file.'); }
    }
    async function removeFile(fileId) {
        try {
            await deletePortfolioFile(fileId);
            setFiles(await listPortfolioFiles(id));
        } catch (err) { setError(err.message || 'Could not remove this file.'); }
    }
    async function backupWorkspace() {
        setBusy(true);
        try {
            await saveQueue.current;
            await exportPortfolio(id);
        } catch (err) {
            setError(err.message || 'Could not export the workspace.');
        } finally { setBusy(false); }
    }

    if (eventsLoading) return <div className="section ew-page"><p className="ew-subtle">Loading your event workspace…</p></div>;
    if (!event || !isSaved) return (
        <div className="section ew-page">
            <h1>Event workspace unavailable</h1>
            <p className="ew-subtle">Add this event to My Events first to open its workspace.</p>
            <Link className="ew-button ew-button-primary" to="/">Back to My Events</Link>
        </div>
    );

    const completedSteps = checklist.filter(row => row.done).length;
    const completedMilestones = milestones.filter(row => row.status === 'done').length;
    const total = checklist.length + milestones.length;
    const progress = total ? Math.round((completedSteps + completedMilestones) / total * 100) : 0;
    const sortedMilestones = [...milestones].sort((a, b) => (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31'));
    const nextDeadline = sortedMilestones.find(row => row.status !== 'done' && row.due);
    const tabs = [
        { id: 'checklist', name: 'Checklist', icon: 'check' },
        { id: 'deadlines', name: 'Deadlines', icon: 'cal' },
        { id: 'portfolio', name: 'Portfolio', icon: 'book' },
    ];

    return (
        <div className="ew-page">
            <Link to="/" className="ew-back"><Icon name="arrow-left" size={17} /> Back to My Events</Link>
            <div className="ew-hero">
                <div className="ew-hero-copy">
                    <span className="rs-eyebrow">MY EVENT WORKSPACE · {event.division}</span>
                    <h1>{event.name}</h1>
                    <p>{event.category || 'TSA Competitive Event'} · Your private preparation space</p>
                    <Link to={'/events/' + encodeURIComponent(id)} className="ew-detail-link">View official event details <Icon name="chevron-right" size={15} /></Link>
                </div>
                <div className="ew-score" style={{ '--ew-progress': progress + '%' }} aria-label={progress + '% complete'}>
                    <strong>{progress}%</strong><span>Progress</span>
                </div>
            </div>

            <div className="ew-overview">
                <div><strong>{completedSteps}/{checklist.length}</strong><span>Checklist tasks</span></div>
                <div><strong>{completedMilestones}/{milestones.length}</strong><span>Milestones</span></div>
                <div><strong>{files.length}</strong><span>Saved files</span></div>
                <div><strong>{nextDeadline ? fmtDate(nextDeadline.due) : '—'}</strong><span>Next deadline</span></div>
            </div>

            <nav className="ew-tabs" aria-label="Workspace sections">
                {tabs.map(item => <button type="button" key={item.id} onClick={() => setTab(item.id)}
                    aria-current={tab === item.id ? 'page' : undefined}
                    className={'ew-tab' + (tab === item.id ? ' active' : '')}>
                    <Icon name={item.icon} size={17} /> {item.name}
                </button>)}
            </nav>

            {error && <p className="ew-error" role="alert">{error}</p>}

            {tab === 'checklist' && (
                <div className="ew-stack">
                    <section className="ew-panel">
                        <div className="ew-panel-head">
                            <div><h2>Preparation checklist</h2><p>Start with a suggested plan or create your own tasks. These are general tips, not official TSA requirements.</p></div>
                            <span className="ew-fraction">{completedSteps} of {checklist.length}</span>
                        </div>
                        <div className="ew-progress-track"><div style={{ width: checklist.length ? (completedSteps / checklist.length * 100) + '%' : '0%' }} /></div>
                        <div className="ew-check-list">
                            {checklist.map(item => <div className={'ew-check-row' + (item.done ? ' checked' : '')} key={item.id}>
                                <label><input type="checkbox" checked={Boolean(item.done)} onChange={() => toggleChecklist(id, item.id)} /><span>{item.label}</span></label>
                                <button type="button" className="ew-icon-button" aria-label={'Remove ' + item.label} onClick={() => removeChecklistItem(id, item.id)}><Icon name="x" size={15} /></button>
                            </div>)}
                        </div>
                        {!checklist.length && <p className="ew-empty">Make a checklist tailored to how you'll prepare for this event.</p>}
                        <div className="ew-row-actions">
                            <form className="ew-inline-form" onSubmit={(e) => { e.preventDefault(); if (newTask.trim()) { addChecklistItem(id, newTask.trim()); setNewTask(''); } }}>
                                <input value={newTask} maxLength={180} onChange={e => setNewTask(e.target.value)} placeholder="Add a checklist task…" aria-label="New checklist task" />
                                <button className="ew-button ew-button-primary" disabled={!newTask.trim()} type="submit"><Icon name="plus" size={15} /> Add</button>
                            </form>
                            <button type="button" className="ew-button ew-button-light" onClick={() => {
                                const present = new Set(checklist.map(row => row.label.toLowerCase()));
                                STARTER_STEPS.filter(label => !present.has(label.toLowerCase())).forEach(label => addChecklistItem(id, label));
                            }}>Add starter checklist</button>
                        </div>
                    </section>
                    <p className="ew-footnote">Deadlines and milestones have their own completion status in the Deadlines tab. Check the official rules before treating a task as a requirement.</p>
                </div>
            )}

            {tab === 'deadlines' && (
                <div className="ew-stack">
                    <section className="ew-panel">
                        <div className="ew-panel-head">
                            <div><h2>Deadline timeline</h2><p>A visual timeline of your milestones, from early preparation through submission. Dates are entered by you.</p></div>
                            <span className="ew-fraction">{completedMilestones} of {milestones.length}</span>
                        </div>
                        <form className="ew-milestone-form" onSubmit={(e) => {
                            e.preventDefault();
                            if (!newMilestone.trim()) return;
                            addTask({ eventId: id, title: newMilestone.trim(), due: newDue });
                            setNewMilestone(''); setNewDue('');
                        }}>
                            <input aria-label="Milestone title" value={newMilestone} onChange={e => setNewMilestone(e.target.value)} maxLength={180} placeholder="e.g. Submit first prototype" required />
                            <input aria-label="Milestone deadline" type="date" value={newDue} onChange={e => setNewDue(e.target.value)} />
                            <button className="ew-button ew-button-primary" type="submit"><Icon name="plus" size={15} /> Add milestone</button>
                        </form>
                        {!sortedMilestones.length ? <p className="ew-empty">Add your first milestone to build a timeline. Your project deadlines won't appear automatically.</p> : (
                            <div className="ew-chart" role="list" aria-label="Project deadline timeline">
                                {sortedMilestones.map((task, i) => {
                                    const done = task.status === 'done';
                                    const status = deadlineStatus(task.due, done);
                                    return <div className={'ew-milestone ' + status.tone} role="listitem" key={task.id}>
                                        <div className="ew-chart-marker"><span className="ew-dot">{done ? '✓' : i + 1}</span><span className="ew-line" /></div>
                                        <div className="ew-milestone-body">
                                            <span className="ew-milestone-date">{fmtDate(task.due)}</span>
                                            <div className="ew-milestone-card">
                                                <div className="ew-milestone-info"><strong>{task.title}</strong><span className={'ew-status ' + status.tone}>{status.label}</span></div>
                                                <div className="ew-milestone-actions">
                                                    <button type="button" className="ew-button ew-button-light" onClick={() => moveTask(task.id, done ? 'todo' : 'done')}>{done ? 'Reopen' : 'Mark done'}</button>
                                                    <button type="button" className="ew-icon-button ew-delete" aria-label={'Delete ' + task.title} onClick={() => deleteTask(task.id)}><Icon name="trash" size={15} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>;
                                })}
                            </div>
                        )}
                    </section>
                    <p className="ew-footnote">These are personal planning dates, not official TSA submission deadlines. Always verify deadlines with your chapter or event organizer.</p>
                </div>
            )}

            {tab === 'portfolio' && (
                <div className="ew-stack">
                    <div className="ew-local-notice"><Icon name="shield" size={18} /><span>Private to this device. Files, ideas, and team details are stored locally, not uploaded to TSA Hub. Export a backup regularly; clearing app data or reinstalling may erase them.</span></div>
                    {!portfolio ? <div className="ew-panel">Opening your local portfolio…</div> : (
                        <>
                            <section className="ew-panel">
                                <div className="ew-panel-head">
                                    <div><h2>Project journal</h2><p>Keep your direction, ongoing work, and rough ideas together.</p></div>
                                </div>
                                <div className="ew-journal">
                                    <Field label="Project overview" value={portfolio.summary} multiline placeholder="What are you building or researching? What's the goal?" onChange={summary => updatePortfolio({ ...portfolioRef.current, summary })} />
                                    <Field label="Current progress" value={portfolio.project} multiline placeholder="What have you finished? What are you working on?" onChange={project => updatePortfolio({ ...portfolioRef.current, project })} />
                                    <Field label="Ideas and notes" value={portfolio.ideas} multiline placeholder="Sketch ideas, things to test, feedback to explore…" onChange={ideas => updatePortfolio({ ...portfolioRef.current, ideas })} />
                                </div>
                            </section>
                            <Collection title="References" hint="Save articles, research links, videos, and cloud files. Only http/https links open."
                                entries={portfolio.references} fields={[{ key: 'title', label: 'Label', placeholder: 'e.g. Design inspiration' }, { key: 'url', label: 'URL', type: 'url', placeholder: 'https://…' }]}
                                onAdd={() => addEntry('references', { title: '', url: '' })} onUpdate={(entryId, key, value) => editEntry('references', entryId, key, value)}
                                onRemove={entryId => removeEntry('references', entryId)} />
                            <section className="ew-panel">
                                <div className="ew-panel-head">
                                    <div><h2>Project files</h2><p>Save PDFs, images, drafts, and reference documents on this device. Max 20 MB each, 80 MB total.</p></div>
                                    <label className={'ew-button ew-button-light ew-upload' + (busy ? ' disabled' : '')}>
                                        <Icon name="plus" size={15} /> Attach files
                                        <input type="file" multiple disabled={busy} onChange={uploadFiles} />
                                    </label>
                                </div>
                                {!files.length && <p className="ew-empty">No files attached. For larger videos or shared documents, save a link under References instead.</p>}
                                <div className="ew-files">
                                    {files.map(file => (
                                        <div className="ew-file" key={file.id}>
                                            <Icon name="file-text" size={20} />
                                            <span className="ew-file-name"><strong>{file.name}</strong><small><FileSize bytes={file.size} /></small></span>
                                            <button type="button" className="ew-button ew-button-light" onClick={() => downloadFile(file.id)}>Download</button>
                                            <button type="button" className="ew-icon-button ew-delete" aria-label={'Remove ' + file.name} onClick={() => removeFile(file.id)}><Icon name="trash" size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <Collection title="Team members" hint="Names and roles for this event. Avoid storing unnecessary private contact information."
                                entries={portfolio.team} fields={[{ key: 'name', label: 'Name', placeholder: 'Teammate name' }, { key: 'role', label: 'Responsibility', placeholder: 'e.g. CAD & prototyping' }, { key: 'contact', label: 'Contact (optional)', placeholder: 'Only if needed' }]}
                                onAdd={() => addEntry('team', { name: '', role: '', contact: '' })} onUpdate={(entryId, key, value) => editEntry('team', entryId, key, value)}
                                onRemove={entryId => removeEntry('team', entryId)} />
                            <Collection title="Awards" hint="Record conference results, recognitions, or milestones as you earn them."
                                entries={portfolio.awards} fields={[{ key: 'title', label: 'Award or recognition', placeholder: 'e.g. Regional finalist' }, { key: 'result', label: 'Result / notes', placeholder: 'Placement or details' }, { key: 'year', label: 'Year', placeholder: '2027' }]}
                                onAdd={() => addEntry('awards', { title: '', result: '', year: '' })} onUpdate={(entryId, key, value) => editEntry('awards', entryId, key, value)}
                                onRemove={entryId => removeEntry('awards', entryId)} />
                            <section className="ew-panel ew-backup">
                                <div><h2>Keep a copy of your work</h2><p>Download an offline JSON backup containing portfolio notes, links, team details, awards, and attached files. Checklist tasks and deadlines remain in app preferences and are not included in this backup yet.</p></div>
                                <button type="button" className="ew-button ew-button-primary" onClick={backupWorkspace} disabled={busy}><Icon name="file-text" size={16} /> Export portfolio backup</button>
                            </section>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
