'use strict';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTestDir, makeEnv, runScript, FIXTURES } = require('../helpers/setup.cjs');

describe('generate_bundle.cjs', () => {
  const ctx = createTestDir();
  after(() => ctx.cleanup());

  test('genera BUNDLE.md en CODE_RAW con el código del proyecto', () => {
    const env = makeEnv(ctx.dir, {
      PROJECT_PATH: path.join(FIXTURES, 'project'),
    });
    const result = runScript('generate_bundle.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    const bundlePath = path.join(ctx.dir, 'code', '1_raw', 'BUNDLE.md');
    assert.ok(fs.existsSync(bundlePath), 'BUNDLE.md no fue creado');

    const content = fs.readFileSync(bundlePath, 'utf8');
    assert.ok(content.includes('index.js'), 'BUNDLE.md no incluye index.js');
    assert.ok(content.includes('utils.js'), 'BUNDLE.md no incluye utils.js');
  });

  test('falla con error si PROJECT_PATH no existe', () => {
    const env = makeEnv(ctx.dir, { PROJECT_PATH: '/ruta/que/no/existe' });
    const result = runScript('generate_bundle.cjs', env);
    assert.notEqual(result.status, 0);
  });

  test('usa process.cwd() si PROJECT_PATH no está definido', () => {
    const env = makeEnv(ctx.dir);
    delete env.PROJECT_PATH;
    const result = runScript('generate_bundle.cjs', env);
    // No debe crashear — usa cwd como fallback
    const bundlePath = path.join(ctx.dir, 'code', '1_raw', 'BUNDLE.md');
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.ok(fs.existsSync(bundlePath));
  });
});
