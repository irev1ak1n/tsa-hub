// Private, device-local event workspaces: project notes, references, team,
// awards and attached files. Nothing here is ever sent to Supabase or any
// server. A separate, versioned database keeps this data apart from the
// personal calendar and the app preferences, so restoring or clearing one
// never touches the other. Bump DB_VERSION and add an upgrade branch when the
// shape changes; never drop a store on upgrade.

const DB_NAME = 'tsa-hub-event-workspaces';
const DB_VERSION = 1;
const WORKSPACES = 'workspaces';
const FILES = 'files';

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_WORKSPACE_BYTES = 80 * 1024 * 1024;
export const BACKUP_FORMAT = 'tsa-hub-workspace';
export const BACKUP_VERSION = 1;
// 80 MB of files is about 107 MB as base64, plus text.
export const MAX_BACKUP_BYTES = 120 * 1024 * 1024;
const MAX_BACKUP_FILES = 100;
const MAX_ENTRIES = 500;

let dbPromise;

export function resetWorkspaceDbForTests() {
    dbPromise = null;
}

function friendlyError(err, fallback) {
    const name = err?.name;
    if (name === 'QuotaExceededError') return new Error('This device is out of storage space. Free some space or remove files, then try again.');
    if (name === 'InvalidStateError' || name === 'SecurityError') return new Error('Local storage is blocked in this browser mode (for example private browsing). Export a backup to keep your work.');
    return err instanceof Error && err.message ? err : new Error(fallback);
}

function openDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('This device does not support local portfolio storage.'));
                return;
            }
            let req;
            try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (err) { reject(friendlyError(err, 'Could not open local workspace storage.')); return; }
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(WORKSPACES)) {
                    db.createObjectStore(WORKSPACES, { keyPath: 'eventId' });
                }
                if (!db.objectStoreNames.contains(FILES)) {
                    const store = db.createObjectStore(FILES, { keyPath: 'id' });
                    store.createIndex('eventId', 'eventId', { unique: false });
                }
            };
            req.onsuccess = () => {
                const db = req.result;
                db.onversionchange = () => { db.close(); dbPromise = null; };
                resolve(db);
            };
            req.onerror = () => { dbPromise = null; reject(friendlyError(req.error, 'Could not open local workspace storage.')); };
            req.onblocked = () => { dbPromise = null; reject(new Error('Close other TSA Hub tabs and try again.')); };
        }).catch((err) => { dbPromise = null; throw err; });
    }
    return dbPromise;
}

function requestPromise(req) {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Local storage operation failed.'));
    });
}

function txDone(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('Unable to save locally.'));
        tx.onabort = () => reject(tx.error || new Error('Local storage was interrupted.'));
    });
}

async function storeRequest(name, mode, operation) {
    try {
        const db = await openDb();
        const tx = db.transaction(name, mode);
        const done = txDone(tx);
        const value = await requestPromise(operation(tx.objectStore(name)));
        await done;
        return value;
    } catch (err) {
        throw friendlyError(err, 'Local storage operation failed.');
    }
}

export function emptyPortfolio(eventId) {
    return { eventId, summary: '', ideas: '', project: '', references: [], team: [], awards: [] };
}

export function newWorkspaceId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

export async function readPortfolio(eventId) {
    const row = await storeRequest(WORKSPACES, 'readonly', (store) => store.get(eventId));
    return { ...emptyPortfolio(eventId), ...(row || {}), eventId };
}

export async function savePortfolio(portfolio) {
    return storeRequest(WORKSPACES, 'readwrite', (store) => store.put(portfolio));
}

