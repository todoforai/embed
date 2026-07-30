// Bundles src -> dist/embed.js (single IIFE, the file sites embed).
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [path.join(root, '../src/index.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  outfile: path.join(root, '../dist/embed.js'),
  banner: { js: '/* TODO for AI embed — https://todofor.ai — MIT */' },
});
console.log('✓ dist/embed.js');
