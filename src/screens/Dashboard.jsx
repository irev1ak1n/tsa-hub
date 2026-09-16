import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Icon } from '../components/UI.jsx';
import SubmitModal from '../components/SubmitModal.jsx';
import QuickActionsEditor from '../components/QuickActionsEditor.jsx';
import { RowIcon } from './resources/resourcesShared.jsx';
import { resolveQuickActions } from '../data/quickActions.js';
import { submitFeedback, submitReport } from '../services/feedbackService.js';

// One Quick Actions tile. `action.kind` decides how it behaves:
//   route    -> <Link>, optionally carrying router state (e.g. Calendar's
//               "open the add-event editor" signal)
//   external -> plain external link
//   modal    -> opens an existing modal (Send Feedback / Report) via callback
//   theme    -> toggles the app theme directly, no navigation
function QuickActionTile({ action, onOpenModal, onToggleTheme }) {
    const inner = (
        <>
            <RowIcon node={action.node} icon={action.icon} img={action.img} svg={action.svg} color={action.iconColor} mono={action.mono} />
            <span className="quick3-label">{action.label}</span>
        </>
    );

    if (action.kind === 'external') {
        return <a href={action.href} target="_blank" rel="noreferrer" className="quick3-tile">{inner}</a>;
    }
    if (action.kind === 'modal') {
        return (
            <button type="button" className="quick3-tile" onClick={() => onOpenModal(action.modal)}>
                {inner}
            </button>
        );
    }
    if (action.kind === 'theme') {
        return (
            <button type="button" className="quick3-tile" onClick={onToggleTheme}>
                {inner}
            </button>
        );
    }
    // 'route' (default)
    return <Link to={action.to} state={action.navState} className="quick3-tile">{inner}</Link>;
}

export default function Dashboard() {
    const { quickActions, setQuickActions, toggleTheme } = useApp();
    const [showEditor, setShowEditor] = useState(false);
    const [modal, setModal] = useState(null); // 'feedback' | 'report' | null

    const actions = resolveQuickActions(quickActions);

    return (
        <>
            {/* HERO — same eyebrow/h1 scale as Settings' "SYSTEM & STYLE" / "SETTINGS". */}
            <div className="section dash-hero">
                <p className="rs-eyebrow">Technology Student Association</p>
                <h1 className="cal-h1">Explore. Prepare. Compete.</h1>
            </div>

            {/* GLOBAL SEARCH — same component/design as Resources' search trigger,
                opens the same TSA Hub-wide search page (not just events). */}
            <Link to="/resources/search" className="rs-search rs-search-trigger" aria-label="Search TSA Hub">
                <Icon name="search" size={18} />
                <span className="rs-search-placeholder">Search</span>
            </Link>

            {/* QUICK ACTIONS ----------------------------------------------------- */}
            <div className="section">
                <div className="section-head">
                    <h2>Quick actions</h2>
                    <button
                        type="button"
                        className="dash-quick-edit"
                        onClick={() => setShowEditor(true)}
                        aria-label="Customize Quick Actions"
                        title="Customize Quick Actions"
                    >
                        <Icon name="edit" size={17} />
                    </button>
                </div>
                <div className="quick3">
                    {actions.map((action) => (
                        <QuickActionTile
                            key={action.id}
                            action={action}
                            onOpenModal={setModal}
                            onToggleTheme={toggleTheme}
                        />
                    ))}
                </div>
            </div>

            {showEditor && (
                <QuickActionsEditor
                    selectedIds={quickActions}
                    onSave={setQuickActions}
                    onClose={() => setShowEditor(false)}
                />
            )}

            {modal === 'feedback' && (
                <SubmitModal
                    title="Send Feedback"
                    hint="Found an issue or have a suggestion? We&rsquo;d love to hear it."
                    placeholder="Type your feedback…"
                    doneText="Thanks! Your feedback was sent."
                    onSubmit={submitFeedback}
                    onClose={() => setModal(null)}
                />
            )}

            {modal === 'report' && (
                <SubmitModal
                    title="Report Incorrect Information"
                    hint="See something wrong or out of date? Tell us what needs fixing and where."
                    placeholder="Describe the incorrect information…"
                    doneText="Thanks! Your report was sent."
                    onSubmit={submitReport}
                    onClose={() => setModal(null)}
                />
            )}
        </>
    );
}
