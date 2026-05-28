'use strict';
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
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

  test('setVar escribe nueva variable en .env.local', () => {
    const { setVar } = require('../../lib/env.cjs');
    setVar('TEST_NEW_VAR', '/ruta/nueva');

    const content = fs.readFileSync(ENV_LOCAL, 'utf8');
    assert.ok(content.includes('TEST_NEW_VAR=/ruta/nueva'));
    delete process.env.TEST_NEW_VAR;
  });

  test('setVar actualiza variable existente sin duplicar', () => {
    fs.writeFileSync(ENV_LOCAL, 'TEST_UPD=viejo\n', 'utf8');
    const { setVar } = require('../../lib/env.cjs');
    setVar('TEST_UPD', 'nuevo');

    const content = fs.readFileSync(ENV_LOCAL, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const matches = lines.filter(l => l.startsWith('TEST_UPD='));
    assert.equal(matches.length, 1);
    assert.equal(matches[0], 'TEST_UPD=nuevo');
    delete process.env.TEST_UPD;
  });

  test('setVar maneja rutas con espacios', () => {
    const { setVar } = require('../../lib/env.cjs');
    setVar('TEST_PATH_SPACES', '/ruta/con espacios/archivo.mp4');

    const content = fs.readFileSync(ENV_LOCAL, 'utf8');
    assert.ok(content.includes('TEST_PATH_SPACES=/ruta/con espacios/archivo.mp4'));
    delete process.env.TEST_PATH_SPACES;
  });

  test('getVar devuelve valor de process.env', () => {
    process.env.TEST_GET_VAR = 'mi_valor';
    const { getVar } = require('../../lib/env.cjs');
    assert.equal(getVar('TEST_GET_VAR'), 'mi_valor');
    delete process.env.TEST_GET_VAR;
  });

  test('getVar devuelve string vacío si no existe', () => {
    delete process.env.VAR_QUE_NO_EXISTE;
    const { getVar } = require('../../lib/env.cjs');
    assert.equal(getVar('VAR_QUE_NO_EXISTE'), '');
  });

  test('listMissing devuelve solo las claves ausentes', () => {
    process.env.EXISTE = 'si';
    delete process.env.NO_EXISTE;
    const { listMissing } = require('../../lib/env.cjs');
    const missing = listMissing(['EXISTE', 'NO_EXISTE']);
    assert.deepEqual(missing, ['NO_EXISTE']);
    delete process.env.EXISTE;
  });
});
