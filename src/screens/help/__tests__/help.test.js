import { describe, it, expect } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// The test runner has no JSX plugin, so the pages use the classic runtime.
globalThis.React = React;
const content = await import('../../../data/helpContent.js');
const { default: Help } = await import('../Help.jsx');
const { default: HelpArticle } = await import('../HelpArticle.jsx');
const { default: ReportModal } = await import('../../../components/ReportModal.jsx');

const { HELP_ARTICLES, QUICK_HELP, POPULAR_TOPICS, getHelpArticle, listedArticles, searchHelp } = content;

function render(element, path = '/help') {
    return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, element))
        .replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
}

describe('Help Center content', () => {
    it('has Report Incorrect Information and Send Feedback in Quick Help, and no Contact Support', () => {
        expect(QUICK_HELP.map((i) => i.title)).toEqual(['Report Incorrect Information', 'Send Feedback']);
        expect(QUICK_HELP.map((i) => i.modal)).toEqual(['report', 'feedback']);
        expect(JSON.stringify([HELP_ARTICLES, QUICK_HELP, POPULAR_TOPICS])).not.toMatch(/contact support|contacting-support/i);
    });

    it('lists the three popular topics, each opening a real article', () => {
        expect(POPULAR_TOPICS.map((i) => i.title)).toEqual(['Calendar and Reminders', 'Finding Event Rules', 'Browsing Official Resources']);
        for (const topic of POPULAR_TOPICS) expect(getHelpArticle(topic.article)).toBeTruthy();
    });

    it('drops the privacy article but keeps every other article reachable', () => {
        expect(getHelpArticle('privacy')).toBeNull();
        for (const id of ['finding-events', 'themes-and-problems', 'official-documents', 'using-resources', 'state-advisor',
            'using-calendar', 'personal-calendar-entries', 'reporting-incorrect-info',
            'finding-event-rules', 'browsing-official-resources']) {
            expect(getHelpArticle(id), id).toBeTruthy();
        }
    });

    it('gives every article a short one-line subtitle', () => {
        for (const a of HELP_ARTICLES) {
            expect(a.subtitle, a.id).toBeTruthy();
            expect(a.subtitle.length, a.id).toBeLessThanOrEqual(52);
            expect(a.subtitle, a.id).not.toMatch(/\n/);
        }
        for (const item of [...QUICK_HELP, ...POPULAR_TOPICS]) expect(item.subtitle.length, item.id).toBeLessThanOrEqual(52);
    });

    it('points the new articles at the real Events and Resources pages', () => {
        expect(getHelpArticle('finding-event-rules').action).toEqual({ label: 'Explore Events', to: '/events' });
        expect(getHelpArticle('browsing-official-resources').action).toEqual({ label: 'Open Resources', to: '/resources' });
        expect(getHelpArticle('using-calendar').action).toEqual({ label: 'Open Calendar', to: '/calendar' });
    });

    it('does not list an article twice on the Help Center page', () => {
        const featured = new Set(POPULAR_TOPICS.map((t) => t.article));
        const listed = listedArticles();
        expect(listed.some((a) => featured.has(a.id))).toBe(false);
        expect(new Set(listed.map((a) => a.id)).size).toBe(listed.length);
    });

    it('finds the new topics through search and no longer finds privacy as an article', () => {
        expect(searchHelp('rules').map((r) => r.title)).toContain('Finding Event Rules');
        expect(searchHelp('official resources').map((r) => r.title)).toContain('Browsing Official Resources');
        expect(searchHelp('transparency')).toEqual([]);
    });

    it('writes the calendar article without placeholder or development wording', () => {
        const text = JSON.stringify(getHelpArticle('using-calendar'));
        expect(text).not.toMatch(/currently|not an alarm|template|placeholder|\bTODO\b|future|coming soon|push notification/i);
        for (const view of ['Year', 'Month', 'Week', 'Schedule']) expect(text).toContain(view);
        expect(text).toMatch(/confirm important dates/i);
    });
});

describe('Help Center page', () => {
    const html = render(createElement(Help));

    it('shows Quick Help, Popular Topics and Help Articles on one page', () => {
        for (const label of ['Quick Help', 'Popular Topics', 'Help Articles']) expect(html).toContain(label);
        expect(html).not.toContain('More Resources');
    });

    it('shows the new rows and not the removed ones', () => {
        for (const title of ['Report Incorrect Information', 'Send Feedback', 'Calendar and Reminders', 'Finding Event Rules', 'Browsing Official Resources']) {
            expect(html).toContain(title);
        }
        for (const gone of ['Contact Support', 'Contact support', 'Find event rules', 'Browse official resources', 'Privacy &amp; transparency', 'Privacy and transparency']) {
            expect(html).not.toContain(gone);
        }
    });

    it('lists every remaining article with its short subtitle', () => {
        for (const a of listedArticles()) {
            expect(html).toContain(a.title);
            expect(html).toContain(a.subtitle);
        }
    });
});

describe('Help article pages', () => {
    function renderArticle(id) {
        return render(
            createElement(Routes, null, createElement(Route, { path: '/help/article/:id', element: createElement(HelpArticle) })),
            `/help/article/${id}`,
        );
    }

    it('renders Finding event rules with its Explore Events button', () => {
        const html = renderArticle('finding-event-rules');
        expect(html).toContain('Finding event rules');
        expect(html).toContain('Competition Rules and Preparation');
        expect(html).toContain('Explore Events');
    });

    it('renders Browsing official resources with its Open Resources button', () => {
        const html = renderArticle('browsing-official-resources');
        expect(html).toContain('Browsing official resources');
        expect(html).toContain('Open Resources');
    });

    it('renders the calendar article with its Open Calendar button', () => {
        const html = renderArticle('using-calendar');
        expect(html).toContain('Choose a view');
        expect(html).toContain('Open Calendar');
    });

    it('still renders articles that are no longer listed as a topic', () => {
        expect(renderArticle('reporting-incorrect-info')).toContain('Reporting incorrect information');
        expect(renderArticle('state-advisor')).toContain('Finding your state advisor');
    });
});

describe('Report Incorrect Information modal', () => {
    const html = render(createElement(ReportModal, { onClose: () => {} }), '/help');

    it('has no page or section field', () => {
        expect(html).not.toMatch(/Page\/section/i);
        expect(html).not.toContain('rep-page');
    });

    it('keeps the category dropdown and description field', () => {
        expect(html).toContain('Category');
        expect(html).toContain('rep-cat');
        expect(html).toContain('Description');
        expect(html).toContain('rep-desc');
    });
});

describe('Report modal collects no contact information', () => {
    const html = render(createElement(ReportModal, { onClose: () => {} }), '/help');
    it('has no name, email or phone fields', () => {
        expect(html).not.toMatch(/type="email"|type="tel"|name="(name|email|phone)"|your (name|email|phone)/i);
        expect((html.match(/<input/g) || []).length).toBe(0);
    });
});
