export function todayLocal() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export function daysFromToday(date) {
    return Math.round((new Date(date + 'T12:00:00').getTime() - new Date(todayLocal() + 'T12:00:00').getTime()) / 86400000);
}

export function fmtDate(date) {
    if (!date) return 'No date set';
    return new Date(date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtRange(start, end) {
    if (!end || end === start) return fmtDate(start);
    const a = new Date(start + 'T12:00:00');
    const b = new Date(end + 'T12:00:00');
    const sameYear = a.getFullYear() === b.getFullYear();
    const first = a.toLocaleDateString(undefined, sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
    return first + ' – ' + fmtDate(end);
}

// A student's own milestone: can be overdue.
export function milestoneStatus(date, done) {
    if (done) return { label: 'Complete', tone: 'done' };
    if (!date) return { label: 'Set a date', tone: 'undated' };
    const days = daysFromToday(date);
    if (days < 0) return { label: Math.abs(days) + 'd overdue', tone: 'overdue' };
    if (days === 0) return { label: 'Due today', tone: 'soon' };
    if (days === 1) return { label: 'Tomorrow', tone: 'soon' };
    return { label: days + ' days left', tone: days <= 7 ? 'soon' : 'upcoming' };
}

// An official TSA date: informational, never "overdue".
export function officialStatus(start, end) {
    const last = end || start;
    if (daysFromToday(last) < 0) return { label: 'Passed', tone: 'past' };
    const days = daysFromToday(start);
    if (days <= 0) return { label: 'Happening now', tone: 'soon' };
    if (days === 1) return { label: 'Tomorrow', tone: 'soon' };
    return { label: days + ' days away', tone: days <= 14 ? 'soon' : 'upcoming' };
}

export function safeUrl(value) {
    try {
        const url = new URL(String(value).trim());
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch { return null; }
}

export function fmtBytes(bytes) {
    return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function Field({ label, value, onChange, placeholder, multiline, ...props }) {
    return (
        <label className="ew-field">
            <span className="ew-label">{label}</span>
            {multiline ? (
                <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} {...props} />
            ) : (
                <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} {...props} />
            )}
        </label>
    );
}
