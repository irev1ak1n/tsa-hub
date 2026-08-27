// Contextual follow up questions. These are plain strings that go back through
// the same pipeline when tapped, so buttons and typing behave identically.

const BY_INTENT = {
    'team.general': ['Can I compete alone?', 'How difficult is it?', 'How much time does it take?'],
    'team.individual': ['How big is the team?', 'What do I need to submit?', 'How difficult is it?'],
    'team.minimum': ['What is the maximum team size?', 'Can I compete alone?'],
    'team.maximum': ['What is the minimum team size?', 'Can I compete alone?'],
    'cost.general': ['What materials do I need?', 'How much time does it take?', 'Can I compete alone?'],
    'cost.isExpensive': ['How much time does it take?', 'How difficult is it?'],
    'time.general': ['How difficult is it?', 'How much does it cost?', 'What do I need to submit?'],
    'difficulty.general': ['How much time does it take?', 'Can I compete alone?', 'What careers connect to this?'],
    'overview.general': ['What do I need to submit?', 'Can I compete alone?', 'What careers connect to this?'],
    'career.general': ['What does this event involve?', 'How difficult is it?'],
    'preconference.general': ['Does it need state advisor approval?', 'How difficult is it?'],
    'advisor.general': ['What do I need to submit?', 'What is the team size?'],
    'eligibility.general': ['Can I compete alone?', 'What do I need to submit?'],
    'theme.general': ['What does this event involve?', 'What do I need to submit?'],
    'category.general': ['What does this event involve?', 'What careers connect to this?'],
    'compare.general': ['Which one takes more time?', 'Which one is harder?', 'Which one can I do alone?'],
    'compare.difficulty': ['Which one takes more time?', 'Which costs less?'],
    'compare.time': ['Which one is harder?', 'Which costs less?'],
    'compare.cost': ['Which one takes more time?', 'Which one is harder?'],
    'material.general': ['What do I need to bring to competition?', 'What do I need to submit?', 'Show me the official rules'],
    'clarify.needAmbiguous': ['What do I need to bring?', 'What do I need to submit?', 'What do I need to build?'],
    'clarify.recommend': ['I like coding', 'I want a team event', "I don't like presenting"],
};

const DEFAULTS = ['What events involve coding?', 'How do I pick an event?', 'What can you help me with?'];

// Follow-ups should point the user somewhere NEW, not back at the exact
// question they just asked (tapping the chip would just repeat the same
// answer). `justAsked` is the raw text of the current turn.
export function followupsFor(intent, { event = null, justAsked = '' } = {}) {
    const base = BY_INTENT[intent] || DEFAULTS;
    const asked = justAsked.trim().toLowerCase().replace(/[?.!]+$/, '');
    const filtered = asked ? base.filter((q) => q.trim().toLowerCase().replace(/[?.!]+$/, '') !== asked) : base;
    // Keep them short and never more than three.
    return filtered.slice(0, 3);
}
