// Text normalization. Generic language only, event names live in entities.

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'do', 'does',
    'did', 'of', 'for', 'to', 'in', 'on', 'at', 'by', 'with', 'and', 'or',
    'my', 'me', 'i', 'you', 'your', 'it', 'this', 'that', 'these', 'those',
    'could', 'would', 'should', 'will', 'please', 'tell', 'know', 'there',
    'here', 'get', 'got', 'if', 'so', 'any', 'some', 'lot', 'just', 'really',
]);

// Contractions expanded before tokenizing so "what's" becomes "what is".
const CONTRACTIONS = {
    "what's": 'what is', "whats": 'what is', "it's": 'it is', "i'm": 'i am',
    "don't": 'do not', "doesn't": 'does not', "can't": 'can not', "won't": 'will not',
    "isn't": 'is not', "aren't": 'are not', "you're": 'you are', "there's": 'there is',
    "i've": 'i have', "i'd": 'i would', "let's": 'let us', "that's": 'that is',
    "how's": 'how is', "who's": 'who is',
};

// Generic wording to a canonical token. Never contains event names.
const SYNONYMS = {
    members: 'team', member: 'team', teammates: 'team', teammate: 'team',
    people: 'team', person: 'team', partners: 'team', partner: 'team',
    group: 'team', groups: 'team', players: 'team',
    solo: 'individual', alone: 'individual', myself: 'individual',
    individually: 'individual', single: 'individual', yourself: 'individual',
    price: 'cost', costs: 'cost', expensive: 'cost', cheap: 'cost', money: 'cost',
    budget: 'cost', fee: 'cost', fees: 'cost', pay: 'cost', dollars: 'cost', pricey: 'cost',
    difficult: 'difficulty', tough: 'difficulty', challenging: 'difficulty',
    beginner: 'difficulty', hardness: 'difficulty', competitive: 'difficulty',
    hours: 'time', duration: 'time', commitment: 'time', workload: 'time',
    due: 'deadline', deadlines: 'deadline', submit: 'submission',
    submission: 'submission', submissions: 'submission', upload: 'submission',
    preconference: 'preconference', advisor: 'advisor', approval: 'advisor',
    approve: 'advisor', overview: 'overview', describe: 'overview',
    description: 'overview', summary: 'overview', explain: 'explain',
    career: 'career', careers: 'career', job: 'career', jobs: 'career',
    major: 'career', majors: 'career', profession: 'career',
    category: 'category', division: 'division', middle: 'ms', high: 'hs',
    eligible: 'eligibility', eligibility: 'eligibility', qualify: 'eligibility',
    requirements: 'requirement', requirement: 'requirement', require: 'requirement',
    rules: 'rule', rule: 'rule', regulation: 'rule', regulations: 'rule',
    theme: 'theme', prompt: 'theme',
    shuttles: 'shuttle', conference: 'conference', conferences: 'conference', nationals: 'nationals',
    regionals: 'regionals', competition: 'competition', competitions: 'competition',
    events: 'event', event: 'event', compete: 'compete', competing: 'compete',
    compare: 'compare', versus: 'compare', vs: 'compare', difference: 'compare',
    differences: 'compare', better: 'compare',
    materials: 'material', material: 'material', supplies: 'material',
};

export function expandContractions(text) {
    let out = (text || '').toLowerCase();
    for (const [k, v] of Object.entries(CONTRACTIONS)) {
        out = out.split(k).join(v);
    }
    return out;
}

export function tokenize(text) {
    return expandContractions(text)
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

// Full normalization. `raw` keeps every word, `tokens` is the canonical set.
export function normalize(text) {
    const raw = tokenize(text);
    const tokens = [];
    for (const w of raw) {
        if (STOP_WORDS.has(w)) continue;
        tokens.push(SYNONYMS[w] || w);
    }
    return {
        original: (text || '').trim(),
        raw,
        rawJoined: raw.join(' '),
        tokens,
        joined: tokens.join(' '),
    };
}

export function hasAny(tokens, words) {
    return words.some((w) => tokens.includes(w));
}

// Levenshtein distance, capped for speed. Used for careful fuzzy matching only.
export function editDistance(a, b, max = 3) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
        let last = prev[0];
        prev[0] = i;
        let rowMin = prev[0];
        for (let j = 1; j <= b.length; j++) {
            const tmp = prev[j];
            prev[j] = Math.min(
                prev[j] + 1,
                prev[j - 1] + 1,
                last + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
            last = tmp;
            if (prev[j] < rowMin) rowMin = prev[j];
        }
        if (rowMin > max) return max + 1;
    }
    return prev[b.length];
}
