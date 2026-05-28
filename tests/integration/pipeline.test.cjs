'use strict';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTestDir, makeEnv, runScript, FIXTURES } = require('../helpers/setup.cjs');

const runPipeline = (ctx, extraEnv = {}) => {
  const baseEnv = makeEnv(ctx.dir, { DOWNLOAD_URL: 'https://fake.url/video', ...extraEnv });

  const dl = runScript('download_video.cjs', baseEnv);
  if (dl.status !== 0) return { step: 'download', result: dl };

  // Recargar env para que VIDEO_PATH esté disponible
  const envWithVideo = makeEnv(ctx.dir, { ...extraEnv });
  const sp = runScript('split_video.cjs', envWithVideo);
  if (sp.status !== 0) return { step: 'split', result: sp };

  const tr = runScript('transcript_video.cjs', envWithVideo);
  return { step: 'transcript', result: tr };
};

describe('pipeline completo (download → split → transcript)', () => {
  test('pipeline con video corto (sin split): produce 1 transcript', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    // short.mp4 = 3s, umbral = 60s → no se divide → 1 parte → 1 transcript
    const { step, result } = runPipeline(ctx, {
      FIXTURE_VIDEO: path.join(FIXTURES, 'short.mp4'),
      DEV_TOOLS_SPLIT_SECONDS: '60',
    });

    assert.equal(result.status, 0, `Falló en step=${step}\nstderr: ${result.stderr}`);

    const transcripts = fs.readdirSync(path.join(ctx.dir, 'media', '3_transcripts'))
      .filter(f => f.endsWith('.txt'));
    assert.equal(transcripts.length, 1, 'Debe haber 1 transcript');
  });

  test('pipeline con video largo (con split): produce N transcripts', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    // long.mp4 = 90s, umbral = 30s → 3 partes → 3 transcripts
    const { step, result } = runPipeline(ctx, {
      FIXTURE_VIDEO: path.join(FIXTURES, 'long.mp4'),
      DEV_TOOLS_SPLIT_SECONDS: '30',
    });

    assert.equal(result.status, 0, `Falló en step=${step}\nstderr: ${result.stderr}`);

    const parts = fs.readdirSync(path.join(ctx.dir, 'media', '2_parts'));
    assert.ok(parts.length >= 2, `Esperaba múltiples partes, hay ${parts.length}`);

    const transcripts = fs.readdirSync(path.join(ctx.dir, 'media', '3_transcripts'))
      .filter(f => f.endsWith('.txt'));
    assert.equal(transcripts.length, parts.length, 'Cantidad de transcripts debe igualar partes');
  });

  test('segunda ejecución con mismo video (already downloaded) funciona igual', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const extraEnv = {
      FIXTURE_VIDEO: path.join(FIXTURES, 'short.mp4'),
      DEV_TOOLS_SPLIT_SECONDS: '60',
    };

    // Primera corrida
    runPipeline(ctx, extraEnv);

    // Segunda corrida — yt-dlp reportará "already been downloaded"
    const { step, result } = runPipeline(ctx, extraEnv);
    assert.equal(result.status, 0, `Segunda corrida falló en step=${step}\nstderr: ${result.stderr}`);

    const transcripts = fs.readdirSync(path.join(ctx.dir, 'media', '3_transcripts'))
      .filter(f => f.endsWith('.txt'));
    assert.equal(transcripts.length, 1);
  });

  test('segunda corrida con video diferente no mezcla parts viejos (Bug 2)', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    // Primera corrida con long.mp4 (3 partes)
    runPipeline(ctx, {
      FIXTURE_VIDEO: path.join(FIXTURES, 'long.mp4'),
      DEV_TOOLS_SPLIT_SECONDS: '30',
    });

    const partsAfterFirst = fs.readdirSync(path.join(ctx.dir, 'media', '2_parts'));
    assert.ok(partsAfterFirst.length >= 2);

    // Segunda corrida con short.mp4 (1 parte)
    const { step, result } = runPipeline(ctx, {
      FIXTURE_VIDEO: path.join(FIXTURES, 'short.mp4'),
      DEV_TOOLS_SPLIT_SECONDS: '60',
    });
    assert.equal(result.status, 0, `Falló en step=${step}\nstderr: ${result.stderr}`);

    const partsAfterSecond = fs.readdirSync(path.join(ctx.dir, 'media', '2_parts'));
    assert.equal(partsAfterSecond.length, 1, 'Los parts viejos del video anterior deben haber sido limpiados');

    const transcripts = fs.readdirSync(path.join(ctx.dir, 'media', '3_transcripts'))
      .filter(f => f.endsWith('.txt'));
    assert.equal(transcripts.length, 1, 'Solo debe haber 1 transcript (del video nuevo)');
  });
});
