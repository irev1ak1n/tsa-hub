import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../components/UI.jsx';
import { officialDeadlinesFor } from '../../../data/officialDeadlines.js';
import { daysFromToday, fmtDate, fmtRange, milestoneStatus, officialStatus, todayLocal } from './shared.jsx';

function buildTimeline(milestones, official, today) {
    const dated = [
        ...official.map((item) => ({ kind: 'official', key: item.id, date: item.startDate, item })),
        ...milestones.filter((task) => task.due).map((task) => ({ kind: 'mine', key: task.id, date: task.due, task })),
    ].sort((a, b) => a.date.localeCompare(b.date) || (a.kind === b.kind ? 0 : a.kind === 'official' ? -1 : 1));
    const undated = milestones.filter((task) => !task.due).map((task) => ({ kind: 'mine', key: task.id, date: '', task }));

    const rows = [];
    let placed = false;
    for (const row of dated) {
        if (!placed && row.date >= today) { rows.push({ kind: 'today', key: 'today' }); placed = true; }
        rows.push(row);
    }
    if (!placed && dated.length) rows.push({ kind: 'today', key: 'today' });
    return { rows, undated };
}

function MilestoneCard({ task, actions }) {
    const done = task.status === 'done';
    const status = milestoneStatus(task.due, done);
    return (
        <div className={'ew-milestone ' + status.tone} role="listitem">
            <div className="ew-chart-marker"><span className="ew-dot">{done ? '✓' : status.tone === 'overdue' ? '!' : ''}</span><span className="ew-line" /></div>
            <div className="ew-milestone-body">
                <span className="ew-milestone-date">{fmtDate(task.due)}</span>
                <div className="ew-milestone-card">
                    <div className="ew-milestone-info">
                        <span className="ew-badge ew-badge-mine">Your milestone</span>
                        <strong>{task.title}</strong>
                        <span className={'ew-status ' + status.tone}>{status.label}</span>
                    </div>
                    <div className="ew-milestone-actions">
                        <input type="date" className="ew-date-input" value={task.due || ''} aria-label={'Date for ' + task.title}
                            onChange={(e) => actions.updateTask(task.id, { due: e.target.value })} />
                        <button type="button" className="ew-button ew-button-light" onClick={() => actions.moveTask(task.id, done ? 'todo' : 'done')}>{done ? 'Reopen' : 'Mark done'}</button>
                        <button type="button" className="ew-icon-button ew-delete" aria-label={'Delete ' + task.title} onClick={() => actions.deleteTask(task.id)}><Icon name="trash" size={15} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OfficialCard({ item }) {
    const status = officialStatus(item.startDate, item.endDate);
    return (
        <div className={'ew-milestone official ' + status.tone} role="listitem">
            <div className="ew-chart-marker"><span className="ew-dot"><Icon name="flag" size={13} /></span><span className="ew-line" /></div>
            <div className="ew-milestone-body">
                <span className="ew-milestone-date">{fmtRange(item.startDate, item.endDate)}</span>
                <div className="ew-milestone-card">
                    <div className="ew-milestone-info">
                        <span className="ew-badge ew-badge-official">Official TSA date</span>
                        <strong>{item.title}</strong>
                        <span className={'ew-status ' + status.tone}>{status.label}</span>
                    </div>
                    <a className="ew-open-link" href={item.url} target="_blank" rel="noopener noreferrer">{item.provider} <Icon name="chevron-right" size={13} /></a>
                </div>
            </div>
        </div>
    );
}

export default function DeadlinesPanel({ eventId, milestones, stateName, actions }) {
    const [title, setTitle] = useState('');
    const [due, setDue] = useState('');
    const [showOfficial, setShowOfficial] = useState(true);
    const official = useMemo(() => (showOfficial ? officialDeadlinesFor({ stateName }) : []), [showOfficial, stateName]);
    const today = todayLocal();
    const { rows, undated } = buildTimeline(milestones, official, today);
    const done = milestones.filter((task) => task.status === 'done').length;
    const overdue = milestones.filter((task) => task.status !== 'done' && task.due && daysFromToday(task.due) < 0).length;

    return (
        <div className="ew-stack">
            <section className="ew-panel">
                <div className="ew-panel-head">
                    <div>
                        <h2>Deadline timeline</h2>
                        <p>Your own milestones sit alongside official TSA dates. Only the milestones you add are yours to edit; official dates are read-only.</p>
                    </div>
                    <span className="ew-fraction">{done} of {milestones.length} done{overdue ? ' · ' + overdue + ' overdue' : ''}</span>
                </div>

                <form className="ew-milestone-form" onSubmit={(e) => {
                    e.preventDefault();
                    const text = title.trim();
                    if (!text) return;
                    actions.addTask({ eventId, title: text.slice(0, 180), due });
                    setTitle('');
                    setDue('');
                }}>
                    <input aria-label="Milestone title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={180} placeholder="e.g. Finish first prototype" required />
                    <input aria-label="Milestone deadline" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
                    <button className="ew-button ew-button-primary" type="submit"><Icon name="plus" size={15} /> Add milestone</button>
                </form>

                <label className="ew-toggle">
                    <input type="checkbox" checked={showOfficial} onChange={(e) => setShowOfficial(e.target.checked)} />
                    <span>Show official TSA dates{stateName ? ' (including ' + stateName + ')' : ''}</span>
                </label>
                {showOfficial && !stateName && (
                    <p className="ew-hint">Choose your state under <Link to="/resources">Resources</Link> to include your state conference.</p>
                )}

                {!rows.length && !undated.length ? (
                    <p className="ew-empty">Nothing on the timeline yet. Add your first milestone above.</p>
                ) : (
                    <div className="ew-chart" role="list" aria-label="Project deadline timeline">
                        {rows.map((row) => {
                            if (row.kind === 'today') {
                                return <div className="ew-today" role="listitem" key={row.key}><span>{'Today · ' + fmtDate(today)}</span></div>;
                            }
                            return row.kind === 'official'
                                ? <OfficialCard key={row.key} item={row.item} />
                                : <MilestoneCard key={row.key} task={row.task} actions={actions} />;
                        })}
                        {undated.length > 0 && <div className="ew-undated-head" role="listitem">No date yet</div>}
                        {undated.map((task) => <MilestoneCard key={task.id} task={task} actions={actions} />)}
                    </div>
                )}
            </section>
            <p className="ew-footnote">Official dates come from National TSA and verified state sources. Always confirm deadlines with your advisor and the official event pages; your own milestones are personal planning dates only.</p>
        </div>
    );
}
