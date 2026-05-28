const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./lib/env.cjs");
const { MEDIA_PARTS, LAST_VIDEO } = require("./lib/paths.cjs");

const MAX_SECONDS = parseInt(process.env.DEV_TOOLS_SPLIT_SECONDS, 10) || (25 * 60);

loadEnv();

const LAST_VIDEO_FILE = LAST_VIDEO;
const PARTS_DIR = MEDIA_PARTS;

const videoPath = (() => {
  if (process.env.VIDEO_PATH) return process.env.VIDEO_PATH;
  if (fs.existsSync(LAST_VIDEO_FILE)) {
    const p = fs.readFileSync(LAST_VIDEO_FILE, "utf-8").trim();
    console.log(`Usando .last_video: ${p}`);
    return p;
  }
  return null;
})();

if (!videoPath) {
  console.error("Falta VIDEO_PATH en .env.local o ejecutar npm run download primero");
  process.exit(1);
}

const absolutePath = path.resolve(videoPath);

if (!fs.existsSync(absolutePath)) {
  console.error(`No existe: ${absolutePath}`);
  process.exit(1);
}

// Limpiar parts viejos antes de crear nuevos (evita acumulación entre runs)
if (fs.existsSync(PARTS_DIR)) {
  const VIDEO_EXT = new Set([".mp4", ".webm", ".mkv", ".avi", ".mov", ".m4v"]);
  fs.readdirSync(PARTS_DIR)
    .filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))
    .forEach((f) => fs.unlinkSync(path.join(PARTS_DIR, f)));
}
fs.mkdirSync(PARTS_DIR, { recursive: true });

const ext = path.extname(absolutePath);
const baseName = path.basename(absolutePath, ext);

const durationRaw = execSync(
  `ffmpeg -i "${absolutePath}" 2>&1 | grep Duration`
).toString();

const match = durationRaw.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
if (!match) {
  console.error("No se pudo leer la duración del video.");
  process.exit(1);
}

const totalSeconds =
  parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);

const formatTime = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

if (totalSeconds <= MAX_SECONDS) {
  const outputFile = path.join(PARTS_DIR, `${baseName}_parte1${ext}`);
  fs.copyFileSync(absolutePath, outputFile);
  console.log(`Video dura ${formatTime(totalSeconds)}. Copiado como parte única.`);
  process.exit(0);
}

const partsCount = Math.ceil(totalSeconds / MAX_SECONDS);
const partDuration = Math.ceil(totalSeconds / partsCount);

console.log(`Video: ${baseName}${ext} (${formatTime(totalSeconds)})`);
console.log(`${partsCount} partes de ~${formatTime(partDuration)}`);

Array.from({ length: partsCount }, (_, i) => i).forEach((i) => {
  const start = i * partDuration;
  const outputFile = path.join(PARTS_DIR, `${baseName}_parte${i + 1}${ext}`);
  const isLast = i === partsCount - 1;

  const cmd = isLast
    ? `ffmpeg -y -i "${absolutePath}" -ss ${formatTime(start)} -c copy "${outputFile}"`
    : `ffmpeg -y -i "${absolutePath}" -ss ${formatTime(start)} -t ${formatTime(partDuration)} -c copy "${outputFile}"`;

  execSync(cmd);
  console.log(`Parte ${i + 1}: ${formatTime(start)} → ${isLast ? "final" : formatTime(start + partDuration)}`);
});

console.log("Listo.");
