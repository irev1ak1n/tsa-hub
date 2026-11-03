import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isExternalUrl, routeFromAppUrl, isNativeApp } from '../platform.js';

beforeEach(() => {
    vi.stubGlobal('window', { location: { href: 'capacitor://localhost/events', origin: 'capacitor://localhost' } });
});

describe('isExternalUrl', () => {
    it('treats other sites as external', () => {
        expect(isExternalUrl('https://www.tsaweb.org/')).toBe(true);
        expect(isExternalUrl('http://example.com/x')).toBe(true);
    });
    it('keeps in-app and own-site links internal', () => {
        expect(isExternalUrl('/resources')).toBe(false);
        expect(isExternalUrl('capacitor://localhost/help')).toBe(false);
        expect(isExternalUrl('https://tsa-hub.vercel.app/privacy')).toBe(false);
    });
    it('leaves mailto, tel and junk to the system', () => {
        expect(isExternalUrl('mailto:a@b.co')).toBe(false);
        expect(isExternalUrl('tel:+15551234567')).toBe(false);
        expect(isExternalUrl('javascript:alert(1)')).toBe(false);
    });
});

describe('routeFromAppUrl', () => {
    it('keeps path, query and hash', () => {
        expect(routeFromAppUrl('https://tsa-hub.vercel.app/resources/national-officers?x=1#top')).toBe('/resources/national-officers?x=1#top');
    });
    it('returns null for garbage', () => {
        expect(routeFromAppUrl('not a url')).toBeNull();
    });
});

describe('isNativeApp', () => {
    it('is false outside the native shell', () => {
        expect(isNativeApp()).toBe(false);
    });
});
