'use strict';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTestDir, makeEnv, runScript, FIXTURES } = require('../helpers/setup.cjs');

const generateBundle = (ctx, projectPath) => {
  const env = makeEnv(ctx.dir, { PROJECT_PATH: projectPath });
  return runScript('generate_bundle.cjs', env);
};

describe('split_markdown.cjs', () => {
  const ctx = createTestDir();
  after(() => ctx.cleanup());

  test('divide BUNDLE.md en partes en CODE_PARTS', () => {
    // Primero genera el BUNDLE
    generateBundle(ctx, path.join(FIXTURES, 'project'));
    const env = makeEnv(ctx.dir);
    const result = runScript('split_markdown.cjs', env);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);

    const partsDir = path.join(ctx.dir, 'code', '2_parts');
    assert.ok(fs.existsSync(partsDir), 'CODE_PARTS no fue creado');

    const parts = fs.readdirSync(partsDir).filter(f => f.endsWith('.md'));
    assert.ok(parts.length >= 1, 'No se generaron partes');
  });

  test('segunda ejecución limpia partes viejas (Bug stale parts)', () => {
    // Primera corrida: genera partes del proyecto fixture
    generateBundle(ctx, path.join(FIXTURES, 'project'));
    runScript('split_markdown.cjs', makeEnv(ctx.dir));
    const partsDir = path.join(ctx.dir, 'code', '2_parts');
    const partsAfterFirst = fs.readdirSync(partsDir).filter(f => f.endsWith('.md'));

    // Inyectar partes falsas adicionales para simular una corrida anterior mayor
    fs.writeFileSync(path.join(partsDir, 'BUNDLE_part03.md'), 'stale', 'utf8');
    fs.writeFileSync(path.join(partsDir, 'BUNDLE_part04.md'), 'stale', 'utf8');

    // Segunda corrida
    generateBundle(ctx, path.join(FIXTURES, 'project'));
    runScript('split_markdown.cjs', makeEnv(ctx.dir));

    const partsAfterSecond = fs.readdirSync(partsDir).filter(f => f.endsWith('.md'));
    assert.equal(
      partsAfterSecond.length,
      partsAfterFirst.length,
      'Las partes falsas de la corrida anterior deben haber sido eliminadas'
    );
  });

  test('falla con mensaje claro si BUNDLE.md no existe', () => {
    const freshCtx = createTestDir();
    const env = makeEnv(freshCtx.dir);
    const result = runScript('split_markdown.cjs', env);
    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes('No se encontró'), `stderr: ${result.stderr}`);
    freshCtx.cleanup();
  });
});
