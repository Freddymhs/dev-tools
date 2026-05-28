'use strict';
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');

describe('lib/paths.cjs', () => {
  const clearCache = () => delete require.cache[require.resolve('../../lib/paths.cjs')];

  beforeEach(clearCache);
  afterEach(() => {
    delete process.env.DEV_TOOLS_OUTPUT_BASE;
    clearCache();
  });

  test('usa ~/Documents/dev-tools por defecto', () => {
    delete process.env.DEV_TOOLS_OUTPUT_BASE;
    const paths = require('../../lib/paths.cjs');
    const expected = path.join(os.homedir(), 'Documents', 'dev-tools');
    assert.ok(paths.CODE_RAW.startsWith(expected));
  });

  test('respeta DEV_TOOLS_OUTPUT_BASE cuando está definido', () => {
    process.env.DEV_TOOLS_OUTPUT_BASE = '/tmp/test-output';
    const paths = require('../../lib/paths.cjs');
    assert.ok(paths.CODE_RAW.startsWith('/tmp/test-output'));
    assert.ok(paths.MEDIA_DOWNLOADS.startsWith('/tmp/test-output'));
  });

  test('exporta las 6 rutas esperadas', () => {
    const paths = require('../../lib/paths.cjs');
    const expected = ['CODE_RAW', 'CODE_PARTS', 'MEDIA_DOWNLOADS', 'MEDIA_PARTS', 'MEDIA_TRANSCRIPTS', 'LAST_VIDEO'];
    for (const key of expected) {
      assert.ok(paths[key], `Falta la ruta: ${key}`);
    }
  });

  test('estructura de rutas es consistente', () => {
    process.env.DEV_TOOLS_OUTPUT_BASE = '/base';
    const p = require('../../lib/paths.cjs');
    assert.equal(p.CODE_RAW,          '/base/code/1_raw');
    assert.equal(p.CODE_PARTS,        '/base/code/2_parts');
    assert.equal(p.MEDIA_DOWNLOADS,   '/base/media/1_downloads');
    assert.equal(p.MEDIA_PARTS,       '/base/media/2_parts');
    assert.equal(p.MEDIA_TRANSCRIPTS, '/base/media/3_transcripts');
    assert.equal(p.LAST_VIDEO,        '/base/media/.last_video');
  });
});
