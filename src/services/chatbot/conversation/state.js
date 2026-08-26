// Conversation memory. Plain object, in memory only, no external store.

export function createState() {
    return {
        activeDomain: null,
        activeEvent: null,      // event object
        activeEvents: [],       // for comparisons
        activeDivision: null,
        activeState: null,
        lastIntent: null,
        lastResolvedIntent: null,
        lastAnswerType: null,
        pendingClarification: null, // { need, intent, candidates }
        answerStyle: 'normal',      // short | normal | detailed
        turn: 0,
        misunderstandingCount: 0,   // consecutive genuine misunderstandings — see engine.js trackMisunderstanding
        lastUserText: null,         // previous turn's raw text — seeds a support-flow draft from context
        supportFlow: null,          // { step: 'category'|'message'|'confirm', category, message, context } while drafting a TSA Hub support message
    };
}

// Merge a patch without losing untouched fields.
export function update(state, patch) {
    return { ...state, ...patch };
}

export function clearClarification(state) {
    return { ...state, pendingClarification: null };
}

export function resetState(state) {
    const fresh = createState();
    fresh.activeDivision = state?.activeDivision || null;
    fresh.activeState = state?.activeState || null;
    return fresh;
}
