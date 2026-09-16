import { useState } from 'react';
import { Icon } from './UI.jsx';
import { RowIcon } from '../screens/resources/resourcesShared.jsx';
import { QUICK_ACTIONS_REGISTRY, DEFAULT_QUICK_ACTION_IDS, MAX_QUICK_ACTIONS, getQuickAction } from '../data/quickActions.js';

// Customize which actions appear in Home's 3x3 Quick Actions grid. Every
// selectable action here comes from the same registry Dashboard renders
// from (src/data/quickActions.js) — nothing here duplicates a route, modal,
// or data source; it only decides which existing ones are pinned to Home.
export default function QuickActionsEditor({ selectedIds, onSave, onClose }) {
    const [draft, setDraft] = useState(() => (
        Array.isArray(selectedIds) && selectedIds.length ? selectedIds.filter((id) => getQuickAction(id)) : DEFAULT_QUICK_ACTION_IDS
    ));
    const [query, setQuery] = useState('');

    const q = query.trim().toLowerCase();
    const filtered = q
        ? QUICK_ACTIONS_REGISTRY.filter((a) => a.label.toLowerCase().includes(q))
        : QUICK_ACTIONS_REGISTRY;

    const selectedActions = draft.map(getQuickAction).filter(Boolean);
    const atMax = draft.length >= MAX_QUICK_ACTIONS;

    function toggle(id) {
        setDraft((cur) => {
            if (cur.includes(id)) return cur.filter((x) => x !== id);
            if (cur.length >= MAX_QUICK_ACTIONS) return cur;
            return [...cur, id];
        });
    }

    function move(id, dir) {
        setDraft((cur) => {
            const i = cur.indexOf(id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= cur.length) return cur;
            const next = [...cur];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });
    }

    function reset() {
        setDraft(DEFAULT_QUICK_ACTION_IDS);
    }

    function save() {
        onSave(draft);
        onClose();
    }

    return (
        <div className="rs-modal-backdrop" onClick={onClose}>
            <div
                className="rs-modal qae-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Customize Quick Actions"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rs-modal-head">
                    <h3>Customize Quick Actions</h3>
                    <button type="button" className="rs-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="rs-modal-body qae-body">
                    <p className="qae-count">{draft.length} / {MAX_QUICK_ACTIONS} selected</p>

                    {selectedActions.length > 0 && (
                        <div className="qae-selected-list">
                            {selectedActions.map((a, i) => (
                                <div className="qae-selected-row" key={a.id}>
                                    <RowIcon node={a.node} icon={a.icon} img={a.img} svg={a.svg} color={a.iconColor} mono={a.mono} />
                                    <span className="qae-selected-label">{a.label}</span>
                                    <div className="qae-reorder">
                                        <button
                                            type="button"
                                            className="qae-move-up"
                                            disabled={i === 0}
                                            onClick={() => move(a.id, -1)}
                                            aria-label={`Move ${a.label} up`}
                                        >
                                            <Icon name="chevron-right" size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className="qae-move-down"
                                            disabled={i === selectedActions.length - 1}
                                            onClick={() => move(a.id, 1)}
                                            aria-label={`Move ${a.label} down`}
                                        >
                                            <Icon name="chevron-right" size={14} />
                                        </button>
                                    </div>
                                    <button type="button" className="qae-remove" onClick={() => toggle(a.id)} aria-label={`Remove ${a.label}`}>
                                        <Icon name="x" size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="rs-search qae-search">
                        <Icon name="search" size={16} />
                        <input
                            className="rs-search-input"
                            placeholder="Search actions"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search actions"
                        />
                    </div>

                    <div className="qae-grid">
                        {filtered.map((a) => {
                            const selected = draft.includes(a.id);
                            const disabled = !selected && atMax;
                            return (
                                <button
                                    type="button"
                                    key={a.id}
                                    className={`qae-tile${selected ? ' is-selected' : ''}`}
                                    onClick={() => toggle(a.id)}
                                    disabled={disabled}
                                    aria-pressed={selected}
                                >
                                    {selected && <span className="qae-check"><Icon name="check" size={13} /></span>}
                                    <RowIcon node={a.node} icon={a.icon} img={a.img} svg={a.svg} color={a.iconColor} mono={a.mono} />
                                    <span className="qae-tile-label">{a.label}</span>
                                </button>
                            );
                        })}
                        {filtered.length === 0 && <p className="rs-state-empty">No actions match your search.</p>}
                    </div>
                </div>

                <div className="qae-footer">
                    <button type="button" className="rs-change-state" onClick={reset}>Reset to default</button>
                    <button type="button" className="btn primary small" onClick={save}>Save</button>
                </div>
            </div>
        </div>
    );
}
