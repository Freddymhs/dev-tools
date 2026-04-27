const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MAX_MINUTES = 25;
const MAX_SECONDS = MAX_MINUTES * 60;

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

const videoPath = process.env.VIDEO_PATH;

if (!videoPath) {
  console.error("Falta VIDEO_PATH en .env.local");
  process.exit(1);
}

const absolutePath = path.resolve(videoPath);

if (!fs.existsSync(absolutePath)) {
  console.error(`No existe: ${absolutePath}`);
  process.exit(1);
}

const ext = path.extname(absolutePath);
const baseName = path.basename(absolutePath, ext);
const dir = path.dirname(absolutePath);

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
  console.log(`Video dura ${formatTime(totalSeconds)}. No necesita dividirse.`);
  process.exit(0);
}

const partsCount = Math.ceil(totalSeconds / MAX_SECONDS);
const partDuration = Math.ceil(totalSeconds / partsCount);

console.log(`Video: ${baseName}${ext} (${formatTime(totalSeconds)})`);
console.log(`${partsCount} partes de ~${formatTime(partDuration)}`);

for (let i = 0; i < partsCount; i++) {
  const start = i * partDuration;
  const outputFile = path.join(dir, `${baseName}_parte${i + 1}${ext}`);
  const isLast = i === partsCount - 1;

  const cmd = isLast
    ? `ffmpeg -y -i "${absolutePath}" -ss ${formatTime(start)} -c copy "${outputFile}"`
    : `ffmpeg -y -i "${absolutePath}" -ss ${formatTime(start)} -t ${formatTime(partDuration)} -c copy "${outputFile}"`;

  execSync(cmd);
  console.log(`Parte ${i + 1}: ${formatTime(start)} → ${isLast ? "final" : formatTime(start + partDuration)}`);
}

console.log("Listo.");
