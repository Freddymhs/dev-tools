# Backlog — dev-tools

## Fases

| Fase | Nombre | Status | Tareas |
|------|--------|--------|--------|
| [FASE_0](FASE_0_CERRAR_ACTUALES.md) | Cerrar cambios actuales | ✅ COMPLETADA | 3 |
| [FASE_1](FASE_1_TUI_INFRA.md) | TUI — Infraestructura | ✅ COMPLETADA | 4 |
| [FASE_2](FASE_2_TUI_ORQUESTADOR.md) | TUI — Orquestador | ✅ COMPLETADA | 4 |
| [FASE_3](FASE_3_TUI_POLISH.md) | TUI — Polish | ✅ COMPLETADA | 3 |
| [FASE_4](FASE_4_TRANSCRIBER_ADAPTERS.md) | Transcripción — Adapters intercambiables | 📋 Backlog | 3 |

## Diagramas de Referencia

| Archivo | Tipo | Contenido |
|---------|------|-----------|
| [`../diagrams/DIAGRAMAS_COMPONENTES.md`](../diagrams/DIAGRAMAS_COMPONENTES.md) | Flowcharts | Topología del sistema (actual y objetivo) |

Referencia estructural estable. Las fases la referencian pero no la repiten. Actualizar solo ante cambios de topología.

## Decisiones Técnicas

Carpeta [`../decisions/`](../decisions/) — documentar aquí decisiones arquitectónicas cuando surjan.
Formato: `DECISION_[TEMA].md` — explica el POR QUÉ, no el QUÉ.

| Archivo | Tema | Status |
|---------|------|--------|
| [`../decisions/DECISION_TUI_DEPS.md`](../decisions/DECISION_TUI_DEPS.md) | prompts vs readline puro | ✅ Opción A (`prompts`) |
