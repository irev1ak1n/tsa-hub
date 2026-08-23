import { CONFERENCE_2026_HEADER, CONFERENCE_2026 } from '../../../data/conference2026.js';

function lower(s) { return (s || '').toLowerCase(); }

// Find the best matching topic and section by keyword.
function searchConference(tokens) {
    let best = null;
    for (const [topicId, topic] of Object.entries(CONFERENCE_2026)) {
        for (const sec of (topic.sections || [])) {
            let score = 0;
            const heading = lower(sec.heading || '');
            const text = lower((sec.paragraphs || []).join(' ') + ' ' + (sec.lines || []).join(' '));
            for (const t of tokens) {
                if (heading.includes(t)) score += 4;
                if (text.includes(t)) score += 1;
            }
            if (score >= 3 && (!best || score > best.score)) {
                best = { topicId, topic, section: sec, score };
            }
        }
        // Also match topic title.
        const titleScore = tokens.filter((t) => lower(topic.title).includes(t)).length * 3;
        if (titleScore >= 3 && (!best || titleScore > best.score)) {
            best = { topicId, topic, section: topic.sections?.[0], score: titleScore };
        }
    }
    return best;
}

function sectionToText(sec) {
    const parts = [];
    if (sec.heading) parts.push(sec.heading + '.');
    if (sec.lines?.length) parts.push(sec.lines.join('. ') + '.');
    if (sec.paragraphs?.length) parts.push(sec.paragraphs.slice(0, 2).join(' '));
    if (sec.contacts?.length) {
        parts.push(sec.contacts.map((c) => `${c.label}: ${c.value}`).join(', ') + '.');
    }
    return parts.join(' ');
}

export function answerConference(intent, tokens) {
    switch (intent) {
        case 'conference.when':
            return {
                text: `The ${CONFERENCE_2026_HEADER.title} runs ${CONFERENCE_2026_HEADER.dateLabel} at ${CONFERENCE_2026_HEADER.venue}, ${CONFERENCE_2026_HEADER.location}. Theme: "${CONFERENCE_2026_HEADER.theme}".`,
                sourceType: 'official',
            };
        case 'conference.where':
            return {
                text: `${CONFERENCE_2026_HEADER.venue}, ${CONFERENCE_2026_HEADER.location}.`,
                sourceType: 'official',
            };
        case 'conference.theme':
            return {
                text: `The 2026 conference theme is "${CONFERENCE_2026_HEADER.theme}".`,
                sourceType: 'official',
            };
        case 'conference.search':
        default: {
            const hit = searchConference(tokens);
            if (!hit) return null;
            return {
                text: sectionToText(hit.section),
                sourceType: 'official',
                source: { title: hit.topic.title, section: hit.section?.heading },
            };
        }
    }
}
