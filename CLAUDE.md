# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run generate          # genera output/RESUME.md con el código fuente de PROJECT_PATH
npm run split             # divide output/RESUME.md en partes de 10k líneas
npm run generate-splited  # generate + split + elimina RESUME.md intermedio
npm run split-video       # divide VIDEO_PATH en segmentos de 25 min (requiere ffmpeg)
npm run download          # descarga DOWNLOAD_URL a output/ en 720p (requiere yt-dlp)
```

Sin lint ni tests configurados.

## Arquitectura

4 scripts `.cjs` independientes, sin dependencias npm — solo módulos core de Node.js (`fs`, `path`, `child_process`, `readline`) y binarios del sistema.

**Patrón compartido en todos los scripts:**
- Carga de entorno: bloque `loadEnvFile` idéntico al inicio — lee `.env` y luego `.env.local` (`.env.local` sobreescribe).
- Input: argumento CLI (`process.argv[2]`) con fallback a variable de entorno. `split_video.cjs` solo acepta env.
- Salida: siempre en `output/` (gitignored).
- Errores: `console.error()` + `process.exit(1)`. `execSync` sin try/catch — falla ruidosamente.

**Por script:**
- `generate_resume.cjs` — recorre el árbol del proyecto (lista negra de dirs, whitelist de extensiones), emite un `.md` con secciones `<details>` por archivo. Acepta CLI arg o `PROJECT_PATH`.
- `split_markdown.cjs` — divide un `.md` grande por líneas usando stream, respeta bloques de código (no corta dentro de ` ``` `), corta en líneas vacías o headings. Acepta CLI args o defaults a `output/RESUME.md`.
- `split_video.cjs` — lee duración con ffmpeg, calcula segmentos iguales, corta con `-c copy`. Lee `VIDEO_PATH`.
- `download_video.cjs` — verifica presencia de `yt-dlp`, descarga con formato `bestvideo[height<=720]+bestaudio/best[height<=720]`. Lee `DOWNLOAD_URL`.

## Configuración (`.env.local`)

```
PROJECT_PATH=/ruta/absoluta/al/proyecto
VIDEO_PATH=/ruta/absoluta/al/video.mp4
DOWNLOAD_URL=https://youtube.com/watch?v=...
```

Ver `.env.example` como referencia. `.env.local` nunca se sube al repo.

## Agregar un nuevo script

1. Copiar el bloque `loadEnvFile` exacto de cualquier script existente.
2. Leer input por argumento CLI primero, env var como fallback.
3. Validar existencia antes de proceder (`fs.existsSync` + `process.exit(1)`).
4. Escribir salida en `output/`.
5. Agregar el script en `package.json` y la variable en `.env.example`.
