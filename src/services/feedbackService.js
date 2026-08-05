// ============================================================
// TSA HUB — feedback + incorrect-info reports.
// Both write a single row to the `feedback` table (differentiated
// by the `type` column: 'feedback' | 'report'). Anonymous insert
// is allowed by an RLS policy; the role has INSERT only (no SELECT),
// so we pass { returning: 'minimal' } to avoid a read-back that
// would need SELECT rights.
// ============================================================

import { supabase } from './supabase.js';

async function insertFeedback(message, type) {
    const text = String(message || '').trim();
    if (!text) return { ok: false, error: 'empty' };

    const { error } = await supabase
        .from('feedback')
        .insert({ message: text, type }, { returning: 'minimal' });

    if (error) return { ok: false, error: error.message || 'failed' };
    return { ok: true };
}

export function submitFeedback(message) {
    return insertFeedback(message, 'feedback');
}

export function submitReport(message) {
    return insertFeedback(message, 'report');
}