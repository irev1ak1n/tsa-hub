import { Capacitor } from '@capacitor/core';

// True only inside the Capacitor iOS/Android shell, never in a browser.
export function isNativeApp() {
    try { return Capacitor.isNativePlatform(); } catch { return false; }
}

const WEB_HOSTS = new Set(['tsa-hub.vercel.app']);

// Absolute https URLs that point somewhere other than the app itself.
export function isExternalUrl(href) {
    let url;
    try { url = new URL(href, window.location.href); } catch { return false; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (WEB_HOSTS.has(url.hostname)) return false;
    return url.origin !== window.location.origin;
}

// Deep links (universal links or the app's own scheme) -> an in-app route.
export function routeFromAppUrl(href) {
    try {
        const url = new URL(href);
        return `${url.pathname}${url.search}${url.hash}` || '/';
    } catch { return null; }
}
