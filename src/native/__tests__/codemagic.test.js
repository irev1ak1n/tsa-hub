import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { parse } from 'yaml';

// Static checks for the Codemagic cloud-build setup. They cannot prove the
// cloud build passes (that needs a macOS run), but they catch drift between
// codemagic.yaml, the Capacitor config and the Xcode project.

const read = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8');
const config = parse(read('codemagic.yaml'), { merge: true });
const capacitor = JSON.parse(read('capacitor.config.json'));
const pbxproj = read('ios/App/App.xcodeproj/project.pbxproj');
const scriptText = (wf) => (wf.scripts || []).map((s) => (typeof s === 'string' ? s : s.script)).join('\n');

describe('codemagic.yaml', () => {
    it('defines the compile-check and TestFlight workflows', () => {
        expect(Object.keys(config.workflows).sort()).toEqual(['ios-compile-check', 'ios-testflight']);
        for (const wf of Object.values(config.workflows)) {
            expect(wf.instance_type).toMatch(/^mac_mini/);
            expect(wf.max_build_duration).toBeGreaterThan(0);
        }
    });

    it('never builds automatically', () => {
        for (const wf of Object.values(config.workflows)) expect(wf.triggering).toBeUndefined();
    });

    it('pins a Node version that Vite 7 supports', () => {
        const [major, minor] = config.workflows['ios-testflight'].environment.node.split('.').map(Number);
        expect(major > 22 || (major === 22 && minor >= 12) || (major === 20 && minor >= 19)).toBe(true);
    });

    it('uses the same bundle id in Capacitor, Xcode and signing', () => {
        const signing = config.workflows['ios-testflight'].environment.ios_signing;
        expect(signing.bundle_identifier).toBe(capacitor.appId);
        expect(pbxproj).toContain(`PRODUCT_BUNDLE_IDENTIFIER = ${capacitor.appId};`);
        expect(signing.distribution_type).toBe('app_store');
    });

    it('signs only through the App Store Connect integration and never submits for review', () => {
        const wf = config.workflows['ios-testflight'];
        expect(wf.integrations.app_store_connect).toBeTruthy();
        expect(wf.publishing.app_store_connect.auth).toBe('integration');
        expect(wf.publishing.app_store_connect.submit_to_testflight).toBe(true);
        expect(wf.publishing.app_store_connect.submit_to_app_store).toBe(false);
        expect(config.workflows['ios-compile-check'].integrations).toBeUndefined();
        expect(config.workflows['ios-compile-check'].publishing).toBeUndefined();
    });

    it('references files that exist', () => {
        const env = config.workflows['ios-compile-check'].environment.vars;
        expect(existsSync(new URL(`../../../${env.XCODE_WORKSPACE}`, import.meta.url))).toBe(true);
        expect(existsSync(new URL('../../../scripts/buildNative.mjs', import.meta.url))).toBe(true);
        expect(existsSync(new URL('../../../ios/App/Podfile', import.meta.url))).toBe(true);
    });

    it('ships a shared Xcode scheme that points at the app target', () => {
        const scheme = read('ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme');
        const id = scheme.match(/BlueprintIdentifier = "([0-9A-F]+)"/)[1];
        expect(pbxproj).toContain(`${id} /* App */ = {`);
        expect(config.workflows['ios-compile-check'].environment.vars.XCODE_SCHEME).toBe('App');
    });

    it('requires the Supabase variables before building', () => {
        for (const wf of Object.values(config.workflows)) {
            expect(wf.environment.groups).toContain('tsa_hub_web_env');
            expect(scriptText(wf)).toContain('VITE_SUPABASE_URL');
            expect(scriptText(wf)).toContain('VITE_SUPABASE_ANON_KEY');
        }
    });

    it('runs the compile check without signing', () => {
        const text = scriptText(config.workflows['ios-compile-check']);
        expect(text).toContain('CODE_SIGNING_ALLOWED=NO');
        expect(text).not.toMatch(/use-profiles|build-ipa/);
    });

    it('archives and applies profiles in the TestFlight workflow', () => {
        const text = scriptText(config.workflows['ios-testflight']);
        expect(text).toContain('xcode-project use-profiles');
        expect(text).toContain('xcode-project build-ipa');
        expect(text).toContain('CURRENT_PROJECT_VERSION');
    });
});

describe('secrets stay out of git', () => {
    const text = read('codemagic.yaml');

    it('has no key material or credentials in codemagic.yaml', () => {
        expect(text).not.toMatch(/BEGIN [A-Z ]*PRIVATE KEY/);
        expect(text).not.toMatch(/AuthKey_[A-Z0-9]+\.p8/);
        expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{30,}/);
        expect(text).not.toMatch(/[A-Za-z0-9+/]{80,}={0,2}/);
    });

    it('git-ignores signing files', () => {
        const ignore = read('.gitignore');
        for (const pattern of ['*.p12', '*.p8', '*.cer', '*.mobileprovision', '*.certSigningRequest', '.env']) {
            expect(ignore).toContain(pattern);
        }
    });

    it('tracks no signing material', () => {
        let tracked = '';
        try { tracked = execSync('git ls-files', { encoding: 'utf8', cwd: new URL('../../../', import.meta.url) }); } catch { return; }
        expect(tracked).not.toMatch(/\.(p12|p8|cer|pem|mobileprovision|provisionprofile|certSigningRequest)$/m);
        expect(tracked).not.toMatch(/^\.env$|^\.env\.(?!example)/m);
    });
});
