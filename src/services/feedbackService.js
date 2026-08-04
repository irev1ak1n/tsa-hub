// ============================================================
// TSA HUB — feedback submission.
// Writes a single row to the `feedback` table. Anonymous insert
// is allowed by an RLS policy; the anon role has INSERT only (no
// SELECT). We therefore tell Supabase NOT to return the inserted
// row (returning: 'minimal'), otherwise PostgREST tries to SELECT
// it back and the missing SELECT grant causes a 403 / 42501.
// ============================================================

import { supabase } from './supabase.js';

export async function submitFeedback(message) {
    const text = String(message || '').trim();
    if (!text) return { ok: false, error: 'empty' };

    const { error } = await supabase
        .from('feedback')
        .insert({ message: text }, { returning: 'minimal' });

    if (error) return { ok: false, error: error.message || 'failed' };
    return { ok: true };
}