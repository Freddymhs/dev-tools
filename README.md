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

No requiere `npm install` — no hay dependencias externas.

## Análisis de código

```bash
npm run generate          # genera output/code/1_raw/RESUME.md con el código fuente de PROJECT_PATH
npm run split             # divide RESUME.md en partes de 10k líneas → output/code/2_parts/
npm run generate-splited  # generate + split + elimina RESUME.md intermedio
```

## Análisis multimedia

```bash
npm run download           # descarga DOWNLOAD_URL → output/media/1_downloads/
npm run split-video        # divide el video en segmentos de 25 min → output/media/2_parts/
npm run transcript         # transcribe las partes → output/media/3_transcripts/
npm run download-splitted  # download + split-video + transcript en cascada
```

## Variables de entorno (`.env.local`)

| Variable | Descripción |
|---|---|
| `PROJECT_PATH` | Ruta absoluta al proyecto a exportar |
| `VIDEO_PATH` | Ruta al video a dividir (opcional si se usó `download`) |
| `DOWNLOAD_URL` | URL de YouTube/TikTok/Instagram a descargar |
| `WHISPER_MODEL` | Modelo de transcripción: `tiny`, `base`, `small`, `medium`, `large` (default: `tiny`) |

## Estructura de outputs

```
output/
├── code/
│   ├── 1_raw/          ← RESUME.md (eliminado en generate-splited)
│   └── 2_parts/        ← RESUME_part01.md, RESUME_part02.md ...
└── media/
    ├── 1_downloads/    ← video descargado
    ├── 2_parts/        ← video_parte1.mp4, video_parte2.mp4 ...
    └── 3_transcripts/  ← video_parte1.txt, video_parte2.txt ...
```

## Estado

- Status: Estable
