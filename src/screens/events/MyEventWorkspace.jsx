import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { getEvent } from '../../data/events.js';
import { Icon } from '../../components/UI.jsx';
import { DetailSkeleton, LoadError } from '../../components/Skeleton.jsx';
import ChecklistPanel from './workspace/ChecklistPanel.jsx';
import DeadlinesPanel from './workspace/DeadlinesPanel.jsx';
import PortfolioPanel from './workspace/PortfolioPanel.jsx';
import { useWorkspaceStorage } from './workspace/useWorkspaceStorage.js';
import { daysFromToday, fmtDate } from './workspace/shared.jsx';

const TABS = [
    { id: 'checklist', name: 'Checklist', icon: 'check' },
    { id: 'deadlines', name: 'Deadlines', icon: 'cal' },
    { id: 'portfolio', name: 'Portfolio', icon: 'book' },
];

function nextDeadlineStat(milestones) {
    const open = milestones.filter((row) => row.status !== 'done' && row.due);
    const upcoming = open.filter((row) => daysFromToday(row.due) >= 0).sort((a, b) => a.due.localeCompare(b.due));
    if (upcoming.length) return { value: fmtDate(upcoming[0].due), label: 'Next deadline', alert: false };
    const overdue = open.length;
    if (overdue) return { value: overdue + ' overdue', label: 'Deadlines', alert: true };
    return { value: '—', label: 'Next deadline', alert: false };
}

function Unavailable({ title, children }) {
    return (
        <div className="ew-page">
            <Link to="/" className="ew-back"><Icon name="arrow-left" size={17} /> Back to My Events</Link>
            <h1 className="ew-unavailable">{title}</h1>
            {children}
        </div>
    );
}

export default function MyEventWorkspace() {
    const { id } = useParams();
    const app = useApp();
    const { myEvents, eventsLoading, eventsError, reloadEvents, checklists, tasks, prefs, addEvent } = app;
    const [params, setParams] = useSearchParams();
    const store = useWorkspaceStorage(id);

    const event = getEvent(id);
    const isSaved = myEvents.includes(id);
    const checklist = checklists?.[id] || [];
    const milestones = tasks.filter((task) => task.eventId === id);
    const tab = TABS.some((item) => item.id === params.get('tab')) ? params.get('tab') : 'checklist';

    if (eventsLoading) {
        return <div className="ew-page"><DetailSkeleton sections={3} label="Loading your event workspace" /></div>;
    }
    if (!event && eventsError) {
        return (
            <Unavailable title="Couldn’t load this event">
                <LoadError message="We couldn't load the events list. Your saved data is safe on this device." onRetry={reloadEvents} />
            </Unavailable>
        );
    }
    if (!event) {
        return (
            <Unavailable title="Event not found">
                <p className="ew-subtle">This event isn't in the current catalog. It may have been archived.</p>
                <Link className="ew-button ew-button-primary" to="/events">Browse events</Link>
            </Unavailable>
        );
    }
    if (!isSaved) {
        return (
            <Unavailable title={event.name}>
                <p className="ew-subtle">Add this event to My Events to open its private workspace.</p>
                <div className="ew-row-actions">
                    <button type="button" className="ew-button ew-button-primary" onClick={() => addEvent(id)}><Icon name="plus" size={15} /> Add to My Events</button>
                    <Link className="ew-button ew-button-light" to={'/events/' + encodeURIComponent(id)}>View event details</Link>
                </div>
            </Unavailable>
        );
    }

    const doneSteps = checklist.filter((row) => row.done).length;
    const doneMilestones = milestones.filter((row) => row.status === 'done').length;
    const total = checklist.length + milestones.length;
    const progress = total ? Math.round(((doneSteps + doneMilestones) / total) * 100) : 0;
    const next = nextDeadlineStat(milestones);

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
                <div className="ew-score" style={{ '--ew-progress': progress + '%' }} role="img" aria-label={progress + '% complete'}>
                    <strong>{progress}%</strong><span>Progress</span>
                </div>
            </div>

            <div className="ew-overview">
                <div><strong>{doneSteps}/{checklist.length}</strong><span>Checklist tasks</span></div>
                <div><strong>{doneMilestones}/{milestones.length}</strong><span>Milestones</span></div>
                <div><strong>{store.files.length}</strong><span>Saved files</span></div>
                <div className={next.alert ? 'alert' : ''}><strong>{next.value}</strong><span>{next.label}</span></div>
            </div>

            <nav className="ew-tabs" aria-label="Workspace sections">
                {TABS.map((item) => (
                    <button type="button" key={item.id} aria-current={tab === item.id ? 'page' : undefined}
                        className={'ew-tab' + (tab === item.id ? ' active' : '')}
                        onClick={() => setParams(item.id === 'checklist' ? {} : { tab: item.id }, { replace: true })}>
                        <Icon name={item.icon} size={17} /> {item.name}
                    </button>
                ))}
            </nav>

            {tab === 'checklist' && <ChecklistPanel eventId={id} event={event} checklist={checklist} actions={app} />}
            {tab === 'deadlines' && <DeadlinesPanel eventId={id} milestones={milestones} stateName={prefs?.state || ''} actions={app} />}
            {tab === 'portfolio' && <PortfolioPanel eventId={id} store={store} plan={{ checklist, milestones }} replaceEventPlan={app.replaceEventPlan} />}
        </div>
    );
}
