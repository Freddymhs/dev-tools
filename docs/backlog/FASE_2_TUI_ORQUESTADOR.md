# FASE 2: TUI — Orquestador

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: FASE_1

## Contexto

Crear `tui.cjs` como punto de entrada que conecta los tres módulos de `lib/`. Definir el mapa estático de operaciones (qué script ejecuta cada opción, qué variables requiere). Actualizar `package.json` y documentación.

## Orden de ejecución

1. Tarea 2.A — `tui.cjs` (necesita lib/ completo de FASE_1)
2. Tarea 2.B — `package.json` (depende de 2.A)
3. Tarea 2.C — `.gitignore` (independiente, pero conveniente hacerla junto a 2.B)
4. Tarea 2.D — actualizar docs (última, cuando todo funciona)

## Tareas

### Tarea 2.A: Crear tui.cjs

- Archivo: `tui.cjs` (crear)
- Qué hacer:

  **Mapa de operaciones (constante al inicio del archivo):**

  | Categoría | Opción | Script | Variables requeridas |
  |-----------|--------|--------|----------------------|
  | Código | Generar resume | `generate_resume.cjs` | `PROJECT_PATH` |
  | Código | Generar + dividir | generate → split en serie | `PROJECT_PATH` |
  | Código | Solo dividir | `split_markdown.cjs` | ninguna |
  | Multimedia | Descargar video | `download_video.cjs` | `DOWNLOAD_URL` |
  | Multimedia | Dividir video | `split_video.cjs` | `VIDEO_PATH` (opcional si hay `.last_video`) |
  | Multimedia | Transcribir | `transcript_video.cjs` | ninguna (tiene default) |
  | Multimedia | Pipeline completo | download → split-video → transcript | `DOWNLOAD_URL` |

  **Flujo principal (loop):**
  ```
  loadEnv()
  loop:
    categoria = mainMenu()
    if (categoria === 'Salir') break
    operacion = submenu(categoria)
    if (operacion === 'Volver') continue
    faltantes = listMissing(operacion.requiredVars)
    for (key of faltantes):
      val = askVar(key, label, getVar(key))
      setVar(key, val)
    exitCode = await run(operacion.script)  // o serie de scripts
    mostrar resultado (✅ / ❌ con exit code)
    preguntar: "Volver al menú | Salir"
  ```

  **Manejo de Ctrl+C:**
  ```javascript
  process.on('SIGINT', () => {
    console.log('\n\nHasta luego.');
    process.exit(0);
  });
  ```

  **TTY check al inicio:**
  ```javascript
  if (!process.stdin.isTTY) {
    console.error('dev-tools TUI requiere una terminal interactiva.');
    process.exit(1);
  }
  ```

### Tarea 2.B: Actualizar package.json

- Archivo: `package.json` (modificar)
- Qué hacer:
  - Agregar `"tui": "node tui.cjs"` en `scripts`
  - Si se eligió `prompts` en FASE_1: agregar `"dependencies": { "prompts": "^2.4.2" }`

### Tarea 2.C: Actualizar .gitignore

- Archivo: `.gitignore` (modificar)
- Qué hacer: agregar `node_modules/` si se instaló `prompts`

### Tarea 2.D: Actualizar CLAUDE.md y README.md

- Archivos: `CLAUDE.md`, `README.md` (modificar)
- Qué hacer:
  - Agregar sección TUI con descripción del flujo y `npm run tui`
  - Documentar `lib/` y su estructura
  - Actualizar conteo de scripts (de 5 a 6: los 5 existentes + `tui.cjs`)

## Criterios de Aceptación

- [ ] `npm run tui` abre el menú principal
- [ ] Seleccionar "Generar resume" sin `PROJECT_PATH` → pregunta la ruta, la persiste y ejecuta
- [ ] Segunda ejecución de la misma operación → fluye sin preguntar (valor ya en `.env.local`)
- [ ] Ctrl+C en el menú → salida limpia sin stack trace
- [ ] Ctrl+C durante un script → el script muere, el TUI recupera el control
- [ ] Sin TTY (pipe/CI) → mensaje de error claro y exit 1
- [ ] Pipeline completo descarga, divide y transcribe en secuencia con feedback entre pasos
