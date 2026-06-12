# FASE 4: Transcripción — Adapters intercambiables (Open/Closed)

**Status**: 📋 Backlog
**Prioridad**: Baja
**Dependencias**: FASE_3

## Contexto

Hoy `transcript_video.cjs` solo soporta motores "whisper-compatibles" (acepta `--model`, `--output_format`, `--output_dir`) vía `WHISPER_BIN`. Para integrar motores con interfaz distinta (ej. Ollama, que usa `ollama run <modelo>` sin esos flags) hace falta un punto de extensión que no implique tocar `transcript_video.cjs` cada vez.

Se aplica **Strategy + Adapter + Registry**: `transcript_video.cjs` queda fijo, habla contra una interfaz común (`checkAvailable()`, `transcribe(inputFile, model, outputDir)`), y cada motor concreto vive en su propio adapter bajo `lib/transcribers/`.

No es bloqueante — `WHISPER_BIN` actual sigue funcionando para motores whisper-compatibles. Esta fase es para cuando se quiera integrar un motor con interfaz realmente distinta (Ollama u otro).

## Tareas

### Tarea 4.A: Crear `lib/transcribers/` con interfaz común + registry

- Archivos: `lib/transcribers/index.cjs` (nuevo), `lib/transcribers/whisper.cjs` (nuevo)
- Qué hacer:
  - Definir contrato: `{ checkAvailable(), transcribe({ inputFile, model, outputDir }) }`
  - `lib/transcribers/whisper.cjs` — mover ahí la lógica actual de `transcript_video.cjs` (check de `WHISPER_BIN`, comando `whisper ... --model --output_format --output_dir`)
  - `lib/transcribers/index.cjs` — `selectEngine(name)` mapea `"whisper"` → adapter; default `"whisper"` si `TRANSCRIBER_ENGINE` no está definido
- Resultado: `transcript_video.cjs` pasa a ser un loop que itera `parts` y llama `engine.transcribe(...)`, sin saber de flags de whisper

### Tarea 4.B: Nueva env var `TRANSCRIBER_ENGINE`

- Archivo: `.env.example` (documentar), `CLAUDE.md` (sección Configuración)
- Qué hacer: agregar `TRANSCRIBER_ENGINE=whisper` (default, opcional) junto a `WHISPER_MODEL`/`WHISPER_BIN`
- Resultado: usuario puede seleccionar motor sin tocar código

### Tarea 4.C: Adapter Ollama (cuando se necesite — no bloqueante)

- Archivo: `lib/transcribers/ollama.cjs` (nuevo)
- Qué hacer:
  - Implementar el mismo contrato (`checkAvailable`, `transcribe`)
  - Ollama no tiene `--output_dir` ni `--output_format`: el adapter ejecuta `ollama run <modelo>` capturando stdout y escribe el `.txt` en `outputDir` él mismo
  - Registrar en `selectEngine()`
- Resultado: `TRANSCRIBER_ENGINE=ollama` + `OLLAMA_MODEL=<modelo>` en `.env.local` activa el nuevo motor sin tocar `transcript_video.cjs` ni los adapters existentes

## Criterios de Aceptación

- [ ] `transcript_video.cjs` no contiene lógica específica de whisper (vive en `lib/transcribers/whisper.cjs`)
- [ ] Tests existentes de `transcript_video.cjs` (whisper, `WHISPER_BIN`, audio `.m4a`) siguen pasando sin cambios de comportamiento
- [ ] Agregar un motor nuevo = 1 archivo en `lib/transcribers/` + 1 línea en `selectEngine()`, sin tocar `transcript_video.cjs`
