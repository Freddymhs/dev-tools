# Concepto Inicial del Proyecto

> Documento de origen — no editar. Refleja la idea original con la que se generó el backlog.
> Fecha: 2026-05-09

---

dev-tools es un conjunto de scripts CLI en Node.js (sin dependencias npm) para automatizar tareas de desarrollo: exportar código fuente como markdown, dividir archivos grandes, descargar videos, cortarlos en segmentos y transcribirlos.

**Pain point identificado:** el usuario tiene que editar `.env.local` manualmente antes de cada uso. No hay menú unificado — hay que recordar qué comando ejecutar para cada operación.

**Idea:** convertir el proyecto en una TUI (Terminal User Interface) que ofrezca:
- Menú principal con dos categorías: Análisis de código / Análisis multimedia
- Submenús por categoría con todas las operaciones disponibles
- Si falta una variable de entorno requerida → preguntarla interactivamente en lugar de fallar con error
- Persistir lo que el usuario ingresa en `.env.local` para que la próxima vez fluya sin interrupciones
- Los 5 scripts existentes **no se modifican** — siguen funcionando standalone vía `node script.cjs`
- Mantener la filosofía del proyecto: zero o mínimas dependencias npm, solo Node.js core

**Decisión pendiente al momento de crear el backlog:** elegir entre `prompts` (dep liviana, UX con flechas) o `readline` puro (0 deps, +120 líneas de boilerplate). Ver `docs/decisions/DECISION_TUI_DEPS.md`.
