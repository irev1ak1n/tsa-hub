import { describe, it, expect } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

// The test runner has no JSX plugin, so the pages use the classic runtime.
globalThis.React = React;
const { default: PrivacyPolicy } = await import('../PrivacyPolicy.jsx');
const { default: Terms } = await import('../Terms.jsx');

// The policies must match what the app really does and must be written in plain
// sentences. Colons, semicolons, en dashes and em dashes are deliberately not
// used in the wording.

function visibleText(Component) {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Component)));
    return html
        .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

const docs = { 'Privacy Policy': visibleText(PrivacyPolicy), 'Terms and Policies': visibleText(Terms) };

describe.each(Object.entries(docs))('%s', (_name, text) => {
    it('uses no colons, semicolons, en dashes or em dashes', () => {
        expect(text).not.toMatch(/[:;–—]/);
    });

    it('has a current last-updated date', () => {
        expect(text).toContain('Last updated November 2026');
    });

    it('keeps the independent-project disclaimer and a contact address', () => {
        expect(text).toMatch(/not affiliated with(,| or)/);
        expect(text).toContain('Technology Student Association');
        expect(text).toContain('tsastudentshub@gmail.com');
    });

    it('does not mention discontinued features', () => {
        expect(text).not.toMatch(/get involved|project management|workspace|smart search|generated answer|artificial intelligence|\bAI\b/i);
    });
});

describe('Privacy Policy content', () => {
    const text = docs['Privacy Policy'];

    it('states there are no accounts and explains device storage', () => {
        expect(text).toMatch(/no sign-up or login/);
        expect(text).toMatch(/What stays on your device/);
    });

    it('names the service providers and describes anonymous feedback and reports', () => {
        for (const provider of ['Supabase', 'Vercel', 'Resend']) expect(text).toContain(provider);
        expect(text).toMatch(/hashed/);
        expect(text).toMatch(/Anonymous feedback and reports/);
        expect(text).toMatch(/no name, email, phone, or other\s+contact fields/);
        expect(text).not.toMatch(/Contact Support form|support form/i);
    });

    it('covers under-13 users and access or deletion requests', () => {
        expect(text).toMatch(/under 13/);
        expect(text).toMatch(/Access and deletion requests/);
    });

    it('does not claim that no personal information is collected', () => {
        expect(text).not.toMatch(/collect no (personal )?information/i);
    });
});
