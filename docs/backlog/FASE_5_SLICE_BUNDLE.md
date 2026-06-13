# FASE 5: Bundle por slice — estudiar un fragmento y sus dependencias

**Status**: 📋 Backlog
**Prioridad**: Media
**Dependencias**: FASE_0 (generate_bundle), CodeGraph CLI instalado

## Contexto

Hoy `generate_bundle.cjs` es todo-o-nada: bundlea el proyecto entero. Para **estudiar código ajeno** sin agobio, el caso de uso real es el inverso: apuntar a una cosa concreta (una página, un modal, un botón) y obtener **solo su mundo** — ese archivo más el cierre transitivo de sus dependencias locales, abstrayendo lógica y tecnologías exclusivas de esa feature.

Resolver imports con regex propio es frágil justo donde duele: alias (`@feature/x` necesita parsear `tsconfig`/`vite`), imports dinámicos (no resolubles estáticamente), y multiplicado por ser agnóstico al lenguaje. Ese problema **ya está resuelto** por **CodeGraph** (tree-sitter, agnóstico, resuelve el grafo de símbolos/edges).

Decisión: dev-tools **no reinventa** resolución de imports. Usa el **CLI de CodeGraph** como binario del sistema — mismo patrón que `ffmpeg`/`yt-dlp`/`whisper`. Cero acople a SQLite, cero MCP client. CodeGraph es el motor de grafo; dev-tools junta los archivos del cierre y escribe un bundle enfocado.

Precondición (como yt-dlp/whisper): el repo target debe estar indexado (`codegraph index <path>`). El script lo detecta y avisa si falta.

## Tareas

### Tarea 5.A: Script `study_slice.cjs` — cierre transitivo vía CodeGraph CLI

- Archivos: `study_slice.cjs` (nuevo), `lib/codegraph.cjs` (nuevo — wrapper del CLI)
- Qué hacer:
  - `lib/codegraph.cjs`: helpers que shelean `codegraph <cmd> -j -p <repo>` y parsean JSON (`query`, `callees`, `files`). Verifica binario presente (`which codegraph`) y repo indexado (`codegraph status -j`) — falla ruidosa con instrucción si falta, patrón de `transcript_video.cjs`.
  - **Spike interno — resolver semilla**: la semilla la da el usuario como ruta de archivo (`src/components/PaymentModal.tsx`), pero CodeGraph opera sobre símbolos. Determinar cómo mapear archivo → símbolos definidos en él (¿`codegraph query` filtrado por path? ¿`codegraph files` + cruce?). Documentar el mecanismo elegido. Si la semilla es un nombre de símbolo, usar `query` directo.
  - BFS: desde el/los símbolo(s) semilla → `callees` transitivo → recolectar archivos únicos → cortar en `max-depth` (env `SLICE_MAX_DEPTH`, default razonable ej. 5).
- Resultado: lista deduplicada de archivos = el subgrafo alcanzable desde la semilla.

### Tarea 5.B: Frontera y escritura del bundle

- Archivo: `study_slice.cjs`, `lib/paths.cjs` (nueva constante `CODE_SLICE` si se separa del `1_raw`)
- Qué hacer:
  - Frontera: incluir solo archivos **dentro** del repo target. Dependencias externas (bare specifiers, node_modules) quedan fuera — CodeGraph no las indexa, así que caen solas; `max-depth` es la red secundaria.
  - Reusar el emisor de `generate_bundle.cjs` (secciones `<details>` por archivo) sobre la lista del cierre, no sobre el árbol completo. Extraer ese emisor a helper si evita duplicación (DRY).
  - Salida: `BUNDLE_slice.md` en `CODE_RAW` (o subcarpeta dedicada). Limpiar salida previa antes de escribir (patrón split_*).
- Resultado: `BUNDLE_slice.md` con solo semilla + cierre, listo para estudiar/pegar a IA.

### Tarea 5.C: Integración TUI + script en package.json

- Archivos: `tui.cjs`, `lib/menu.cjs`, `package.json`
- Qué hacer:
  - Submenú "code": entrada "Estudiar slice (semilla + dependencias)".
  - `alwaysAsk`: `SLICE_SEED` (ruta archivo o símbolo) y `PROJECT_PATH` (repo target). Pasados por `extraEnv` al spawn — nunca a `.env.local` (inputs por-corrida).
  - `package.json`: script `study` → `node study_slice.cjs`. Acepta CLI arg primero, env var fallback (patrón compartido).
- Resultado: `npm run study <semilla>` o vía TUI con flechas.

### Tarea 5.D: Tests de integración

- Archivos: `tests/integration/study-slice.test.cjs` (nuevo), fixture/mocks
- Qué hacer:
  - Mockear el binario `codegraph` (patrón `fake-whisper-alt` en `tests/helpers/bin/`): devuelve JSON fijo de `query`/`callees` para un mini-grafo conocido.
  - Casos: cierre correcto (semilla → N archivos esperados); `max-depth` corta; binario ausente → exit 1 con mensaje; repo no indexado → exit 1 con mensaje; semilla inexistente → manejo claro.
- Resultado: branch nuevo cubierto en el mismo cambio (regla del proyecto: branch nuevo + sus tests juntos).

### Tarea 5.E: Docs

- Archivos: `.env.example`, `CLAUDE.md`, `README.md`, `docs/diagrams/DIAGRAMAS_COMPONENTES.md`
- Qué hacer: documentar `SLICE_MAX_DEPTH` (set-once opcional), entrada del script nuevo en CLAUDE.md (sección "Por script"), comando en README, y agregar `study_slice.cjs` + dependencia de CodeGraph CLI a la topología del diagrama.

## Criterios de Aceptación

- [ ] `npm run study <semilla>` produce `BUNDLE_slice.md` con solo el archivo semilla + su cierre transitivo de dependencias locales
- [ ] Dependencias externas (framework, node_modules) NUNCA entran al slice
- [ ] dev-tools no contiene lógica de resolución de imports propia — el grafo lo resuelve el CLI de CodeGraph
- [ ] Falta de binario `codegraph` o repo sin indexar → falla con mensaje accionable, no stacktrace
- [ ] `max-depth` configurable acota la profundidad; default razonable evita traer medio repo
- [ ] Tests de integración cubren cierre, corte por profundidad y los modos de fallo
