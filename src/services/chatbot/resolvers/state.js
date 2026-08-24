import { STATE_TSA, STATE_DIRECTORY_URL } from '../../../data/stateTsa.js';

function getState(name) {
    if (!name) return null;
    return STATE_TSA[name] || null;
}

function advisorLink(entry) {
    if (!entry?.links) return null;
    return entry.links.find((l) => l.role === 'advisor') || null;
}

function websiteLink(entry) {
    if (!entry?.links) return null;
    return entry.links.find((l) => l.icon === 'globe') || null;
}

function socialLinks(entry) {
    if (!entry?.links) return [];
    return entry.links.filter((l) => l.img || (l.title && /instagram|facebook|twitter/i.test(l.title)));
}

function officerLink(entry) {
    if (!entry?.links) return null;
    return entry.links.find((l) => l.role === 'officer-team') || null;
}

export function answerState(intent, { stateName = null } = {}) {
    if (!stateName) {
        return {
            text: 'Which state are you asking about? Set your state in Settings, or tell me the state name.',
            sourceType: 'official',
            needState: true,
        };
    }

    const entry = getState(stateName);
    if (!entry) {
        return {
            text: `I don't have ${stateName} TSA data on file yet. You can check the official state directory at tsaweb.org/about/state-delegations.`,
            sourceType: 'official',
            missing: true,
        };
    }

    switch (intent) {
        case 'state.advisor': {
            const adv = advisorLink(entry);
            if (!adv?.contact) return { text: `I don't have state advisor info for ${stateName} on file.`, sourceType: 'official', missing: true };
            const c = adv.contact;
            const parts = [`The state advisor for ${stateName} TSA is ${c.name}.`];
            if (c.email) parts.push(`Email: ${c.email}.`);
            if (c.phone) parts.push(`Phone: ${c.phone}.`);
            return { text: parts.join(' '), sourceType: 'official' };
        }

        case 'state.website': {
            const site = websiteLink(entry);
            if (!site) return { text: `I don't have a website on file for ${stateName} TSA.`, sourceType: 'official', missing: true };
            return { text: `The official ${stateName} TSA website is ${site.url}`, sourceType: 'official' };
        }

        case 'state.social': {
            const links = socialLinks(entry);
            if (!links.length) return { text: `I don't have social media links for ${stateName} TSA.`, sourceType: 'official', missing: true };
            const list = links.map((l) => {
                const platform = /instagram/i.test(l.title) ? 'Instagram' : /facebook/i.test(l.title) ? 'Facebook' : 'Social';
                return `${platform}: ${l.url}`;
            }).join('. ');
            return { text: `${stateName} TSA social media: ${list}.`, sourceType: 'official' };
        }

        case 'state.officers': {
            const off = officerLink(entry);
            if (!off) return { text: `I don't have a state officer team link for ${stateName} TSA.`, sourceType: 'official', missing: true };
            return { text: `You can find the ${stateName} TSA state officer team at ${off.url}`, sourceType: 'official' };
        }

        case 'state.general':
        default: {
            const parts = [`${entry.name}.`];
            const site = websiteLink(entry);
            if (site) parts.push(`Website: ${site.url}.`);
            const adv = advisorLink(entry);
            if (adv?.contact) parts.push(`State advisor: ${adv.contact.name}.`);
            const off = officerLink(entry);
            if (off) parts.push(`Officer team: ${off.url}.`);
            return { text: parts.join(' '), sourceType: 'official' };
        }
    }
}
