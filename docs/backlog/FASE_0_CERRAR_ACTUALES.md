# FASE 0: Cerrar cambios actuales

**Status**: 🔄 EN PROGRESO
**Prioridad**: Alta
**Dependencias**: ninguna

## Contexto

Los cambios ya están implementados y funcionando (restructura de outputs, nuevo `transcript_video.cjs`, cascada multimedia). Solo falta stagearlos y commitearlos para cerrar esta etapa antes de arrancar la TUI.

## Orden de ejecución

1. Tarea 0.A — stagear archivos (base para el commit)
2. Tarea 0.B — fix `padStart` (pequeño fix antes del commit)
3. Tarea 0.C — commitear

## Tareas

### Tarea 0.A: Stagear todos los cambios actuales

- Archivos: todos los modificados + `transcript_video.cjs` (untracked)
- Qué hacer:
  ```bash
  git add transcript_video.cjs .env.example CLAUDE.md README.md \
          download_video.cjs generate_resume.cjs package.json \
          split_markdown.cjs split_video.cjs
  ```

### Tarea 0.B: Fix padStart en split_video.cjs ✅

- Archivo: `split_video.cjs:66`
- Qué hacer: ya corregido — `padStart(2, "00")` → `padStart(2, "0")`
- Stagear si no estaba incluido en 0.A

### Tarea 0.C: Commitear

- Mensaje sugerido: `feat: add transcript script, restructure output dirs, cascade pipeline`

## Criterios de Aceptación

- [ ] `git status` muestra árbol limpio
- [ ] `npm run generate` genera en `output/code/1_raw/`
- [ ] `npm run split` genera en `output/code/2_parts/`
- [ ] `npm run download` descarga en `output/media/1_downloads/` y escribe `.last_video`
- [ ] `npm run split-video` lee `.last_video` si no hay `VIDEO_PATH` en env
- [ ] `npm run transcript` transcribe los archivos en `output/media/2_parts/`
