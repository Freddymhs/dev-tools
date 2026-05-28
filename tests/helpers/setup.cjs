const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const FAKE_BIN = path.join(__dirname, 'bin');
const FIXTURES = path.join(__dirname, '../fixtures');

/** Crea un directorio temporal y devuelve helpers para usarlo */
const createTestDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-tools-test-'));
  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
};

/**
 * Construye el objeto env para un test:
 * - DEV_TOOLS_OUTPUT_BASE apunta al dir temporal
 * - DEV_TOOLS_ENV_FILE apunta a un env file aislado en el dir temporal
 *   (evita que loadEnv() lea el .env.local real del proyecto)
 * - PATH incluye los binarios fake (yt-dlp, whisper)
 * - extraVars permite agregar VIDEO_PATH, DOWNLOAD_URL, etc.
 */
const makeEnv = (outputBase, extraVars = {}) => {
  const envFile = path.join(outputBase, '.env.local.test');
  // Escribir solo las vars del test en el env file aislado
  fs.mkdirSync(outputBase, { recursive: true });
  const entries = { DEV_TOOLS_OUTPUT_BASE: outputBase, ...extraVars };
  fs.writeFileSync(
    envFile,
    Object.entries(entries).map(([k, v]) => `${k}=${v}`).join('\n'),
    'utf8'
  );

  return {
    ...process.env,
    PATH: `${FAKE_BIN}:${process.env.PATH}`,
    DEV_TOOLS_OUTPUT_BASE: outputBase,
    DEV_TOOLS_ENV_FILE: envFile,
    FIXTURE_VIDEO: path.join(FIXTURES, 'short.mp4'),
    ...extraVars,
  };
};

/** Ejecuta un script del proyecto como subproceso y devuelve el resultado */
const runScript = (scriptName, env) =>
  spawnSync('node', [path.join(ROOT, scriptName)], {
    env,
    encoding: 'utf8',
    cwd: ROOT,
  });

/** Escribe un .env.local mínimo en el ROOT (lo limpia después del test) */
const writeEnvLocal = (vars = {}) => {
  const envPath = path.join(ROOT, '.env.local');
  const backup = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : null;
  const content = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join('\n');
  fs.writeFileSync(envPath, content, 'utf8');
  return () => {
    if (backup !== null) fs.writeFileSync(envPath, backup, 'utf8');
    else if (fs.existsSync(envPath)) fs.unlinkSync(envPath);
  };
};

module.exports = { createTestDir, makeEnv, runScript, writeEnvLocal, ROOT, FIXTURES };