export async function listPortfolioFiles(eventId) {
    const entries = await storeRequest(FILES, 'readonly', (store) => store.index('eventId').getAll(eventId));
    // Blobs stay in IndexedDB; React state only holds the metadata.
    return entries.map(({ blob, ...metadata }) => metadata).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPortfolioFile(id) {
    return storeRequest(FILES, 'readonly', (store) => store.get(id));
}

function safeName(name) {
    // eslint-disable-next-line no-control-regex
    const cleaned = String(name || '').replace(/[\u0000-\u001F\u007F\\/:*?"<>|]/g, '_').trim().slice(0, 180);
    return cleaned || 'file';
}

let persistRequested = false;
function requestPersistentStorage() {
    if (persistRequested) return;
    persistRequested = true;
    try { navigator.storage?.persist?.().catch(() => {}); } catch { /* best effort */ }
}

export async function addPortfolioFile(eventId, file) {
    if (!file || !file.name || file.size === 0) throw new Error('Choose a nonempty file.');
    if (file.size > MAX_FILE_BYTES) throw new Error('Files must be 20 MB or smaller. Link a cloud file for larger work.');
    const existing = await listPortfolioFiles(eventId);
    if (existing.reduce((size, item) => size + item.size, 0) + file.size > MAX_WORKSPACE_BYTES) {
        throw new Error('This workspace has reached its 80 MB file limit. Remove some files or use reference links.');
    }
    requestPersistentStorage();
    const record = {
        id: newWorkspaceId(),
        eventId,
        name: safeName(file.name),
        type: file.type || 'application/octet-stream',
        size: file.size,
        createdAt: new Date().toISOString(),
        blob: file,
    };
    await storeRequest(FILES, 'readwrite', (store) => store.put(record));
    const { blob, ...metadata } = record;
    return metadata;
}

export async function deletePortfolioFile(id) {
    return storeRequest(FILES, 'readwrite', (store) => store.delete(id));
}

// Browser download of a Blob. The one place that would need a native
// Filesystem/Share implementation inside a Capacitor app.
export function saveBlobToDevice(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function downloadPortfolioFile(id) {
    const record = await getPortfolioFile(id);
    if (!record?.blob) throw new Error('File not found on this device.');
    saveBlobToDevice(record.blob, record.name);
}

async function blobToBase64(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(binary);
}

function base64ToBlob(base64, type) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: type || 'application/octet-stream' });
}

// Backups hold text and attachments together. Users still need a separate
// copy: clearing site data, reinstalling, or low storage can remove IndexedDB.
export async function buildWorkspaceBackup(eventId, plan = {}) {
    const [portfolio, fileMeta] = await Promise.all([readPortfolio(eventId), listPortfolioFiles(eventId)]);
    const files = [];
    for (const meta of fileMeta) {
        const record = await getPortfolioFile(meta.id);
        if (!record?.blob) continue;
        files.push({ name: record.name, type: record.type, size: record.size, createdAt: record.createdAt, data: await blobToBase64(record.blob) });
    }
    return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        eventId,
        exportedAt: new Date().toISOString(),
        portfolio,
        checklist: plan.checklist || [],
        milestones: plan.milestones || [],
        files,
    };
}

export function backupFilename(eventId) {
    return 'tsa-hub-' + String(eventId).replace(/[^a-z0-9-]/gi, '_') + '-backup.json';
}

export async function exportPortfolio(eventId, plan = {}) {
    const backup = await buildWorkspaceBackup(eventId, plan);
    saveBlobToDevice(new Blob([JSON.stringify(backup)], { type: 'application/json' }), backupFilename(eventId));
}

function cleanText(value, max = 100000) {
    return typeof value === 'string' ? value.slice(0, max) : '';
}

function cleanList(source, fields) {
    if (!Array.isArray(source)) return [];
    return source.slice(0, MAX_ENTRIES).map((entry) => Object.fromEntries([
        ['id', newWorkspaceId()],
        ...fields.map((field) => [field, cleanText(entry?.[field], 5000)]),
    ]));
}

function decodeFile(entry) {
    if (typeof entry?.name !== 'string' || typeof entry?.data !== 'string') throw new Error('An attachment in the backup is invalid.');
    // Accept plain base64 and the data-URL form used by earlier backups.
    const match = /^data:([^;,]*)(?:;[^,]*)?;base64,(.*)$/s.exec(entry.data);
    const base64 = match ? match[2] : entry.data;
    const type = cleanText(entry.type || (match && match[1]), 120);
    let blob;
    try { blob = base64ToBlob(base64, type); } catch { throw new Error('An attachment in the backup is corrupted.'); }
    return {
        blob,
        name: safeName(entry.name),
        type: blob.type || 'application/octet-stream',
        createdAt: typeof entry.createdAt === 'string' && !Number.isNaN(Date.parse(entry.createdAt)) ? entry.createdAt : new Date().toISOString(),
    };
}

