// ============================================================================
// Local-only persistence for the user's personal calendar (events &
// reminders). Everything here stays in the browser's IndexedDB — nothing is
// ever sent to a server. See src/hooks/usePersonalCalendar.js for the React
// surface, and PERSONAL_ITEM shape docs below.
//
// Schema versioning: bump DB_VERSION and add an `if (oldVersion < N)` branch
// in the upgrade handler when the shape changes. Never drop the object store
// on upgrade — that would delete the user's existing records.
// ============================================================================

const DB_NAME = 'tsa-hub-personal-calendar';
const DB_VERSION = 1;
const STORE = 'items';

let dbPromise = null;

function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB is not available in this browser.'));
            return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                const store = db.createObjectStore(STORE, { keyPath: 'id' });
                store.createIndex('startDate', 'startDate', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Failed to open local calendar storage.'));
    });
    return dbPromise;
}

function tx(storeMode) {
    return openDb().then((db) => db.transaction(STORE, storeMode).objectStore(STORE));
}

export function genId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getAllPersonalItems() {
    const store = await tx('readonly');
    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error || new Error('Failed to read local calendar items.'));
    });
}

export async function putPersonalItem(item) {
    const store = await tx('readwrite');
    return new Promise((resolve, reject) => {
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error || new Error('Failed to save this item locally.'));
    });
}

export async function deletePersonalItem(id) {
    const store = await tx('readwrite');
    return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error || new Error('Failed to delete this item locally.'));
    });
}
