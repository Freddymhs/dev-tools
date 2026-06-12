const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./lib/env.cjs");

loadEnv();

const { MEDIA_PARTS, MEDIA_TRANSCRIPTS } = require("./lib/paths.cjs");
const { MEDIA_EXTENSIONS } = require("./lib/media.cjs");

const PARTS_DIR = MEDIA_PARTS;
const TRANSCRIPTS_DIR = MEDIA_TRANSCRIPTS;
const whisperModel = process.env.WHISPER_MODEL || "small";
const whisperBin = process.env.WHISPER_BIN || "whisper";

try {
  execSync(`which ${whisperBin}`, { stdio: "ignore" });
} catch {
  console.error(
    `${whisperBin} no está instalado. Instalar con: pip install openai-whisper`,
  );
  process.exit(1);
}

if (!fs.existsSync(PARTS_DIR)) {
  console.error(
    `No existe ${PARTS_DIR}. Ejecutar npm run split-video primero.`,
  );
  process.exit(1);
}

const parts = fs
  .readdirSync(PARTS_DIR)
  .filter((f) => MEDIA_EXTENSIONS.has(path.extname(f).toLowerCase()))
  .sort()
  .map((f) => path.join(PARTS_DIR, f));

if (parts.length === 0) {
  console.error(
    `No se encontraron videos o audios en ${PARTS_DIR}. Ejecutar npm run split-video primero.`,
  );
  process.exit(1);
}

if (fs.existsSync(TRANSCRIPTS_DIR)) {
  fs.readdirSync(TRANSCRIPTS_DIR)
    .filter((f) => f.endsWith(".txt"))
    .forEach((f) => fs.unlinkSync(path.join(TRANSCRIPTS_DIR, f)));
}
fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

console.log(`${parts.length} partes encontradas. Modelo: ${whisperModel}`);

for (const part of parts) {
  const partName = path.basename(part);
  console.log(`\nTranscribiendo: ${partName}`);
  execSync(
    `${whisperBin} "${part}" --model ${whisperModel} --output_format txt --output_dir "${TRANSCRIPTS_DIR}"`,
    { stdio: "inherit" },
  );
}

console.log(`\n✅ Transcripciones completadas en: ${TRANSCRIPTS_DIR}`);
