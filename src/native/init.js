import { isNativeApp, isExternalUrl, routeFromAppUrl } from './platform.js';
import { refreshNativePermission } from '../services/notificationService.js';

// Native shell setup. Imported once from main.jsx; a no-op in the browser, so
// the web build never loads the Capacitor plugins.
export async function initNative() {
    if (!isNativeApp()) return;

    const root = document.documentElement;
    root.classList.add('native-app');

    const [{ App }, { Browser }, { StatusBar, Style }, { SplashScreen }, { Keyboard }] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/browser'),
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
        import('@capacitor/keyboard'),
    ]);

    // Status bar text follows the in-app theme: light text on dark, dark on light.
    const syncStatusBar = () => {
        const light = root.getAttribute('data-theme') === 'light';
        StatusBar.setStyle({ style: light ? Style.Light : Style.Dark }).catch(() => {});
    };
    syncStatusBar();
    new MutationObserver(syncStatusBar).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    // Links to other sites open in the in-app Safari sheet instead of replacing the app.
    document.addEventListener('click', (e) => {
        const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
        if (!a || e.defaultPrevented) return;
        const href = a.getAttribute('href');
        if (!href || !isExternalUrl(href)) return;
        e.preventDefault();
        Browser.open({ url: new URL(href, window.location.href).toString() }).catch(() => {});
    }, true);

    // Keep the focused field visible above the keyboard.
    Keyboard.addListener('keyboardDidShow', () => {
        const el = document.activeElement;
        if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    });

    // Universal links / custom-scheme opens navigate inside the router.
    App.addListener('appUrlOpen', ({ url }) => {
        const route = routeFromAppUrl(url);
        if (!route) return;
        window.history.pushState({}, '', route);
        window.dispatchEvent(new PopStateEvent('popstate'));
    });

    refreshNativePermission();

    // Hide the splash once the first frame has painted.
    requestAnimationFrame(() => {
        SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
    });
}
