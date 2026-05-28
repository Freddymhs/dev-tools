'use strict';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTestDir, makeEnv, runScript, FIXTURES } = require('../helpers/setup.cjs');

describe('generate_resume.cjs', () => {
  const ctx = createTestDir();
  after(() => ctx.cleanup());

  test('genera RESUME.md en CODE_RAW con el código del proyecto', () => {
    const env = makeEnv(ctx.dir, {
      PROJECT_PATH: path.join(FIXTURES, 'project'),
    });
    const result = runScript('generate_resume.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    const resumePath = path.join(ctx.dir, 'code', '1_raw', 'RESUME.md');
    assert.ok(fs.existsSync(resumePath), 'RESUME.md no fue creado');

    const content = fs.readFileSync(resumePath, 'utf8');
    assert.ok(content.includes('index.js'), 'RESUME.md no incluye index.js');
    assert.ok(content.includes('utils.js'), 'RESUME.md no incluye utils.js');
  });

  test('falla con error si PROJECT_PATH no existe', () => {
    const env = makeEnv(ctx.dir, { PROJECT_PATH: '/ruta/que/no/existe' });
    const result = runScript('generate_resume.cjs', env);
    assert.notEqual(result.status, 0);
  });

  test('usa process.cwd() si PROJECT_PATH no está definido', () => {
    const env = makeEnv(ctx.dir);
    delete env.PROJECT_PATH;
    const result = runScript('generate_resume.cjs', env);
    // No debe crashear — usa cwd como fallback
    const resumePath = path.join(ctx.dir, 'code', '1_raw', 'RESUME.md');
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.ok(fs.existsSync(resumePath));
  });
});
