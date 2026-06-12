const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./lib/env.cjs');

loadEnv();

const { CODE_RAW } = require('./lib/paths.cjs');

// ══════════════════════════════════════════════════════════════
// Carpetas a ignorar (dependencias, builds, caches, VCS, etc.)
// ══════════════════════════════════════════════════════════════
const IGNORED_DIRS = new Set([
    // Universal
    '.git', '.svn', '.hg',
    '.idea', '.vscode', '.vs',
    '.DS_Store',

    // Node / JS / TS
    'node_modules', 'dist', 'build', '.next', '.nuxt', '.turbo', '.cache',

    // Python
    '.venv', 'venv', 'env', '__pycache__', '.pytest_cache', '.mypy_cache',
    '.tox', '.eggs', '*.egg-info',

    // Rust
    'target',

    // Java / Kotlin / Gradle / Maven
    '.gradle', '.mvn',

    // Go
    'vendor',

    // C / C++
    'bin', 'obj',

    // .NET
    'packages',

    // General
    'coverage', '.nyc_output', '.parcel-cache',
    'tmp', '.tmp',
]);

// ══════════════════════════════════════════════════════════════
// Extensiones de código fuente reconocidas
// ══════════════════════════════════════════════════════════════
const CODE_EXTENSIONS = new Set([
    // Web / JS / TS
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.html', '.css', '.scss', '.sass', '.less',
    '.vue', '.svelte', '.astro',

    // Python
    '.py', '.pyw', '.pyi',

    // Rust
    '.rs',

    // Go
    '.go',

    // Java / Kotlin / Scala
    '.java', '.kt', '.kts', '.scala',

    // C / C++ / C#
    '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx', '.cs',

    // Ruby
    '.rb', '.erb',

    // PHP
    '.php',

    // Swift / Objective-C
    '.swift', '.m', '.mm',

    // Shell
    '.sh', '.bash', '.zsh', '.fish',

    // Config / Data
    '.json', '.yaml', '.yml', '.toml', '.xml', '.ini', '.env',
    '.graphql', '.gql', '.proto',

    // Docs
    '.md', '.mdx', '.txt', '.rst',

    // SQL
    '.sql',

    // Dart / Flutter
    '.dart',

    // Elixir / Erlang
    '.ex', '.exs', '.erl',

    // Lua
    '.lua',

    // R
    '.r', '.R',

    // Docker / Infra
    '.dockerfile',
]);

// Archivos sin extensión que también queremos incluir
const SPECIAL_FILES = new Set([
    'Dockerfile', 'Makefile', 'Rakefile', 'Gemfile', 'Procfile',
    'Jenkinsfile', 'Vagrantfile',
    '.gitignore', '.dockerignore', '.editorconfig',
    '.eslintrc', '.prettierrc', '.babelrc',
]);

// ══════════════════════════════════════════════════════════════
// Recorrido recursivo del proyecto
// ══════════════════════════════════════════════════════════════
function walk(dir) {
    let results = [];
    let entries;
    try {
        entries = fs.readdirSync(dir);
    } catch {
        return results;
    }

    entries.forEach((entry) => {
        // Ignorar carpetas de la lista negra
        if (IGNORED_DIRS.has(entry)) return;

        const fullPath = path.join(dir, entry);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        } catch {
            return;
        }

        if (stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (stat.isFile()) {
            const ext = path.extname(entry).toLowerCase();
            const baseName = path.basename(entry);

            // Incluir si la extensión es conocida O si es un archivo especial
            if (CODE_EXTENSIONS.has(ext) || SPECIAL_FILES.has(baseName)) {
                // Saltar archivos gigantes (> 500KB) para no reventar la memoria
                if (stat.size <= 500 * 1024) {
                    results.push(fullPath);
                }
            }
        }
    });

    return results;
}

// ══════════════════════════════════════════════════════════════
// Generación del BUNDLE.md
// ══════════════════════════════════════════════════════════════
const args = process.argv.slice(2);
const rootDir = args[0]
    ? path.resolve(args[0])
    : process.env.PROJECT_PATH
        ? path.resolve(process.env.PROJECT_PATH)
        : process.cwd();

if (!fs.existsSync(rootDir)) {
    console.error(`Error: directorio no encontrado: ${rootDir}`);
    process.exit(1);
}

const allFiles = walk(rootDir);

// No incluir el propio BUNDLE ni los scripts auxiliares en el resultado
const filteredFiles = allFiles.filter(f => {
    const base = path.basename(f);
    return base !== 'BUNDLE.md' && base !== 'generate_bundle.cjs' && base !== 'split_markdown.cjs'
        && !base.startsWith('BUNDLE_part');
});

const header = `# Resumen Completo del Proyecto — Modo Offline

> **Nota:** Este documento ha sido generado automáticamente para funcionar de manera completamente independiente.
> Contiene todo el código base (dentro de bloques desplegables), constantes, y un mapeo estructural.
> No necesitarás la carpeta original para entender el proyecto.

- **Directorio raíz**: \`${rootDir}\`
- **Total de archivos procesados**: ${filteredFiles.length}

---

`;

let fileDetails = '';
let totalLinesProcessed = 0;

filteredFiles.forEach(file => {
    const relativePath = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf-8');
    const lineCount = content.split('\n').length;
    totalLinesProcessed += lineCount;

    const ext = path.extname(file).replace('.', '') || 'text';

    // Extracción de exportaciones (funciona para JS/TS, en otros lenguajes simplemente queda vacío)
    const constRegex = /(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=/g;
    const constSet = new Set();
    let cmatch;
    while ((cmatch = constRegex.exec(content)) !== null) {
        if (cmatch[1]) constSet.add(cmatch[1]);
    }

    const extractRegex = /export\s+(?:(?:default\s+)?(?:class|function|interface|type)\s+([a-zA-Z0-9_]+)|{([^}]+)})/g;
    const exportsSet = new Set();
    let ematch;
    while ((ematch = extractRegex.exec(content)) !== null) {
        if (ematch[1]) {
            exportsSet.add(ematch[1]);
        } else if (ematch[2]) {
            ematch[2].split(',').forEach(s => {
                const name = s.trim().split(/\s+/)[0];
                if (name && name !== 'type') exportsSet.add(name);
            });
        }
    }

    fileDetails += `### 📄 File: ${relativePath}\n`;
    fileDetails += `- **Líneas**: ${lineCount}\n`;

    let metaItems = [];
    if (exportsSet.size > 0) metaItems.push('- **Exportaciones principales**: ' + Array.from(exportsSet).join(', '));
    if (constSet.size > 0) metaItems.push('- **Constantes declaradas**: ' + Array.from(constSet).join(', '));

    if (metaItems.length > 0) {
        fileDetails += metaItems.join('\n') + '\n';
    }

    // Código fuente completo dentro de un bloque desplegable
    fileDetails += '\n<details>\n<summary><b>Ver código fuente completo</b></summary>\n\n';
    fileDetails += '```' + ext + '\n';
    // Escapar backticks triples dentro del contenido para no romper el bloque
    fileDetails += content.replace(/```/g, '\\`\\`\\`');
    fileDetails += '\n```\n\n</details>\n\n---\n\n';
});

const footer = `\n\n> **Líneas totales procesadas**: ${totalLinesProcessed}\n`;

const OUTPUT_DIR = CODE_RAW;
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, 'BUNDLE.md'), header + fileDetails + footer);
console.log(`✅ BUNDLE.md generado con éxito.`);
console.log(`   📁 Archivos procesados: ${filteredFiles.length}`);
console.log(`   📝 Líneas totales: ${totalLinesProcessed}`);
