import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// useState that survives leaving a page and coming back with Back or Forward.
//
// The value is remembered per history entry (location.key), so opening the
// page fresh (a link or a button) still starts from the default, but going
// Back to the entry you left restores what you had typed or picked. Without
// this, a search page returns empty and there is nothing left to scroll to.
// Kept in memory for the current page load only.

const MAX_ENTRIES = 200;
const store = new Map();

export default function useEntryState(name, initial) {
    const { key } = useLocation();
    const id = `${key}:${name}`;
    const [value, setValue] = useState(() => (
        store.has(id) ? store.get(id) : (typeof initial === 'function' ? initial() : initial)
    ));

    useEffect(() => {
        store.delete(id);
        store.set(id, value);
        while (store.size > MAX_ENTRIES) store.delete(store.keys().next().value);
    }, [id, value]);

    return [value, setValue];
}
