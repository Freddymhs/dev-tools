'use strict';
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Carga env.cjs desde una copia temporal para no contaminar el ROOT real
const ROOT = path.join(__dirname, '../..');
const ENV_LOCAL = path.join(ROOT, '.env.local');

const backupAndClean = () => {
  const backup = fs.existsSync(ENV_LOCAL) ? fs.readFileSync(ENV_LOCAL, 'utf8') : null;
  if (fs.existsSync(ENV_LOCAL)) fs.unlinkSync(ENV_LOCAL);
  return () => {
    if (backup !== null) fs.writeFileSync(ENV_LOCAL, backup, 'utf8');
    else if (fs.existsSync(ENV_LOCAL)) fs.unlinkSync(ENV_LOCAL);
  };
};

describe('lib/env.cjs', () => {
  const ctx = { restore: null };

  beforeEach(() => {
    ctx.restore = backupAndClean();
    // Limpiar cache de módulos para que cada test parta limpio
    delete require.cache[require.resolve('../../lib/env.cjs')];
  });

  afterEach(() => {
    ctx.restore();
    delete require.cache[require.resolve('../../lib/env.cjs')];
  });

  test('loadEnv carga variables desde .env.local', () => {
    fs.writeFileSync(ENV_LOCAL, 'TEST_KEY_XYZ=hello_world\n', 'utf8');
    delete process.env.TEST_KEY_XYZ;

    const { loadEnv } = require('../../lib/env.cjs');
    loadEnv();

    assert.equal(process.env.TEST_KEY_XYZ, 'hello_world');
    delete process.env.TEST_KEY_XYZ;
  });

  test('loadEnv ignora comentarios y líneas vacías', () => {
    fs.writeFileSync(ENV_LOCAL, '# comentario\n\nTEST_KEY_ABC=valor\n', 'utf8');
    delete process.env.TEST_KEY_ABC;

    const { loadEnv } = require('../../lib/env.cjs');
    loadEnv();

    assert.equal(process.env.TEST_KEY_ABC, 'valor');
    delete process.env.TEST_KEY_ABC;
  });
});
