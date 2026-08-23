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
