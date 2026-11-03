// Production build for the native app: bundles the site with an absolute API
// origin (a relative /api path would resolve inside the app), then copies it
// into the iOS project. Pass --no-sync to skip `cap sync`.
import { spawnSync } from 'node:child_process';

const api = process.env.VITE_API_BASE_URL || 'https://tsa-hub.vercel.app';
const env = { ...process.env, VITE_API_BASE_URL: api };
const run = (cmd, args) => {
    const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
    if (r.status !== 0) process.exit(r.status ?? 1);
};

console.log(`Building for native with API ${api}`);
run('npx', ['vite', 'build']);
if (!process.argv.includes('--no-sync')) run('npx', ['cap', 'sync', 'ios']);
