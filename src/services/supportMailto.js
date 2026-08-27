// Builds a mailto: link for TSA Hub Support messages (Contact Support and
// Report Incorrect Information both funnel through this). Nothing is ever
// sent by TSA Hub itself — this only prepares the user's own email client;
// the message is only actually sent once the user hits send there.
import { TSA_HUB_SUPPORT_EMAIL } from '../data/contacts.js';

export function buildSupportMailto({ subject, lines }) {
    const body = lines.filter(Boolean).join('\n');
    return `mailto:${TSA_HUB_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
