'use strict';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTestDir, makeEnv, runScript, FIXTURES } = require('../helpers/setup.cjs');

describe('download_video.cjs', () => {
  const ctx = createTestDir();
  after(() => ctx.cleanup());

  test('descarga video y actualiza VIDEO_PATH en .env.local', () => {
    const env = makeEnv(ctx.dir, { DOWNLOAD_URL: 'https://fake.url/video' });
    const result = runScript('download_video.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}\nstdout: ${result.stdout}`);

    const downloadsDir = path.join(ctx.dir, 'media', '1_downloads');
    assert.ok(fs.existsSync(downloadsDir));
    const files = fs.readdirSync(downloadsDir);
    assert.equal(files.length, 1, 'Debe haber exactamente 1 archivo descargado');

    // VIDEO_PATH debe estar en el env file del test
    const envFile = env.DEV_TOOLS_ENV_FILE;
    const envContent = fs.readFileSync(envFile, 'utf8');
    assert.ok(envContent.includes('VIDEO_PATH='), `env file no tiene VIDEO_PATH\n${envContent}`);
    assert.ok(envContent.includes(files[0]), 'VIDEO_PATH no apunta al archivo descargado');
  });

  test('segunda descarga del mismo video: VIDEO_PATH se actualiza igual', () => {
    // El fake-yt-dlp detecta que ya existe y reporta "already been downloaded"
    const env = makeEnv(ctx.dir, { DOWNLOAD_URL: 'https://fake.url/video' });
    const result = runScript('download_video.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.ok(result.stdout.includes('already been downloaded') || result.stdout.includes('Video listo'));

    const envFile = env.DEV_TOOLS_ENV_FILE;
    const envContent = fs.readFileSync(envFile, 'utf8');
    assert.ok(envContent.includes('VIDEO_PATH='), 'VIDEO_PATH debe seguir en env file después de re-descarga');
  });

  test('falla con error si DOWNLOAD_URL no está definido', () => {
    const env = makeEnv(ctx.dir);
    delete env.DOWNLOAD_URL;
    const result = runScript('download_video.cjs', env);
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes('DOWNLOAD_URL'));
  });

  test('registra video local sin usar yt-dlp', () => {
    const localPath = FIXTURES + '/short.mp4';
    const env = makeEnv(ctx.dir, { DOWNLOAD_URL: localPath });
    const result = runScript('download_video.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}\nstdout: ${result.stdout}`);
    assert.ok(result.stdout.includes('Video local registrado'));

    const lastVideoFile = path.join(ctx.dir, 'media', '.last_video');
    assert.ok(fs.existsSync(lastVideoFile), '.last_video debe crearse');
    assert.equal(fs.readFileSync(lastVideoFile, 'utf8').trim(), localPath);

    const envContent = fs.readFileSync(env.DEV_TOOLS_ENV_FILE, 'utf8');
    assert.ok(envContent.includes('VIDEO_PATH='), 'VIDEO_PATH debe estar en el env file');
    assert.ok(envContent.includes(localPath), 'VIDEO_PATH debe apuntar al archivo local');
  });

  test('falla con error si la ruta local no existe', () => {
    const env = makeEnv(ctx.dir, { DOWNLOAD_URL: '/no/existe/video.mp4' });
    const result = runScript('download_video.cjs', env);
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes('Archivo no encontrado'));
  });
});
