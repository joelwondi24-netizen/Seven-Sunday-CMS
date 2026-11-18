import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const rootDir = path.resolve(import.meta.dirname, '..');
const desktopDir = path.join(rootDir, 'desktop-win');
const rootDistDir = path.join(rootDir, 'dist');
const desktopDistDir = path.join(desktopDir, 'dist');
const serverBundleOut = path.join(desktopDir, 'server-bundle.mjs');

console.log('1/3 Building production React + PWA frontend...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

console.log('2/3 Bundling standalone Express + WebSocket ERP server...');
await build({
  entryPoints: [path.join(rootDir, 'server.ts')],
  outfile: serverBundleOut,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: ['vite', 'express', 'dotenv', 'ws'],
  banner: {
    js: 'import { createRequire as __ssCreateRequire } from "node:module"; const require = __ssCreateRequire(import.meta.url);',
  },
});

console.log('3/3 Copying built frontend assets into desktop-win/dist...');
fs.rmSync(desktopDistDir, { recursive: true, force: true });
fs.cpSync(rootDistDir, desktopDistDir, { recursive: true, force: true });

console.log('Desktop bundle prepared successfully at:', desktopDir);
