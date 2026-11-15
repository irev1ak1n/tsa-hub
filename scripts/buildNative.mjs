// Production build for the native app: bundles the site with an absolute API
// origin (a relative /api path would resolve inside the app), then copies it
// into the iOS project. Pass --no-sync to skip `cap sync`.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { buildNativeCsp, injectCsp } from './nativeCsp.mjs';

const api = process.env.VITE_API_BASE_URL || 'https://tsa-hub.vercel.app';
const env = { ...process.env, VITE_API_BASE_URL: api };
const run = (cmd, args) => {
    const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
    if (r.status !== 0) process.exit(r.status ?? 1);
};

console.log(`Building for native with API ${api}`);
run('npx', ['vite', 'build']);

// Optional, off by default: adds a Content Security Policy to the app's index.html.
// Turn it on for a TestFlight build first (NATIVE_CSP=1); see docs/IOS_BUILD.md.
if (process.env.NATIVE_CSP === '1') {
    const file = 'dist/index.html';
    writeFileSync(file, injectCsp(readFileSync(file, 'utf8'), buildNativeCsp({ apiOrigin: api })));
    console.log('Native CSP added to dist/index.html');
}
if (!process.argv.includes('--no-sync')) run('npx', ['cap', 'sync', 'ios']);
