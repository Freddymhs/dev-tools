# FASE 3: TUI — Polish

**Status**: ✅ COMPLETADA
**Prioridad**: Media
**Dependencias**: FASE_2

## Contexto

Mejoras de UX y robustez una vez que el TUI core funciona. Ninguna es bloqueante para el uso diario — la TUI de FASE_2 ya es funcional. Esta fase se puede ejecutar por partes o en su totalidad según necesidad.

## Tareas

### Tarea 3.A: Hint de valor actual al pedir variables

- Archivo: `lib/menu.cjs` (modificar)
- Qué hacer: cuando `askVar` recibe un `currentValue`, mostrarlo como prefijo en el prompt
  - Con `prompts`: usar `initial: currentValue` en el `text()` — el usuario puede editarlo o hacer Enter para mantener
  - Con `readline` puro: mostrar `[actual: /ruta/actual]` antes del input, si el usuario escribe solo Enter → conservar el valor previo
- Resultado: en segunda ejecución el usuario ve su configuración anterior y puede cambiarla sin reescribir desde cero

### Tarea 3.B: Refactor lazy — scripts usan lib/env.cjs

- Archivos: los 5 scripts `.cjs` (modificar opcionalmente)
- Qué hacer: reemplazar el bloque `loadEnvFile` duplicado en cada script por:
  ```javascript
  const { loadEnv } = require('./lib/env.cjs');
  loadEnv();
  ```
- Hacer script por script, verificar que cada uno sigue funcionando standalone después del cambio
- Por qué es opcional: los scripts funcionan igual con el bloque duplicado; el beneficio es solo DRY
- Prioridad: baja — solo si el bloque `loadEnvFile` necesita cambios futuros

### Tarea 3.C: Separador visual entre steps del pipeline

- Archivo: `tui.cjs` (modificar)
- Qué hacer: entre cada script del pipeline (download → split → transcript), mostrar:
  ```
  ────────────────────────────────
  ✅ Descarga completada
  ▶  Iniciando división de video...
  ────────────────────────────────
  ```
- Resultado: el usuario sabe en qué paso está sin perderse entre el output de ffmpeg/yt-dlp/whisper

## Criterios de Aceptación

- [x] Segunda ejecución de "Generar resume" muestra `[actual: /ruta/anterior]` y acepta Enter sin reescribir
- [x] Los 5 scripts siguen funcionando con `node script.cjs` después del refactor (si se hace 3.B)
- [x] Pipeline completo muestra separadores claros entre cada etapa
