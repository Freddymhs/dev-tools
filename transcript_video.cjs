const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  fs.readFileSync(filePath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (key) process.env[key] = value;
    });
};

loadEnvFile(path.join(__dirname, ".env"));
loadEnvFile(path.join(__dirname, ".env.local"));

const PARTS_DIR = path.join(__dirname, "output", "media", "2_parts");
const TRANSCRIPTS_DIR = path.join(
  __dirname,
  "output",
  "media",
  "3_transcripts",
);
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
    "No existe output/media/2_parts/. Ejecutar npm run split-video primero.",
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
    "No se encontraron videos en output/media/2_parts/. Ejecutar npm run split-video primero.",
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

console.log(`\n✅ Transcripciones completadas en: output/media/3_transcripts/`);
