const fs = require('fs');
const readline = require('readline');
const path = require('path');

// ══════════════════════════════════════════════════════════════
// Carga .env y .env.local (.env.local tiene prioridad)
// ══════════════════════════════════════════════════════════════
const loadEnvFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    fs.readFileSync(filePath, 'utf-8')
        .split('\n')
        .forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) return;
            const key = trimmed.slice(0, eqIndex).trim();
            const value = trimmed.slice(eqIndex + 1).trim();
            if (key) process.env[key] = value;
        });
};
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '.env.local'));

async function splitMarkdown(inputFile, maxLines = 10000) {
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: No se encontró el archivo ${inputFile}`);
    process.exit(1);
  }

  const ext = path.extname(inputFile);
  const baseName = path.basename(inputFile, ext);
  const dirName = path.dirname(inputFile);

  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let partNumber = 1;
  let currentLines = [];
  let inCodeBlock = false;

  const writePart = () => {
    if (currentLines.length === 0) return;
    // Agrega padding de ceros al número de parte (ej. part01, part02)
    const partString = partNumber.toString().padStart(2, '0');
    const outputFile = path.join(dirName, `${baseName}_part${partString}${ext}`);
    fs.writeFileSync(outputFile, currentLines.join('\n'), 'utf8');
    console.log(`✅ Creado: ${outputFile} (${currentLines.length} líneas)`);
    partNumber++;
    currentLines = [];
  };

  for await (const line of rl) {
    // Detectamos si estamos dentro de un bloque de código para no cortarlo a la mitad
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    currentLines.push(line);

    // Si superamos el límite de líneas sugerido y NO estamos en un bloque de código
    if (currentLines.length >= maxLines && !inCodeBlock) {
      // Es ideal cortar en una línea en blanco o en un nuevo título para no romper párrafos
      if (line.trim() === '' || line.startsWith('#')) {
         writePart();
      }
    }
  }

  // Escribimos el resto si quedó algo pendiente
  if (currentLines.length > 0) {
    writePart();
  }
}

const args = process.argv.slice(2);
const defaultResume = path.join(__dirname, 'output', 'RESUME.md');
const inputFile = args[0] || defaultResume;
const maxLines = parseInt(args[1], 10) || 10000;

console.log(`Iniciando división de ${inputFile} en bloques de aprox. ${maxLines} líneas...`);
splitMarkdown(inputFile, maxLines).catch(console.error);
