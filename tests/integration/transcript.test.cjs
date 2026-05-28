'use strict';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTestDir, makeEnv, runScript, FIXTURES } = require('../helpers/setup.cjs');

const setupParts = (partsDir, videoFile) => {
  fs.mkdirSync(partsDir, { recursive: true });
  const dest = path.join(partsDir, path.basename(videoFile));
  fs.copyFileSync(videoFile, dest);
};

describe('transcript_video.cjs', () => {
  test('transcribe todas las partes en MEDIA_TRANSCRIPTS', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const partsDir = path.join(ctx.dir, 'media', '2_parts');
    setupParts(partsDir, path.join(FIXTURES, 'short.mp4'));

    const env = makeEnv(ctx.dir);
    const result = runScript('transcript_video.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    const transcriptsDir = path.join(ctx.dir, 'media', '3_transcripts');
    assert.ok(fs.existsSync(transcriptsDir));
    const txts = fs.readdirSync(transcriptsDir).filter(f => f.endsWith('.txt'));
    assert.equal(txts.length, 1, 'Debe haber 1 transcript');
  });

  test('transcribe múltiples partes', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const partsDir = path.join(ctx.dir, 'media', '2_parts');
    fs.mkdirSync(partsDir, { recursive: true });
    fs.copyFileSync(path.join(FIXTURES, 'short.mp4'), path.join(partsDir, 'parte1.mp4'));
    fs.copyFileSync(path.join(FIXTURES, 'short.mp4'), path.join(partsDir, 'parte2.mp4'));

    const env = makeEnv(ctx.dir);
    const result = runScript('transcript_video.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    const txts = fs.readdirSync(path.join(ctx.dir, 'media', '3_transcripts')).filter(f => f.endsWith('.txt'));
    assert.equal(txts.length, 2);
  });

  test('falla con mensaje claro si MEDIA_PARTS no existe', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const env = makeEnv(ctx.dir);
    const result = runScript('transcript_video.cjs', env);
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes('split-video'), `stderr: ${result.stderr}`);
  });

  test('falla con mensaje claro si MEDIA_PARTS está vacío de videos', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const partsDir = path.join(ctx.dir, 'media', '2_parts');
    fs.mkdirSync(partsDir, { recursive: true });
    fs.writeFileSync(path.join(partsDir, 'readme.txt'), 'no es un video');

    const env = makeEnv(ctx.dir);
    const result = runScript('transcript_video.cjs', env);
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes('split-video'), `stderr: ${result.stderr}`);
  });
});
