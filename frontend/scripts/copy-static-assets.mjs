import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const publicDir = path.resolve(__dirname, '../public');

const levelsSrc = path.join(repoRoot, 'data', 'levels.json');
const audioSrcDir = path.join(repoRoot, 'assets', 'audio');
const levelsDest = path.join(publicDir, 'data', 'levels.json');
const audioDestDir = path.join(publicDir, 'assets', 'audio');

if (!fs.existsSync(levelsSrc)) {
  console.error(`Missing ${levelsSrc}. Run from repo with data/levels.json present.`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(levelsDest), { recursive: true });
fs.mkdirSync(audioDestDir, { recursive: true });

fs.copyFileSync(levelsSrc, levelsDest);

let copied = 0;
for (const file of fs.readdirSync(audioSrcDir)) {
  if (!file.endsWith('.mp3')) continue;
  fs.copyFileSync(path.join(audioSrcDir, file), path.join(audioDestDir, file));
  copied += 1;
}

console.log(`Copied levels.json and ${copied} audio file(s) to frontend/public/`);
