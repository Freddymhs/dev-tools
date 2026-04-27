# dev-tools

Scripts de línea de comandos para automatizar tareas de desarrollo: exportar código fuente, dividir archivos grandes, descargar y cortar videos.

## Tech Stack

- **Runtime**: Node.js (scripts `.cjs`, módulos core — sin dependencias npm)
- **Binarios del sistema**: `ffmpeg` (split-video), `yt-dlp` (download)

## Setup

```bash
# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con las rutas necesarias
```

No requiere `npm install` — no hay dependencias externas.

## Comandos

```bash
npm run generate          # genera output/RESUME.md con el código fuente de PROJECT_PATH
npm run split             # divide output/RESUME.md en partes de 10k líneas
npm run generate-splited  # generate + split + elimina RESUME.md intermedio

npm run download          # descarga DOWNLOAD_URL a output/ en 720p (requiere yt-dlp)
npm run split-video       # divide VIDEO_PATH en segmentos de 25 min (requiere ffmpeg)
```

## Variables de entorno (`.env.local`)

| Variable | Descripción |
|---|---|
| `PROJECT_PATH` | Ruta absoluta al proyecto a exportar |
| `VIDEO_PATH` | Ruta absoluta al video a dividir |
| `DOWNLOAD_URL` | URL de YouTube/TikTok/Instagram a descargar |

Ver `.env.example` como referencia.

## Estructura

```
dev-tools/
├── generate_resume.cjs   # exporta árbol de archivos como .md
├── split_markdown.cjs    # divide .md en partes por líneas
├── split_video.cjs       # corta video en segmentos iguales
├── download_video.cjs    # descarga video en 720p
├── output/               # salida generada (gitignored)
└── .env.example          # template de variables
```

## Estado

- Status: Estable
