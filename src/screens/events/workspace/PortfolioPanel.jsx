import { useState } from 'react';
import { Icon } from '../../../components/UI.jsx';
import {
    addPortfolioFile, deletePortfolioFile, downloadPortfolioFile, exportPortfolio,
    newWorkspaceId, parseWorkspaceBackup, replaceWorkspace,
} from '../../../services/eventWorkspaceDb.js';
import { Field, fmtBytes, safeUrl } from './shared.jsx';

const SAVE_LABEL = {
    dirty: 'Saving…',
    saving: 'Saving…',
    saved: 'Saved on this device',
    error: 'Not saved — export a backup',
};

function Collection({ title, singular, hint, entries, fields, onAdd, onUpdate, onRemove }) {
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
                                <Field key={field.key} label={field.label} value={entry[field.key] || ''} maxLength={field.max || 300}
                                    onChange={(value) => onUpdate(entry.id, field.key, value)}
                                    placeholder={field.placeholder || ''} type={field.type || 'text'} />
                            ))}
                            {entry.url && safeUrl(entry.url) && <a className="ew-open-link" href={safeUrl(entry.url)} target="_blank" rel="noopener noreferrer">Open reference <Icon name="chevron-right" size={13} /></a>}
                            {entry.url && !safeUrl(entry.url) && <span className="ew-hint">Only http and https links can be opened.</span>}
                        </div>
                        <button type="button" className="ew-icon-button ew-delete" onClick={() => onRemove(entry.id)} aria-label={'Remove ' + singular}><Icon name="trash" size={16} /></button>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function PortfolioPanel({ eventId, store, plan, replaceEventPlan }) {
    const { portfolio, files, error, setError, saveState, update, flush, refreshFiles, adopt } = store;
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');

    function mutate(key, change) {
        update((old) => ({ ...old, [key]: change(old[key] || []) }));
    }
    const addEntry = (key, fields) => mutate(key, (list) => [...list, { id: newWorkspaceId(), ...fields }]);
    const editEntry = (key, id, field, value) => mutate(key, (list) => list.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    const removeEntry = (key, id) => mutate(key, (list) => list.filter((row) => row.id !== id));

    async function guarded(task) {
        setBusy(true);
        setError('');
        setNotice('');
        try { await task(); }
        catch (err) { setError(err?.message || 'Something went wrong.'); }
        finally { setBusy(false); }
    }

    const attach = (e) => {
        const selection = Array.from(e.target.files || []);
        e.target.value = '';
        if (!selection.length) return;
        guarded(async () => {
            try { for (const file of selection) await addPortfolioFile(eventId, file); }
            finally { await refreshFiles(); }
        });
    };

    const removeFile = (file) => {
        if (!window.confirm('Remove "' + file.name + '" from this device? This cannot be undone.')) return;
        guarded(async () => { await deletePortfolioFile(file.id); await refreshFiles(); });
    };

    const backup = () => guarded(async () => {
        await flush();
        await exportPortfolio(eventId, plan);
        setNotice('Backup downloaded. Keep the file somewhere private.');
    });

    const restore = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        guarded(async () => {
            await flush();
            const parsed = await parseWorkspaceBackup(eventId, file);
            const counts = parsed.files.length + ' file(s), ' + (parsed.checklist?.length ?? 0) + ' checklist task(s) and ' + (parsed.milestones?.length ?? 0) + ' milestone(s)';
            if (!window.confirm('Restore this backup (' + counts + ')?\n\nThis replaces this event’s current portfolio, files, checklist and milestones. Your other events and your calendar are not affected. This cannot be undone.')) return;
            await replaceWorkspace(eventId, parsed.portfolio, parsed.files);
            adopt(parsed.portfolio);
            await refreshFiles();
            replaceEventPlan(eventId, parsed.checklist, parsed.milestones);
            setNotice('Backup restored.');
        });
    };

    return (
        <div className="ew-stack">
            <div className="ew-local-notice"><Icon name="shield" size={18} /><span>Private to this device. Notes, links, team details and files are stored locally and never uploaded to TSA Hub. Export a backup regularly: clearing app data or reinstalling can erase them.</span></div>
            {error && <p className="ew-error" role="alert">{error}</p>}
            {notice && <p className="ew-notice" role="status">{notice}</p>}
            {!portfolio ? <div className="ew-panel ew-subtle" role="status">Opening your local portfolio…</div> : (
                <>
                    <section className="ew-panel">
                        <div className="ew-panel-head">
                            <div><h2>Project journal</h2><p>Keep your direction, ongoing work, and rough ideas together.</p></div>
                            {SAVE_LABEL[saveState] && <span className={'ew-save ' + saveState} role="status">{SAVE_LABEL[saveState]}</span>}
                        </div>
                        <div className="ew-journal">
                            <Field label="Project overview" value={portfolio.summary} multiline maxLength={20000} placeholder="What are you building or researching? What's the goal?" onChange={(summary) => update({ summary })} />
                            <Field label="Current progress" value={portfolio.project} multiline maxLength={20000} placeholder="What have you finished? What are you working on?" onChange={(project) => update({ project })} />
                            <Field label="Ideas and notes" value={portfolio.ideas} multiline maxLength={20000} placeholder="Sketch ideas, things to test, feedback to explore…" onChange={(ideas) => update({ ideas })} />
                        </div>
                    </section>

                    <Collection title="References" singular="reference" hint="Save articles, research links, videos, and cloud files. Only http and https links open."
                        entries={portfolio.references} fields={[{ key: 'title', label: 'Label', placeholder: 'e.g. Design inspiration' }, { key: 'url', label: 'URL', type: 'url', max: 2000, placeholder: 'https://…' }]}
                        onAdd={() => addEntry('references', { title: '', url: '' })} onUpdate={(id, key, value) => editEntry('references', id, key, value)}
                        onRemove={(id) => removeEntry('references', id)} />

                    <section className="ew-panel">
                        <div className="ew-panel-head">
                            <div><h2>Project files</h2><p>Save PDFs, images, drafts and documents on this device. Up to 20 MB each and 80 MB per event. For larger videos, save a link under References.</p></div>
                            <label className={'ew-button ew-button-light ew-upload' + (busy ? ' disabled' : '')}>
                                <Icon name="plus" size={15} /> Attach files
                                <input type="file" multiple disabled={busy} onChange={attach} aria-label="Attach files" />
                            </label>
                        </div>
                        {!files.length && <p className="ew-empty">No files attached yet.</p>}
                        <div className="ew-files">
                            {files.map((file) => (
                                <div className="ew-file" key={file.id}>
                                    <Icon name="file-text" size={20} />
                                    <span className="ew-file-name"><strong>{file.name}</strong><small>{fmtBytes(file.size)}</small></span>
                                    <button type="button" className="ew-button ew-button-light" onClick={() => guarded(() => downloadPortfolioFile(file.id))}>Download</button>
                                    <button type="button" className="ew-icon-button ew-delete" aria-label={'Remove ' + file.name} onClick={() => removeFile(file)}><Icon name="trash" size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Collection title="Team members" singular="team member" hint="Names and responsibilities for this event. Avoid storing private contact details you don't need."
                        entries={portfolio.team} fields={[{ key: 'name', label: 'Name', placeholder: 'Teammate name' }, { key: 'role', label: 'Responsibility', placeholder: 'e.g. CAD & prototyping' }, { key: 'contact', label: 'Contact (optional)', placeholder: 'Only if needed' }]}
                        onAdd={() => addEntry('team', { name: '', role: '', contact: '' })} onUpdate={(id, key, value) => editEntry('team', id, key, value)}
                        onRemove={(id) => removeEntry('team', id)} />

                    <Collection title="Awards" singular="award" hint="Record conference results, recognitions and milestones as you earn them."
                        entries={portfolio.awards} fields={[{ key: 'title', label: 'Award or recognition', placeholder: 'e.g. Regional finalist' }, { key: 'result', label: 'Result / notes', placeholder: 'Placement or details' }, { key: 'year', label: 'Year', max: 12, placeholder: '2027' }]}
                        onAdd={() => addEntry('awards', { title: '', result: '', year: '' })} onUpdate={(id, key, value) => editEntry('awards', id, key, value)}
                        onRemove={(id) => removeEntry('awards', id)} />

                    <section className="ew-panel ew-backup">
                        <div><h2>Back up your workspace</h2><p>Export one file with this event's notes, links, team, awards, attachments, checklist and milestones. Restoring replaces only this event; your other events and calendar are not affected. Keep backups private.</p></div>
                        <div className="ew-backup-actions">
                            <button type="button" className="ew-button ew-button-primary" onClick={backup} disabled={busy}><Icon name="download" size={16} /> Export backup</button>
                            <label className={'ew-button ew-button-light ew-upload' + (busy ? ' disabled' : '')}>Import backup
                                <input type="file" accept=".json,application/json" disabled={busy} onChange={restore} aria-label="Import a workspace backup" />
                            </label>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
