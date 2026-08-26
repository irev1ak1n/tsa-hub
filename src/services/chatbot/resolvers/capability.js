// Capability-limit responses: the Coach understood exactly what was asked
// ("can you text them") — it just can't perform outbound actions itself.
// This is NOT a misunderstanding. Every response here says (1) what the
// Coach can't do, (2) what it can do instead, (3) offers the closest real
// action — never a bare "I'm not sure what you mean."

import { pick } from '../core/variation.js';
import { NATIONAL_TSA, TSA_HUB_SUPPORT_EMAIL } from '../../../data/contacts.js';

const ACTION_WORDS = {
    text: 'send text messages',
    sms: 'send text messages',
    call: 'make phone calls',
    phone: 'make phone calls',
    dm: 'send direct messages on Instagram or Facebook',
    message: 'send messages on your behalf',
    email: 'send emails on your behalf',
};

function detectAction(text) {
    const t = text.toLowerCase();
    if (/\btext|\bsms\b/.test(t)) return 'text';
    if (/\bcall|\bphone\b/.test(t)) return 'call';
    if (/\bdm\b|direct message/.test(t)) return 'dm';
    if (/\bemail\b/.test(t)) return 'email';
    if (/\bmessage\b/.test(t)) return 'message';
    return 'message';
}

// Loose signal for whether the target is National TSA specifically (so the
// Coach can hand over real, usable info) vs an ambiguous "them" (state
// advisor, a chapter, etc.) where it can only offer the two support paths.
function targetsNationalTsa(text) {
    return /\bnational tsa\b|\bgeneral tsa\b|\btsaweb\b/i.test(text);
}

export function answerCapabilityLimit(rawText) {
    const action = detectAction(rawText);
    const cant = ACTION_WORDS[action] || 'do that automatically';

    const cantDo = pick([
        `I'm not able to ${cant}.`,
        `I can't ${cant} myself.`,
        `That's not something I can do directly — I can't ${cant}.`,
    ], rawText);

    if (action === 'text') {
        // Don't invent SMS support at a number that's only ever published as
        // a voice line.
        const body = `${cantDo} National TSA's number (${NATIONAL_TSA.phone}) is listed as a phone contact, not a text line, so I can't confirm they accept texts there either. I can give you their phone number or email, or help you send a message to TSA Hub support.`;
        return { text: body, suggestions: ['Contact TSA Hub Support', 'National TSA Contact'] };
    }

    if (action === 'call') {
        const body = `${cantDo} National TSA's official phone number is ${NATIONAL_TSA.phone} (toll free: ${NATIONAL_TSA.tollFree}) if you'd like to call them yourself.`;
        return { text: body, suggestions: ['Contact TSA Hub Support', 'National TSA Contact'] };
    }

    if (action === 'dm') {
        const body = `${cantDo} I can help you find the verified official account instead — try asking me for your state's Instagram or Facebook.`;
        return { text: body, suggestions: ['Contact TSA Hub Support', 'National TSA Contact'] };
    }

    // email / generic message
    if (targetsNationalTsa(rawText)) {
        const body = `${cantDo} National TSA's official email is ${NATIONAL_TSA.email} — you can email them directly, or I can pull up their full contact card.`;
        return { text: body, suggestions: ['National TSA Contact', 'Contact TSA Hub Support'] };
    }

    const body = `${cantDo} I can help you contact TSA Hub support (about TSA Hub itself) or give you National TSA's real contact info, whichever you mean.`;
    return { text: body, suggestions: ['Contact TSA Hub Support', 'National TSA Contact'] };
}

// Plain factual "what is National TSA's email/phone" — a real, sourced
// answer, not a capability limit.
export function answerNationalContactInfo() {
    return {
        text: `${NATIONAL_TSA.org} — Email: ${NATIONAL_TSA.email} · Phone: ${NATIONAL_TSA.phone} · Toll free: ${NATIONAL_TSA.tollFree}.`,
        suggestions: ['Email National TSA', 'Contact TSA Hub Support'],
        // A ready-to-send draft the UI can offer as a real link — opening it
        // is the user's own action, never something the Coach claims to have
        // done itself.
        mailto: `mailto:${NATIONAL_TSA.email}`,
    };
}

export { TSA_HUB_SUPPORT_EMAIL };
