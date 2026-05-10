# FASE 1: TUI — Infraestructura

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: FASE_0

## Contexto

Crear los tres módulos internos de la TUI en `lib/`. Los scripts existentes no se tocan. Cada módulo tiene una sola responsabilidad y puede desarrollarse y probarse en aislamiento.

Ver topología objetivo en `docs/diagrams/DIAGRAMAS_COMPONENTES.md`.

## Orden de ejecución

> Las tareas 1.B, 1.C y 1.D son independientes entre sí pero requieren que la decisión de deps (1.A) esté tomada.

1. Tarea 1.A — decidir deps (determina la implementación de `lib/menu.cjs`)
2. Tarea 1.B — `lib/env.cjs`
3. Tarea 1.C — `lib/runner.cjs`
4. Tarea 1.D — `lib/menu.cjs`

## Tareas

### Tarea 1.A: Decidir dependencia — prompts vs readline puro

- Archivo: `docs/decisions/DECISION_TUI_DEPS.md` (completar)
- Qué hacer: el usuario elige una opción y se documenta el por qué
- Referencia: ver tabla comparativa en `docs/decisions/DECISION_TUI_DEPS.md`
- Si se elige `prompts`: ejecutar `npm install prompts` y agregar `node_modules` al `.gitignore`

### Tarea 1.B: Crear lib/env.cjs

- Archivo: `lib/env.cjs` (crear)
- Qué hacer:
  1. Extraer el bloque `loadEnvFile` que existe idéntico en los 5 scripts (no modificar los scripts)
  2. Exportar `loadEnv()` — carga `.env` y `.env.local`
  3. Exportar `getVar(key)` — lee `process.env[key]`
  4. Exportar `setVar(key, value)` — actualiza `process.env[key]` Y hace upsert en `.env.local`:
     - Leer `.env.local` como string
     - Reemplazar línea `^KEY=.*` si existe, o append al final si no
     - Preservar comentarios y demás variables intactas
  5. Exportar `listMissing(keys[])` — devuelve keys sin valor en `process.env`
- Referencia: bloque `loadEnvFile` en cualquiera de los 5 scripts existentes

### Tarea 1.C: Crear lib/runner.cjs

- Archivo: `lib/runner.cjs` (crear)
- Qué hacer:
  1. Exportar `run(scriptPath)` → `Promise<exitCode>`
  2. Usar `spawn('node', [scriptPath], { stdio: 'inherit', env: process.env })`
  3. Resolver la Promise con el exit code del subprocess (`child.on('close', ...)`)
  4. No usar `execSync` — necesitamos output streaming en tiempo real
- Por qué spawn y no require(): los scripts usan `process.exit(1)` que mataría el TUI padre

### Tarea 1.D: Crear lib/menu.cjs

- Archivo: `lib/menu.cjs` (crear)
- Qué hacer según decisión de 1.A:

  **Con `prompts`:**
  ```javascript
  // Exportar: mainMenu(), submenu(category), askVar(key, label, currentValue)
  // mainMenu() → select: "Análisis de código" | "Análisis multimedia" | "Salir"
  // submenu(cat) → select: operaciones de esa categoría
  // askVar() → text con hint del valor actual si existe
  ```

  **Con readline puro:**
  ```javascript
  // Implementar renderList(items, selectedIndex) con ANSI codes
  // process.stdin.setRawMode(true) + emitKeypressEvents
  // Manejar up/down/enter; limpiar con readline.clearLine
  // Mismo contrato de exports que con prompts
  ```

## Criterios de Aceptación

- [ ] `require('./lib/env.cjs').loadEnv()` carga `.env` y `.env.local` correctamente
- [ ] `setVar('KEY', 'val')` persiste en `.env.local` sin borrar otras variables ni comentarios
- [ ] `require('./lib/runner.cjs').run('./generate_resume.cjs')` ejecuta el script con output visible
- [ ] Si el script falla (exit 1), `run()` devuelve 1 sin matar el proceso padre
- [ ] `mainMenu()` muestra las dos categorías + opción Salir
- [ ] `askVar('PROJECT_PATH', 'Ruta al proyecto', '/actual')` muestra el valor actual como hint
