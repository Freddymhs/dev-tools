const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./lib/env.cjs");
const { MEDIA_PARTS, MEDIA_TRANSCRIPTS } = require("./lib/paths.cjs");

loadEnv();

const PARTS_DIR = MEDIA_PARTS;
const TRANSCRIPTS_DIR = MEDIA_TRANSCRIPTS;
const whisperModel = process.env.WHISPER_MODEL || "tiny";

try {
  execSync("which whisper", { stdio: "ignore" });
} catch {
  console.error(
    "whisper no está instalado. Instalar con: pip install openai-whisper",
  );
  process.exit(1);
}

if (!fs.existsSync(PARTS_DIR)) {
  console.error(
    `No existe ${PARTS_DIR}. Ejecutar npm run split-video primero.`,
  );
  process.exit(1);
}

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mkv",
  ".avi",
  ".mov",
  ".m4v",
]);

const parts = fs
  .readdirSync(PARTS_DIR)
  .filter((f) => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()))
  .sort()
  .map((f) => path.join(PARTS_DIR, f));

if (parts.length === 0) {
  console.error(
    `No se encontraron videos en ${PARTS_DIR}. Ejecutar npm run split-video primero.`,
  );
  process.exit(1);
}

fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

console.log(`${parts.length} partes encontradas. Modelo: ${whisperModel}`);

for (const part of parts) {
  const partName = path.basename(part);
  console.log(`\nTranscribiendo: ${partName}`);
  execSync(
    `whisper "${part}" --model ${whisperModel} --output_format txt --output_dir "${TRANSCRIPTS_DIR}"`,
    { stdio: "inherit" },
  );
}

console.log(`\n✅ Transcripciones completadas en: ${TRANSCRIPTS_DIR}`);
