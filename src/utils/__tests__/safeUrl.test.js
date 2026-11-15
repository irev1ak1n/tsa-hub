import { describe, it, expect } from 'vitest';
import { safeHttpUrl, isSafeSvgFragment } from '../safeUrl.js';
import { buildResourceIndex } from '../../screens/resources/resourceSearch.jsx';

describe('safeHttpUrl', () => {
    it('accepts plain http and https links', () => {
        expect(safeHttpUrl('https://tsaweb.org/events')).toBe('https://tsaweb.org/events');
        expect(safeHttpUrl('  http://example.com ')).toBe('http://example.com/');
    });

    it.each([
        'javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>alert(1)</script>',
        'vbscript:x', 'file:///etc/passwd', 'blob:https://x/y', 'ftp://x.test/', '//evil.example', '/relative', 'mailto:a@b.co',
        'https://user:pass@evil.example/', '', null, undefined, 42, {}, ['https://a.test'], 'https://' + 'a'.repeat(3000) + '.test',
    ])('rejects %j', (value) => {
        expect(safeHttpUrl(value)).toBeNull();
    });
});

describe('isSafeSvgFragment', () => {
    it('accepts the icons the app really uses', () => {
        const items = buildResourceIndex(null).filter((i) => i.svg);
        expect(items.length).toBeGreaterThan(0);
        for (const item of items) expect(isSafeSvgFragment(item.svg), item.title).toBe(true);
    });

    it.each([
        '<script>alert(1)</script>',
        '<path d="M0 0" onload="alert(1)"/>',
        '<path d="M0 0"/><script>alert(1)</script>',
        '<svg onload="alert(1)"></svg>',
        '<path d="M0 0" href="javascript:alert(1)"/>',
        '<image href="x" onerror="alert(1)"/>',
        '<a xlink:href="javascript:alert(1)"><path d="M0 0"/></a>',
        '<foreignObject><div/></foreignObject>',
        '<path d="M0 0" style="fill:url(javascript:x)"/>',
        '<path d=\'M0 0\' />',
        '<path d="M0 0"/>trailing',
        '<path d="a<b"/>',
        '',
        null,
        '<path d="' + 'M0 0 '.repeat(2000) + '"/>',
    ])('rejects %j', (fragment) => {
        expect(isSafeSvgFragment(fragment)).toBe(false);
    });

    it('stays fast on adversarial input', () => {
        const start = performance.now();
        isSafeSvgFragment('<path ' + 'a="b" '.repeat(600) + '!');
        isSafeSvgFragment('<path d="x"/>'.repeat(300) + '<');
        expect(performance.now() - start).toBeLessThan(200);
    });
});