// Validates a backup file for one event and returns what would be restored,
// without touching storage. Throws a user-readable Error on anything wrong.
export async function parseWorkspaceBackup(eventId, backup) {
    if (!backup || backup.size === 0) throw new Error('Choose a workspace backup file.');
    if (backup.size > MAX_BACKUP_BYTES) throw new Error('This backup is larger than 120 MB and cannot be restored on this device.');
    let data;
    try { data = JSON.parse(await backup.text()); } catch { throw new Error('This is not a valid JSON backup.'); }
    if (data?.format !== BACKUP_FORMAT || data.version !== BACKUP_VERSION) throw new Error('This is not a supported TSA Hub workspace backup.');
    if (data.eventId !== eventId) throw new Error('This backup belongs to a different event. Open that event’s workspace to restore it.');
    if (!data.portfolio || typeof data.portfolio !== 'object') throw new Error('Workspace data is missing from this backup.');

    const portfolio = {
        ...emptyPortfolio(eventId),
        summary: cleanText(data.portfolio.summary),
        project: cleanText(data.portfolio.project),
        ideas: cleanText(data.portfolio.ideas),
        references: cleanList(data.portfolio.references, ['title', 'url']),
        team: cleanList(data.portfolio.team, ['name', 'role', 'contact']),
        awards: cleanList(data.portfolio.awards, ['title', 'result', 'year']),
    };

    const entries = Array.isArray(data.files) ? data.files : [];
    if (entries.length > MAX_BACKUP_FILES) throw new Error('This backup contains too many files.');
    let total = 0;
    const files = entries.map((entry) => {
        const file = decodeFile(entry);
        total += file.blob.size;
        if (file.blob.size > MAX_FILE_BYTES || total > MAX_WORKSPACE_BYTES) throw new Error('Backup attachments exceed this device’s workspace limits.');
        return file;
    });

    return {
        portfolio,
        files,
        checklist: Array.isArray(data.checklist) ? data.checklist : null,
        milestones: Array.isArray(data.milestones) ? data.milestones : null,
    };
}

// Replaces this event's portfolio and attachments in ONE transaction: if
// anything fails (for example storage runs out), nothing is changed.
export async function replaceWorkspace(eventId, portfolio, files) {
    try {
        const db = await openDb();
        const tx = db.transaction([WORKSPACES, FILES], 'readwrite');
        const done = txDone(tx);
        try {
            const fileStore = tx.objectStore(FILES);
            tx.objectStore(WORKSPACES).put({ ...portfolio, eventId });
            const oldKeys = await requestPromise(fileStore.index('eventId').getAllKeys(eventId));
            oldKeys.forEach((key) => fileStore.delete(key));
            const now = Date.now();
            files.forEach((file, i) => {
                fileStore.put({
                    id: newWorkspaceId(),
                    eventId,
                    name: file.name,
                    type: file.type,
                    size: file.blob.size,
                    createdAt: file.createdAt || new Date(now + i).toISOString(),
                    blob: file.blob,
                });
            });
        } catch (err) {
            // A synchronous failure would otherwise let the earlier writes commit.
            try { tx.abort(); } catch { /* already finished */ }
            await done.catch(() => {});
            throw err;
        }
        await done;
    } catch (err) {
        throw friendlyError(err, 'Could not restore this backup. Nothing was changed.');
    }
}

// Restore = validate everything first, then replace atomically. The caller
// applies the returned checklist and milestones to app state afterwards.
export async function importPortfolio(eventId, backup) {
    const parsed = await parseWorkspaceBackup(eventId, backup);
    await replaceWorkspace(eventId, parsed.portfolio, parsed.files);
    return { portfolio: parsed.portfolio, checklist: parsed.checklist, milestones: parsed.milestones };
}
