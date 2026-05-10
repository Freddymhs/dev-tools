# DECISION: Dependencia para menús de TUI

**Status**: ✅ DECIDIDO — Opción A (`prompts`)
**Impacto**: implementación de `lib/menu.cjs`

## Opciones

### Opción A: `prompts` (recomendada)

```bash
npm install prompts  # agrega 3 paquetes: prompts + kleur + sisteransi
```

| Pros | Contras |
|------|---------|
| Menú con flechas (↑↓ + Enter) sin boilerplate | Rompe la filosofía "0 deps npm" |
| API async/await simple | 3 entradas en node_modules |
| CommonJS nativo (funciona en .cjs directo) | Requiere node_modules en .gitignore |
| kleur y sisteransi son zero-dependency | |
| ~214 KB total instalado | |

```javascript
const { select, text } = require('prompts');

const categoria = await select({
  message: 'Seleccionar categoría',
  choices: [
    { title: 'Análisis de código', value: 'code' },
    { title: 'Análisis multimedia', value: 'media' },
    { title: 'Salir', value: 'exit' },
  ]
});
```

### Opción B: `readline` puro (0 deps)

Sin `npm install`. Usa solo Node.js core.

| Pros | Contras |
|------|---------|
| Mantiene la filosofía 0 deps | ~120 líneas de boilerplate para el renderer |
| Sin node_modules | Menú con números (1/2/3) en vez de flechas |
| | Hay que manejar raw mode + ANSI codes manualmente |
| | Más código interno a mantener |

```javascript
// Menú basado en números
console.log('1. Análisis de código');
console.log('2. Análisis multimedia');
console.log('0. Salir');
// readline.question() para leer la opción
```

## Decisión

> **[x] Opción A — prompts**
> **[ ] Opción B — readline puro**
>
> Fecha: 2026-05-10
> Razón: UX con flechas ↑↓ notoriamente mejor que menú numérico. 3 paquetes pequeños sin deps transitivas propias — costo mínimo por ganancia real de usabilidad.

## Consecuencias si se elige A

- Ejecutar `npm install prompts`
- Agregar `node_modules/` al `.gitignore`
- Agregar `"prompts": "^2.4.2"` en `dependencies` de `package.json`

## Consecuencias si se elige B

- Crear `lib/menu-renderer.cjs` (~120 líneas) con el mini-renderer de listas
- `lib/menu.cjs` usa el renderer interno en lugar de `prompts`
- Mismo contrato de exports — `tui.cjs` no cambia
