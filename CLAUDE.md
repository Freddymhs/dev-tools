# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Análisis de código
```bash
npm run generate          # genera output/code/1_raw/RESUME.md con el código fuente de PROJECT_PATH
npm run split             # divide RESUME.md en partes de 10k líneas → output/code/2_parts/
npm run generate-splited  # generate + split + elimina RESUME.md intermedio
```

### Análisis multimedia
```bash
npm run download           # descarga DOWNLOAD_URL → output/media/1_downloads/ + guarda .last_video
npm run split-video        # divide video en segmentos de 25 min → output/media/2_parts/
npm run transcript         # transcribe partes → output/media/3_transcripts/ (requiere whisper)
npm run download-splitted  # download + split-video + transcript en cascada
```

### TUI interactiva
```bash
npm run tui   # menú interactivo con flechas — punto de entrada recomendado
```

Sin lint ni tests configurados.

## Arquitectura

5 scripts `.cjs` independientes + TUI (`tui.cjs`). Una dependencia npm: `prompts` (menús interactivos). Resto: módulos core de Node.js (`fs`, `path`, `child_process`, `readline`) y binarios del sistema.

**TUI (`tui.cjs` + `lib/`):**
- `tui.cjs` — orquestador: menú → operación → pide variables según `required` (si faltan) o `alwaysAsk` (siempre) → ejecuta scripts vía spawn.
- `lib/env.cjs` — `loadEnv`, `getVar`, `setVar` (persiste en `.env.local`), `listMissing`.
- `lib/runner.cjs` — `run(script)`: spawn subprocess con `stdio:inherit`, devuelve Promise<exitCode>.
- `lib/menu.cjs` — `mainMenu`, `submenu`, `askVar` sobre `prompts`. Variables en `required` se preguntan solo si faltan; en `alwaysAsk` se preguntan siempre (ej: `DOWNLOAD_URL`, `PROJECT_PATH`).

**Patrón compartido en todos los scripts:**
- Carga de entorno: `const { loadEnv } = require('./lib/env.cjs'); loadEnv();` al inicio — lee `.env` y luego `.env.local` (`.env.local` sobreescribe). La lógica centralizada vive en `lib/env.cjs`.
- Rutas de output: `const { ... } = require('./lib/paths.cjs');` — base en `~/Documents/dev-tools/`, exporta `CODE_RAW`, `CODE_PARTS`, `MEDIA_DOWNLOADS`, `MEDIA_PARTS`, `MEDIA_TRANSCRIPTS`, `LAST_VIDEO`.
- Errores: `console.error()` + `process.exit(1)`. `execSync` sin try/catch — falla ruidosamente.

**Estructura de outputs:**
```
~/Documents/dev-tools/
├── code/
│   ├── 1_raw/          ← generate
│   └── 2_parts/        ← split
└── media/
    ├── 1_downloads/    ← download
    ├── 2_parts/        ← split-video
    └── 3_transcripts/  ← transcript
```
Rutas centralizadas en `lib/paths.cjs`. Cada ejecución sobreescribe el contenido anterior.

**Cascada multimedia:** `download` guarda la ruta del video descargado en `~/Documents/dev-tools/media/.last_video`. `split-video` lee `VIDEO_PATH` del env o cae a `.last_video` si no está definido.

**Por script:**
- `generate_resume.cjs` — recorre el árbol del proyecto (lista negra de dirs, whitelist de extensiones), emite un `.md` con secciones `<details>` por archivo. Acepta CLI arg o `PROJECT_PATH`. Salida: `output/code/1_raw/RESUME.md`.
- `split_markdown.cjs` — divide un `.md` grande por líneas usando stream, respeta bloques de código. Sin args: lee `output/code/1_raw/RESUME.md` y escribe en `output/code/2_parts/`. Con args: comportamiento legacy (escribe junto al input).
- `split_video.cjs` — lee duración con ffmpeg, calcula segmentos iguales, corta con `-c copy`. Lee `VIDEO_PATH` o `.last_video`. Salida: `output/media/2_parts/`.
- `download_video.cjs` — verifica `yt-dlp`, descarga en 720p, guarda ruta en `output/media/.last_video`. Salida: `output/media/1_downloads/`.
- `transcript_video.cjs` — verifica `whisper`, escanea `output/media/2_parts/` por archivos de video, transcribe cada uno. Lee `WHISPER_MODEL` (default `tiny`). Salida: `output/media/3_transcripts/`.

## Configuración (`.env.local`)

```
PROJECT_PATH=/ruta/absoluta/al/proyecto
VIDEO_PATH=/ruta/absoluta/al/video.mp4   # opcional si se usó download
DOWNLOAD_URL=https://youtube.com/watch?v=...
WHISPER_MODEL=small                       # tiny | base | small | medium | large
```

Ver `.env.example` como referencia. `.env.local` nunca se sube al repo.

## Agregar un nuevo script

1. Importar `const { loadEnv } = require('./lib/env.cjs');` y llamar `loadEnv()` al inicio — no copiar el bloque manualmente.
2. Leer input por argumento CLI primero, env var como fallback.
3. Validar existencia antes de proceder (`fs.existsSync` + `process.exit(1)`).
4. Escribir salida en la subcarpeta correspondiente de `output/`.
5. Agregar el script en `package.json` y la variable en `.env.example`.
