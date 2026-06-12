# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Análisis de código
```bash
npm run generate          # genera ~/Documents/dev-tools/code/1_raw/BUNDLE.md con el código fuente de PROJECT_PATH
npm run split             # divide BUNDLE.md en partes de 10k líneas → ~/Documents/dev-tools/code/2_parts/
npm run generate-splited  # generate + split + elimina BUNDLE.md intermedio
```

### Análisis multimedia
```bash
npm run download           # descarga DOWNLOAD_URL → ~/Documents/dev-tools/media/1_downloads/ + guarda .last_video; si DOWNLOAD_URL es ruta local, la registra directamente sin descargar
npm run split-video        # divide video en segmentos de 25 min → ~/Documents/dev-tools/media/2_parts/
npm run transcript         # transcribe partes → ~/Documents/dev-tools/media/3_transcripts/ (requiere whisper)
npm run download-splitted  # download + split-video + transcript en cascada
```

### TUI interactiva
```bash
npm run tui   # menú interactivo con flechas — punto de entrada recomendado
```

### Tests
```bash
npm test               # 35 tests: unit + integration
npm run test:unit      # solo unit (lib/env, lib/paths)
npm run test:integration  # solo integration (scripts + pipeline)
npm run test:setup     # genera fixtures de video con ffmpeg (correr una vez)
```

## Arquitectura

5 scripts `.cjs` independientes + TUI (`tui.cjs`). Una dependencia npm: `prompts` (menús interactivos). Resto: módulos core de Node.js (`fs`, `path`, `child_process`, `readline`) y binarios del sistema.

**TUI (`tui.cjs` + `lib/`):**
- `tui.cjs` — orquestador: menú → operación → pide variables `alwaysAsk` (siempre, ej: `DOWNLOAD_URL`, `PROJECT_PATH`) → las pasa como env var directo al proceso hijo (spawn), sin persistir en disco → ejecuta scripts.
- `lib/env.cjs` — `loadEnv` (lee `.env` y `.env.local` hacia `process.env`). Solo config "set once" (`WHISPER_MODEL`, `WHISPER_BIN`, `DEV_TOOLS_OUTPUT_BASE`); valores por-corrida ya no pasan por aquí.
- `lib/runner.cjs` — `run(script, extraEnv)`: spawn subprocess con `stdio:inherit` y `env: {...process.env, ...extraEnv}`, devuelve Promise<exitCode>.
- `lib/menu.cjs` — `mainMenu`, `submenu`, `askVar` sobre `prompts`.

**Patrón compartido en todos los scripts:**
- Carga de entorno: `const { loadEnv } = require('./lib/env.cjs'); loadEnv();` ANTES de requerir `lib/paths.cjs` — así `DEV_TOOLS_OUTPUT_BASE` definido en `.env.local` aplica (paths.cjs exporta getters que leen `process.env` en el momento de acceso, no al `require`).
- Rutas de output: `const { ... } = require('./lib/paths.cjs');` — base en `~/Documents/dev-tools/` (override via `DEV_TOOLS_OUTPUT_BASE`), exporta `CODE_RAW`, `CODE_PARTS`, `MEDIA_DOWNLOADS`, `MEDIA_PARTS`, `MEDIA_TRANSCRIPTS`, `LAST_VIDEO`.
- Inputs por-corrida (`PROJECT_PATH`, `DOWNLOAD_URL`, `VIDEO_PATH`): CLI arg primero, env var (pasada por el TUI al spawn) como fallback. Nunca se leen/escriben en `.env.local`.
- Errores: `console.error()` + `process.exit(1)`. `execSync` sin try/catch — falla ruidosamente.
- Prohibido hardcodear rutas de output en scripts de `package.json` — resolverlas via `lib/paths.cjs` (ej: `node -e` con `CODE_RAW`); la base es configurable via `DEV_TOOLS_OUTPUT_BASE`.

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
Rutas centralizadas en `lib/paths.cjs`. Comportamiento por script: `split_markdown`, `split_video` y `transcript` limpian su directorio de salida antes de escribir (sin acumulación entre runs). `download` acumula en `1_downloads/` cuando `DOWNLOAD_URL` es una URL (yt-dlp cachea por nombre de archivo); si es ruta local, no copia el archivo. `generate` sobreescribe `BUNDLE.md` directamente.

