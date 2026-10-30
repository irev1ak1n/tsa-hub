// Private, device-local event workspaces. Do not send portfolio files to Supabase.
// A separate, versioned database leaves the personal calendar and preferences alone.
const DB_NAME = 'tsa-hub-event-workspaces';
const DB_VERSION = 1;
const WORKSPACES = 'workspaces';
const FILES = 'files';
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_WORKSPACE_BYTES = 80 * 1024 * 1024;

let dbPromise;
function openDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('This device does not support local portfolio storage.'));
                return;
            }
            const req = indexedDB.open(DB_NAME, DB_VERSION);
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
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => {
                dbPromise = null;
                reject(req.error || new Error('Could not open local workspace storage.'));
            };
            req.onblocked = () => {
                dbPromise = null;
                reject(new Error('Close other TSA Hub tabs and try again.'));
            };
        });
    }
    return dbPromise;
}

function requestPromise(req) {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Local storage operation failed.'));
    });
}

async function storeRequest(name, mode, operation) {
    const db = await openDb();
    const tx = db.transaction(name, mode);
    const result = requestPromise(operation(tx.objectStore(name)));
    const completion = new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Unable to save locally.'));
        tx.onabort = () => reject(tx.error || new Error('Local storage was interrupted.'));
    });
    const value = await result;
    await completion;
    return value;
}

export function emptyPortfolio(eventId) {
    return { eventId, summary: '', ideas: '', project: '', references: [], team: [], awards: [] };
}

export async function readPortfolio(eventId) {
    const row = await storeRequest(WORKSPACES, 'readonly', store => store.get(eventId));
    return { ...emptyPortfolio(eventId), ...(row || {}), eventId };
}

export async function savePortfolio(portfolio) {
    return storeRequest(WORKSPACES, 'readwrite', store => store.put(portfolio));
}

export function newWorkspaceId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

export async function listPortfolioFiles(eventId) {
    const db = await openDb();
    const tx = db.transaction(FILES, 'readonly');
    const req = tx.objectStore(FILES).index('eventId').getAll(eventId);
    const entries = await requestPromise(req);
    // Don't keep Blob instances in React state; retrieve only when requested.
    return entries.map(({ blob, ...metadata }) => metadata).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPortfolioFile(id) {
    return storeRequest(FILES, 'readonly', store => store.get(id));
}

export async function addPortfolioFile(eventId, file) {
    if (!file || !file.name || file.size === 0) throw new Error('Choose a nonempty file.');
    if (file.size > MAX_FILE_BYTES) throw new Error('Files must be 20 MB or smaller. Link a cloud file for larger work.');
    const existing = await listPortfolioFiles(eventId);
    if (existing.reduce((size, item) => size + item.size, 0) + file.size > MAX_WORKSPACE_BYTES) {
        throw new Error('This workspace has reached its 80 MB file limit. Remove some files or use reference links.');
    }
    const record = {
        id: newWorkspaceId(),
        eventId,
        name: file.name.slice(0, 180),
        type: file.type || 'application/octet-stream',
        size: file.size,
        createdAt: new Date().toISOString(),
        blob: file,
    };
    await storeRequest(FILES, 'readwrite', store => store.put(record));
    return record;
}

export async function deletePortfolioFile(id) {
    return storeRequest(FILES, 'readwrite', store => store.delete(id));
}

export async function downloadPortfolioFile(id) {
    const record = await getPortfolioFile(id);
    if (!record?.blob) throw new Error('File not found on this device.');
    const url = URL.createObjectURL(record.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = record.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// Backups include both text and file attachments. Users need a separate copy:
// clearing site data or uninstalling an app can remove IndexedDB contents.
function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read an attached file for backup.'));
        reader.readAsDataURL(blob);
    });
}

export async function exportPortfolio(eventId, plan = {}) {
    const [portfolio, fileMeta] = await Promise.all([readPortfolio(eventId), listPortfolioFiles(eventId)]);
    const files = [];
    for (const meta of fileMeta) {
        const record = await getPortfolioFile(meta.id);
        files.push({ name: record.name, type: record.type, createdAt: record.createdAt, data: await blobToDataUrl(record.blob) });
    }
    const data = JSON.stringify({ format: 'tsa-hub-workspace', version: 1, eventId, exportedAt: new Date().toISOString(), portfolio, checklist: plan.checklist || [], milestones: plan.milestones || [], files }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tsa-hub-' + String(eventId).replace(/[^a-z0-9-]/gi, '_') + '-backup.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
}


// Restoring a backup is explicit and replaces this event's workspace.
// Caller confirms before invoking it, then restores checklist/milestones
// through AppContext using the returned plan.
export async function importPortfolio(eventId, backup) {
    if (!backup || backup.size > 150 * 1024 * 1024) throw new Error('Choose a workspace JSON backup under 150 MB.');
    let data;
    try { data = JSON.parse(await backup.text()); }
    catch { throw new Error('This is not a valid JSON backup.'); }
    if (data?.format !== 'tsa-hub-workspace' || data.version !== 1 || data.eventId !== eventId) {
        throw new Error('This backup belongs to a different event or is not a supported TSA Hub workspace backup.');
    }
    if (!data.portfolio || typeof data.portfolio !== 'object') throw new Error('Workspace data is missing.');
    const cleanText = (value, max = 100000) => typeof value === 'string' ? value.slice(0, max) : '';
    const cleanList = (key, fields) => Array.isArray(data.portfolio[key])
        ? data.portfolio[key].slice(0, 500).map(entry => Object.fromEntries([
            ['id', newWorkspaceId()],
            ...fields.map(field => [field, cleanText(entry?.[field], 5000)]),
        ]))
        : [];
    const portfolio = {
        ...emptyPortfolio(eventId),
        summary: cleanText(data.portfolio.summary),
        project: cleanText(data.portfolio.project),
        ideas: cleanText(data.portfolio.ideas),
        references: cleanList('references', ['title', 'url']),
        team: cleanList('team', ['name', 'role', 'contact']),
        awards: cleanList('awards', ['title', 'result', 'year']),
    };
    const entries = Array.isArray(data.files) ? data.files : [];
    if (entries.length > 100) throw new Error('This backup contains too many files.');
    let totalSize = 0;
    const incomingFiles = [];
    for (const entry of entries) {
        if (typeof entry?.name !== 'string' || !/^data:[^,]*;base64,/.test(entry?.data || '')) throw new Error('An attachment in the backup is invalid.');
        // Decode into blobs only after confirming the file is a data URL.
        const response = await fetch(entry.data);
        const blob = await response.blob();
        totalSize += blob.size;
        if (blob.size > MAX_FILE_BYTES || totalSize > MAX_WORKSPACE_BYTES) throw new Error('Backup attachments exceed this device’s workspace limits.');
        incomingFiles.push(new File([blob], entry.name.slice(0, 180), { type: blob.type || 'application/octet-stream' }));
    }

    // Validation finished; from here the user's confirmed restoration begins.
    // Files are replaced instead of duplicated on repeated imports.
    const previousFiles = await listPortfolioFiles(eventId);
    await savePortfolio(portfolio);
    for (const old of previousFiles) await deletePortfolioFile(old.id);
    for (const file of incomingFiles) await addPortfolioFile(eventId, file);
    return {
        portfolio,
        checklist: Array.isArray(data.checklist) ? data.checklist : null,
        milestones: Array.isArray(data.milestones) ? data.milestones : null,
    };
}
