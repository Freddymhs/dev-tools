# Diagramas de Componentes

Propósito: mapa estable del sistema. Actualizar solo si cambia topología (agregar/quitar scripts o cambiar flujo de datos).

---

## Sistema actual (sin TUI)

```mermaid
flowchart LR
    User([Usuario])

    subgraph scripts["Scripts independientes"]
        GEN[generate_resume.cjs]
        SPLIT_MD[split_markdown.cjs]
        DL[download_video.cjs]
        SPLIT_VID[split_video.cjs]
        TR[transcript_video.cjs]
    end

    subgraph ext["Binarios del sistema"]
        FFMPEG[ffmpeg]
        YTDLP[yt-dlp]
        WHISPER[whisper]
    end

    subgraph output["output/"]
        CODE_RAW[code/1_raw/RESUME.md]
        CODE_PARTS[code/2_parts/]
        MEDIA_DL[media/1_downloads/]
        MEDIA_PARTS[media/2_parts/]
        MEDIA_TR[media/3_transcripts/]
        LAST_VIDEO[media/.last_video]
    end

    ENV[.env.local]

    User -->|npm run generate| GEN
    User -->|npm run split| SPLIT_MD
    User -->|npm run download| DL
    User -->|npm run split-video| SPLIT_VID
    User -->|npm run transcript| TR

    ENV -->|PROJECT_PATH| GEN
    ENV -->|DOWNLOAD_URL| DL
    ENV -->|VIDEO_PATH| SPLIT_VID
    ENV -->|WHISPER_MODEL| TR

    GEN --> CODE_RAW
    SPLIT_MD --> CODE_PARTS
    CODE_RAW -->|input| SPLIT_MD

    DL --> YTDLP
    DL --> MEDIA_DL
    DL --> LAST_VIDEO

    SPLIT_VID --> FFMPEG
    SPLIT_VID --> MEDIA_PARTS
    LAST_VIDEO -->|fallback si no hay VIDEO_PATH| SPLIT_VID

    TR --> WHISPER
    MEDIA_PARTS -->|input| TR
    TR --> MEDIA_TR
```

---

## Sistema objetivo (con TUI — FASE 1-2)

```mermaid
flowchart TB
    User([Usuario])

    subgraph tui["TUI — tui.cjs"]
        MAIN[Menú principal]
        SUB[Submenús]
    end

    subgraph lib["lib/"]
        ENV_LIB[env.cjs\nloadEnv · getVar · setVar · listMissing]
        RUNNER[runner.cjs\nrun → spawn subprocess]
        MENU[menu.cjs\nmainMenu · submenu · askVar]
    end

    subgraph scripts["Scripts — sin cambios"]
        GEN[generate_resume.cjs]
        SPLIT_MD[split_markdown.cjs]
        DL[download_video.cjs]
        SPLIT_VID[split_video.cjs]
        TR[transcript_video.cjs]
    end

    subgraph output["output/"]
        CODE[code/1_raw · code/2_parts]
        MEDIA[media/1_downloads · 2_parts · 3_transcripts]
    end

    ENVFILE[.env.local]

    User --> tui
    MAIN --> MENU
    SUB --> MENU
    tui --> ENV_LIB
    tui --> RUNNER

    ENV_LIB <-->|read/write| ENVFILE
    RUNNER -->|spawn| scripts

    scripts --> CODE
    scripts --> MEDIA
```

---

## Flujo de datos — cascada multimedia

```mermaid
sequenceDiagram
    actor U as Usuario
    participant TUI as tui.cjs
    participant DL as download_video.cjs
    participant SV as split_video.cjs
    participant TR as transcript_video.cjs

    U->>TUI: Pipeline completo
    TUI->>TUI: verificar DOWNLOAD_URL (pedir si falta)
    TUI->>DL: spawn
    DL-->>TUI: exit 0 + escribe .last_video
    TUI->>SV: spawn
    SV->>SV: lee .last_video si no hay VIDEO_PATH
    SV-->>TUI: exit 0 + partes en media/2_parts/
    TUI->>TR: spawn
    TR-->>TUI: exit 0 + transcripts en media/3_transcripts/
    TUI->>U: ✅ Pipeline completado
```
