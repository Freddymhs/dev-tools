const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./lib/env.cjs");

loadEnv();

const { MEDIA_DOWNLOADS, LAST_VIDEO } = require("./lib/paths.cjs");

const url = process.argv[2] || process.env.DOWNLOAD_URL;

if (!url) {
  console.error("Falta URL: pasar como argumento o variable DOWNLOAD_URL");
  process.exit(1);
}

const LAST_VIDEO_FILE = LAST_VIDEO;

const isLocalFile = !url.startsWith("http://") && !url.startsWith("https://");

if (isLocalFile) {
  if (!fs.existsSync(url)) {
    console.error(`Archivo no encontrado: ${url}`);
    process.exit(1);
  }
  const videoPath = path.resolve(url);
  fs.writeFileSync(LAST_VIDEO_FILE, videoPath);
  console.log(`📌 Video local registrado: ${path.basename(videoPath)}`);
  process.exit(0);
}

try {
  execSync("which yt-dlp", { stdio: "ignore" });
} catch {
  console.error("yt-dlp no está instalado. Instalar con:");
  console.error(
    "  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp"
  );
  process.exit(1);
}

const OUTPUT_DIR = MEDIA_DOWNLOADS;
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const beforeFiles = new Set(fs.readdirSync(OUTPUT_DIR));
const outputTemplate = path.join(OUTPUT_DIR, "%(title)s.%(ext)s");

console.log(`Descargando: ${url}`);
execSync(
  `yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" -o "${outputTemplate}" "${url}"`,
  { stdio: "inherit" }
);

const newFile = fs.readdirSync(OUTPUT_DIR).find((f) => !beforeFiles.has(f));

const resolveDownloadedPath = () => {
  if (newFile) return path.join(OUTPUT_DIR, newFile);

  // "already downloaded" — yt-dlp skipped but file exists; find it by basename
  const expectedName = execSync(
    `yt-dlp --skip-download --print filename -f "bestvideo[height<=720]+bestaudio/best[height<=720]" -o "${outputTemplate}" "${url}" 2>/dev/null`,
    { encoding: "utf8" }
  ).trim().split("\n")[0];
  const base = path.basename(expectedName, path.extname(expectedName));
  const match = fs.readdirSync(OUTPUT_DIR).find(
    (f) => path.basename(f, path.extname(f)) === base
  );
  return match ? path.join(OUTPUT_DIR, match) : null;
};

const videoPath = resolveDownloadedPath();
if (videoPath) {
  fs.writeFileSync(LAST_VIDEO_FILE, videoPath);
  console.log(`📌 Video listo: ${path.basename(videoPath)}`);
}

console.log(`✅ Descarga completada en: ${OUTPUT_DIR}`);
