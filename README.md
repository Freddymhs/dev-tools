# dev-tools

Scripts de línea de comandos para automatizar tareas de desarrollo: exportar código fuente, dividir archivos grandes, descargar y cortar videos, transcribir audio.

## Tech Stack

- **Runtime**: Node.js (scripts `.cjs`, módulos core — sin dependencias npm)
- **Binarios del sistema**: `ffmpeg` (split-video), `yt-dlp` (download), `whisper` (transcript)

## Setup

```bash
cp .env.example .env.local
# Editar .env.local con las rutas necesarias
```

Los scripts individuales no requieren dependencias externas. El TUI (`npm run tui`) usa `prompts` — ejecutar `npm install` antes de usarlo.

## TUI interactivo

```bash
npm run tui               # menú interactivo que orquesta todas las operaciones
```

## Análisis de código

```bash
npm run generate          # genera ~/Documents/dev-tools/code/1_raw/BUNDLE.md con el código fuente de PROJECT_PATH
npm run split             # divide BUNDLE.md en partes de 10k líneas → ~/Documents/dev-tools/code/2_parts/
npm run generate-splited  # generate + split + elimina BUNDLE.md intermedio
```

## Análisis multimedia

```bash
npm run download           # descarga DOWNLOAD_URL → ~/Documents/dev-tools/media/1_downloads/
npm run split-video        # divide el video en segmentos de 25 min → ~/Documents/dev-tools/media/2_parts/
npm run transcript         # transcribe las partes → ~/Documents/dev-tools/media/3_transcripts/
npm run download-splitted  # download + split-video + transcript en cascada
```

## Variables de entorno (`.env.local`)

Solo config "set once". Los inputs por-corrida (`PROJECT_PATH`, `DOWNLOAD_URL`, `VIDEO_PATH`) se pasan como argumento CLI o los pide el TUI — nunca van en `.env.local`.

| Variable | Descripción |
|---|---|
| `WHISPER_MODEL` | Modelo de transcripción: `tiny`, `base`, `small`, `medium`, `large-v3`, `large-v3-turbo`, `*.en` (default: `small`) |
| `WHISPER_BIN` | Binario de transcripción (default: `whisper`) — permite otro motor compatible |
| `DEV_TOOLS_OUTPUT_BASE` | Base de outputs (default: `~/Documents/dev-tools`) |

## Estructura de outputs

```
~/Documents/dev-tools/
├── code/
│   ├── 1_raw/          ← BUNDLE.md (eliminado en generate-splited)
│   └── 2_parts/        ← BUNDLE_part01.md, BUNDLE_part02.md ...
└── media/
    ├── 1_downloads/    ← video descargado
    ├── 2_parts/        ← video_parte1.mp4, video_parte2.mp4 ...
    └── 3_transcripts/  ← video_parte1.txt, video_parte2.txt ...
```

## Estado

- Status: Estable
