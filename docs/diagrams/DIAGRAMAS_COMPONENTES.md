# Diagramas de Componentes

Propósito: mapa estable del sistema. Actualizar solo si cambia topología (agregar/quitar scripts o cambiar flujo de datos).

---

## Sistema actual (sin TUI)

```mermaid
flowchart LR
    User([Usuario])

    subgraph scripts["Scripts independientes"]
        GEN[generate_bundle.cjs]
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

    subgraph output["~/Documents/dev-tools/"]
        CODE_RAW[code/1_raw/BUNDLE.md]
        CODE_PARTS[code/2_parts/]
        MEDIA_DL[media/1_downloads/]
        MEDIA_PARTS[media/2_parts/]
        MEDIA_TR[media/3_transcripts/]
        LAST_VIDEO[media/.last_video]
    end

    ENV[".env.local\n(set-once)"]
    INPUTS["CLI arg / env var\n(por-corrida)"]

    User -->|npm run generate| GEN
    User -->|npm run split| SPLIT_MD
    User -->|npm run download| DL
    User -->|npm run split-video| SPLIT_VID
    User -->|npm run transcript| TR

    INPUTS -->|PROJECT_PATH| GEN
    INPUTS -->|DOWNLOAD_URL| DL
    INPUTS -->|VIDEO_PATH| SPLIT_VID
    ENV -->|WHISPER_MODEL · WHISPER_BIN| TR

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

## Sistema objetivo (con TUI — FASE 1-3)

```mermaid
flowchart TB
    User([Usuario])

    subgraph tui["TUI — tui.cjs"]
        MAIN[Menú principal]
        SUB[Submenús]
        ASK[askAlways → extraEnv]
    end

    subgraph lib["lib/"]
        ENV_LIB[env.cjs\nloadEnv]
        RUNNER[runner.cjs\nrun(script, extraEnv) → spawn subprocess]
        MENU[menu.cjs\nmainMenu · submenu · askVar]
        MEDIA_LIB[media.cjs\nMEDIA_EXTENSIONS]
    end

    subgraph scripts["Scripts — sin cambios de uso standalone"]
        GEN[generate_bundle.cjs]
        SPLIT_MD[split_markdown.cjs]
        DL[download_video.cjs]
        SPLIT_VID[split_video.cjs]
        TR[transcript_video.cjs]
    end

    subgraph output["~/Documents/dev-tools/"]
        CODE[code/1_raw · code/2_parts]
        MEDIA[media/1_downloads · 2_parts · 3_transcripts]
    end

    ENVFILE[".env.local\n(set-once: WHISPER_MODEL, WHISPER_BIN, DEV_TOOLS_OUTPUT_BASE)"]

    User --> tui
    MAIN --> MENU
    SUB --> MENU
    tui --> ASK
    ASK -->|extraEnv: PROJECT_PATH/DOWNLOAD_URL| RUNNER

    RUNNER -->|spawn + extraEnv| scripts
    scripts -->|loadEnv| ENV_LIB
    ENV_LIB -->|read| ENVFILE
    scripts --> MEDIA_LIB

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
    TUI->>U: pedir DOWNLOAD_URL (siempre)
    TUI->>DL: spawn con DOWNLOAD_URL en extraEnv
    DL-->>TUI: exit 0 + escribe .last_video
    TUI->>SV: spawn
    SV->>SV: CLI arg → VIDEO_PATH env → .last_video
    SV-->>TUI: exit 0 + partes en media/2_parts/
    TUI->>TR: spawn
    TR-->>TUI: exit 0 + transcripts en media/3_transcripts/
    TUI->>U: ✅ Pipeline completado
```
