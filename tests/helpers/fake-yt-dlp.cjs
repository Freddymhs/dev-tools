#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

const isSkipDownload = args.includes('--skip-download');
const printIdx = args.indexOf('--print');
const isPrintFilename = printIdx !== -1 && args[printIdx + 1] === 'filename';
const oIdx = args.indexOf('-o');
const template = oIdx !== -1 ? args[oIdx + 1] : null;

const fixtureVideo = process.env.FIXTURE_VIDEO;
if (!fixtureVideo) {
  process.stderr.write('fake-yt-dlp: FIXTURE_VIDEO env var not set\n');
  process.exit(1);
}

const ext = path.extname(fixtureVideo).slice(1);
const fixtureName = path.basename(fixtureVideo, path.extname(fixtureVideo));
const title = `test-video-${fixtureName}`;
const expectedPath = template
  ? template.replace('%(title)s', title).replace('%(ext)s', ext)
  : path.join(path.dirname(fixtureVideo), `${title}.${ext}`);

if (isSkipDownload && isPrintFilename) {
  process.stdout.write(expectedPath + '\n');
  process.exit(0);
}

// Simular descarga: copiar fixture al destino
fs.mkdirSync(path.dirname(expectedPath), { recursive: true });

if (fs.existsSync(expectedPath)) {
  process.stdout.write(`[download] ${expectedPath} has already been downloaded\n`);
} else {
  fs.copyFileSync(fixtureVideo, expectedPath);
  process.stdout.write(`[download] Destination: ${expectedPath}\n`);
}
