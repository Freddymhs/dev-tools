const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./lib/env.cjs");

loadEnv();

const url = process.env.DOWNLOAD_URL;

if (!url) {
  console.error("Falta DOWNLOAD_URL en .env.local");
  process.exit(1);
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

const OUTPUT_DIR = path.join(__dirname, "output", "media", "1_downloads");
const LAST_VIDEO_FILE = path.join(__dirname, "output", "media", ".last_video");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const beforeFiles = new Set(fs.readdirSync(OUTPUT_DIR));
const outputTemplate = path.join(OUTPUT_DIR, "%(title)s.%(ext)s");

console.log(`Descargando: ${url}`);
execSync(
  `yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" -o "${outputTemplate}" "${url}"`,
  { stdio: "inherit" }
);

const newFile = fs.readdirSync(OUTPUT_DIR).find((f) => !beforeFiles.has(f));
if (newFile) {
  fs.writeFileSync(LAST_VIDEO_FILE, path.join(OUTPUT_DIR, newFile));
  console.log(`📌 Guardado en .last_video: ${newFile}`);
}

console.log("✅ Descarga completada en output/media/1_downloads/");