**Cascada multimedia:** `download` guarda la ruta del archivo (video o audio) descargado/registrado en `~/Documents/dev-tools/media/.last_video`. `split-video` lee CLI arg, o `VIDEO_PATH` del env, o cae a `.last_video` si ninguno está definido.

**Extensiones soportadas:** `lib/media.cjs` exporta `MEDIA_EXTENSIONS`, el set centralizado de extensiones de video (`.mp4`, `.webm`, `.mkv`, `.avi`, `.mov`, `.m4v`) y audio (`.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg`, `.aac`, `.opus`) usado por `split_video.cjs` (limpieza de `2_parts/`) y `transcript_video.cjs` (filtro de archivos a transcribir). Whisper transcribe audio igual que video, sin pasos extra.

**Por script:**
- `generate_bundle.cjs` — recorre el árbol del proyecto (lista negra de dirs, whitelist de extensiones), emite un `.md` con secciones `<details>` por archivo. Acepta CLI arg o `PROJECT_PATH`. Falla con exit 1 si el directorio no existe. Salida: `~/Documents/dev-tools/code/1_raw/BUNDLE.md`.
- `split_markdown.cjs` — divide un `.md` grande por líneas usando stream, respeta bloques de código. Limpia `2_parts/` antes de escribir. Sin args: lee `~/Documents/dev-tools/code/1_raw/BUNDLE.md` y escribe en `~/Documents/dev-tools/code/2_parts/`. Con args: comportamiento legacy (escribe junto al input).
- `split_video.cjs` — lee duración con ffmpeg, calcula segmentos iguales, corta con `-c copy`. Limpia `2_parts/` antes de escribir (vía `MEDIA_EXTENSIONS`). Video/audio corto (≤ umbral): copia como parte única. Lee CLI arg, `VIDEO_PATH` o `.last_video`. Umbral configurable via `DEV_TOOLS_SPLIT_SECONDS`. Salida: `~/Documents/dev-tools/media/2_parts/`.
- `download_video.cjs` — dual behavior según CLI arg/`DOWNLOAD_URL`: si es URL (`http://`/`https://`), verifica `yt-dlp` y descarga en 720p en `1_downloads/`; si es ruta local (video o audio), verifica que el archivo exista y lo registra directamente. En ambos casos persiste la ruta en `.last_video`.
- `transcript_video.cjs` — verifica el binario `WHISPER_BIN` (default `whisper`), escanea `~/Documents/dev-tools/media/2_parts/` por archivos de video o audio (vía `MEDIA_EXTENSIONS`), limpia `3_transcripts/` antes de transcribir. Lee `WHISPER_MODEL` (default `small`). Salida: `~/Documents/dev-tools/media/3_transcripts/`.

## Configuración (`.env.local`)

Solo config "set once", reusada entre corridas — NUNCA inputs por-corrida (esos los pide el TUI):

```
WHISPER_MODEL=small              # identificador completo de modelo whisper: tiny | base | small | medium | large-v3 | large-v3-turbo | *.en
WHISPER_BIN=whisper               # opcional, default whisper. Cambiar para usar otro motor de transcripción
                                  # (faster-whisper, whisper.cpp, etc.) compatible con --model/--output_format/--output_dir
DEV_TOOLS_OUTPUT_BASE=/ruta       # opcional, default ~/Documents/dev-tools
```

Ver `.env.example` como referencia. `.env.local` nunca se sube al repo.

## Tests

Al agregar un branch condicional nuevo en un script que ya tiene tests de integración, agregar tests para ese branch en el mismo cambio — no dejarlo como deuda pendiente.

## Agregar un nuevo script

1. Importar `const { loadEnv } = require('./lib/env.cjs');` y llamar `loadEnv()` al inicio, ANTES de requerir `./lib/paths.cjs` — no copiar el bloque manualmente.
2. Leer input por argumento CLI primero, env var como fallback.
3. Validar existencia antes de proceder (`fs.existsSync` + `process.exit(1)`).
4. Escribir salida en la subcarpeta correspondiente de `~/Documents/dev-tools/` (usar constante de `lib/paths.cjs`). Limpiar el directorio de salida antes de escribir si aplica (patrón de `split_video`, `split_markdown`, `transcript_video`).
5. Agregar el script en `package.json`. Si agrega config "set once" nueva, documentarla en `.env.example`.
