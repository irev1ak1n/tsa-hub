import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyPortfolio, listPortfolioFiles, readPortfolio, savePortfolio } from '../../../services/eventWorkspaceDb.js';

const SAVE_DELAY_MS = 500;

// Loads one event's local portfolio and saves edits to IndexedDB after a short
// pause. Pending edits are flushed when the page is hidden, the event changes,
// or the screen unmounts, so typing is not lost by navigating away quickly.
export function useWorkspaceStorage(eventId) {
    const [portfolio, setPortfolio] = useState(null);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [saveState, setSaveState] = useState('idle');
    const current = useRef(null);
    const dirty = useRef(false);
    const timer = useRef(null);
    const queue = useRef(Promise.resolve());

    const flush = useCallback(() => {
        clearTimeout(timer.current);
        timer.current = null;
        if (dirty.current && current.current) {
            dirty.current = false;
            const snapshot = current.current;
            setSaveState('saving');
            queue.current = queue.current.catch(() => {}).then(() => savePortfolio(snapshot)).then(() => {
                if (!dirty.current) setSaveState('saved');
            }).catch((err) => {
                dirty.current = true;
                setError(err?.message || 'Could not save locally. Export a backup before closing this page.');
                setSaveState('error');
            });
        }
        return queue.current.catch(() => {});
    }, []);

    useEffect(() => {
        let alive = true;
        current.current = null;
        dirty.current = false;
        setPortfolio(null);
        setFiles([]);
        setError('');
        setSaveState('idle');
        Promise.all([readPortfolio(eventId), listPortfolioFiles(eventId)]).then(([data, entries]) => {
            if (!alive) return;
            current.current = data;
            setPortfolio(data);
            setFiles(entries);
        }).catch((err) => {
            if (!alive) return;
            const fallback = emptyPortfolio(eventId);
            current.current = fallback;
            setPortfolio(fallback);
            setError(err?.message || 'Local storage could not be opened.');
        });
        const onHide = () => { flush(); };
        window.addEventListener('pagehide', onHide);
        return () => {
            alive = false;
            window.removeEventListener('pagehide', onHide);
            flush();
        };
    }, [eventId, flush]);

    const update = useCallback((change) => {
        if (!current.current) return;
        const next = typeof change === 'function' ? change(current.current) : { ...current.current, ...change };
        current.current = next;
        dirty.current = true;
        setPortfolio(next);
        setSaveState('dirty');
        clearTimeout(timer.current);
        timer.current = setTimeout(flush, SAVE_DELAY_MS);
    }, [flush]);

    const refreshFiles = useCallback(async () => {
        setFiles(await listPortfolioFiles(eventId).catch(() => []));
    }, [eventId]);

    // Used after a restore: show the stored portfolio without marking it unsaved.
    const adopt = useCallback((next) => {
        current.current = next;
        dirty.current = false;
        setPortfolio(next);
        setSaveState('saved');
    }, []);

    return { portfolio, files, error, setError, saveState, update, flush, refreshFiles, adopt };
}
