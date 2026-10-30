import { useState } from 'react';
import { Icon } from '../../../components/UI.jsx';
import { newTemplateLabels, templatesForEvent } from '../../../data/workspaceTemplates.js';

export default function ChecklistPanel({ eventId, event, checklist, actions }) {
    const [draft, setDraft] = useState('');
    const done = checklist.filter((row) => row.done).length;
    const templates = templatesForEvent(event);

    return (
        <div className="ew-stack">
            <section className="ew-panel">
                <div className="ew-panel-head">
                    <div>
                        <h2>Preparation checklist</h2>
                        <p>Add your own tasks or start from a template. Templates are general tips, not official TSA requirements.</p>
                    </div>
                    <span className="ew-fraction">{done} of {checklist.length}</span>
                </div>
                <div className="ew-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={checklist.length} aria-valuenow={done} aria-label="Checklist progress">
                    <div style={{ width: checklist.length ? (done / checklist.length * 100) + '%' : '0%' }} />
                </div>
                <div className="ew-check-list">
                    {checklist.map((item) => (
                        <div className={'ew-check-row' + (item.done ? ' checked' : '')} key={item.id}>
                            <label>
                                <input type="checkbox" checked={Boolean(item.done)} onChange={() => actions.toggleChecklist(eventId, item.id)} />
                                <span>{item.label}</span>
                            </label>
                            <button type="button" className="ew-icon-button" aria-label={'Remove ' + item.label} onClick={() => actions.removeChecklistItem(eventId, item.id)}>
                                <Icon name="x" size={15} />
                            </button>
                        </div>
                    ))}
                </div>
                {!checklist.length && <p className="ew-empty">No tasks yet. Add your own below or pick a template to get started.</p>}
                <form className="ew-inline-form ew-add-task" onSubmit={(e) => {
                    e.preventDefault();
                    const label = draft.trim();
                    if (!label) return;
                    actions.addChecklistItem(eventId, label);
                    setDraft('');
                }}>
                    <input value={draft} maxLength={180} onChange={(e) => setDraft(e.target.value)} placeholder="Add a checklist task…" aria-label="New checklist task" />
                    <button className="ew-button ew-button-primary" disabled={!draft.trim()} type="submit"><Icon name="plus" size={15} /> Add</button>
                </form>
            </section>

            <section className="ew-panel">
                <div className="ew-panel-head">
                    <div>
                        <h2>Checklist templates</h2>
                        <p>Adds only the steps you don't already have. You can edit or remove any of them afterwards.</p>
                    </div>
                </div>
                <div className="ew-templates">
                    {templates.map((template) => {
                        const fresh = newTemplateLabels(template, checklist);
                        return (
                            <div className="ew-template" key={template.id}>
                                <div className="ew-template-info">
                                    <strong>{template.name}</strong>
                                    <small>{fresh.length ? fresh.length + ' new step' + (fresh.length === 1 ? '' : 's') : 'All steps added'}</small>
                                </div>
                                <button type="button" className="ew-button ew-button-light" disabled={!fresh.length}
                                    onClick={() => actions.addChecklistItems(eventId, fresh)}>
                                    <Icon name="plus" size={14} /> Add
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>
            <p className="ew-footnote">Check the official rules before treating any task as a requirement. Milestones with dates live in the Deadlines tab.</p>
        </div>
    );
}
