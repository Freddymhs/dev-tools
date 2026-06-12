'use strict';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTestDir, makeEnv, runScript, FIXTURES } = require('../helpers/setup.cjs');

// Umbral pequeño para tests: 30s → long.mp4 (90s) se divide en 3 partes
const SPLIT_SECONDS = '30';

describe('split_video.cjs', () => {
  test('video corto (≤ umbral): copia como parte única en MEDIA_PARTS', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const env = makeEnv(ctx.dir, {
      VIDEO_PATH: path.join(FIXTURES, 'short.mp4'),
      DEV_TOOLS_SPLIT_SECONDS: '60', // 3s < 60s → no debe dividir
    });
    const result = runScript('split_video.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.ok(result.stdout.includes('parte única'), `stdout: ${result.stdout}`);

    const partsDir = path.join(ctx.dir, 'media', '2_parts');
    const parts = fs.readdirSync(partsDir);
    assert.equal(parts.length, 1, 'Debe haber exactamente 1 parte para video corto');
  });

  test('video largo (> umbral): divide en N partes', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const env = makeEnv(ctx.dir, {
      VIDEO_PATH: path.join(FIXTURES, 'long.mp4'),
      DEV_TOOLS_SPLIT_SECONDS: SPLIT_SECONDS, // 90s / 30s = 3 partes
    });
    const result = runScript('split_video.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    const partsDir = path.join(ctx.dir, 'media', '2_parts');
    const parts = fs.readdirSync(partsDir);
    assert.ok(parts.length >= 2, `Debe haber múltiples partes, hay ${parts.length}`);
  });

  test('limpia parts viejos antes de crear nuevos (Bug 2)', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const partsDir = path.join(ctx.dir, 'media', '2_parts');
    fs.mkdirSync(partsDir, { recursive: true });

    // Crear un part "stale" de una corrida anterior
    fs.writeFileSync(path.join(partsDir, 'video_viejo_parte1.mp4'), 'fake');

    const env = makeEnv(ctx.dir, {
      VIDEO_PATH: path.join(FIXTURES, 'short.mp4'),
      DEV_TOOLS_SPLIT_SECONDS: '60',
    });
    runScript('split_video.cjs', env);

    const parts = fs.readdirSync(partsDir);
    const stale = parts.find(f => f.includes('viejo'));
    assert.equal(stale, undefined, `El part viejo no fue eliminado: ${stale}`);
  });

  test('audio (.m4a): copia como parte única en MEDIA_PARTS', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const env = makeEnv(ctx.dir, {
      VIDEO_PATH: path.join(FIXTURES, 'short.m4a'),
      DEV_TOOLS_SPLIT_SECONDS: '60',
    });
    const result = runScript('split_video.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    const partsDir = path.join(ctx.dir, 'media', '2_parts');
    const parts = fs.readdirSync(partsDir);
    assert.equal(parts.length, 1, 'Debe haber exactamente 1 parte para audio corto');
    assert.ok(parts[0].endsWith('.m4a'), `Extensión esperada .m4a, recibido: ${parts[0]}`);
  });

  test('falla con mensaje claro si VIDEO_PATH no existe', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const env = makeEnv(ctx.dir, { VIDEO_PATH: '/ruta/que/no/existe.mp4' });
    const result = runScript('split_video.cjs', env);
    assert.notEqual(result.status, 0);
    assert.ok(
      result.stderr.includes('No existe') || result.stderr.includes('VIDEO_PATH'),
      `stderr: ${result.stderr}`
    );
  });

  test('falla con mensaje claro si no hay VIDEO_PATH ni .last_video', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const env = makeEnv(ctx.dir);
    delete env.VIDEO_PATH;
    const result = runScript('split_video.cjs', env);
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes('VIDEO_PATH'), `stderr: ${result.stderr}`);
  });

  test('usa .last_video como fallback si VIDEO_PATH no está', () => {
    const ctx = createTestDir();
    after(() => ctx.cleanup());

    const lastVideoFile = path.join(ctx.dir, 'media', '.last_video');
    fs.mkdirSync(path.dirname(lastVideoFile), { recursive: true });
    fs.writeFileSync(lastVideoFile, path.join(FIXTURES, 'short.mp4'), 'utf8');

    const env = makeEnv(ctx.dir, { DEV_TOOLS_SPLIT_SECONDS: '60' });
    delete env.VIDEO_PATH;
    const result = runScript('split_video.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    const parts = fs.readdirSync(path.join(ctx.dir, 'media', '2_parts'));
    assert.equal(parts.length, 1);
  });
});
