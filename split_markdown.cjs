const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { loadEnv } = require('./lib/env.cjs');

loadEnv();

async function splitMarkdown(inputFile, maxLines, outputDir) {
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: No se encontró el archivo ${inputFile}`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const ext = path.extname(inputFile);
  const baseName = path.basename(inputFile, ext);

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
    const partString = partNumber.toString().padStart(2, '0');
    const outputFile = path.join(outputDir, `${baseName}_part${partString}${ext}`);
    fs.writeFileSync(outputFile, currentLines.join('\n'), 'utf8');
    console.log(`✅ Creado: ${outputFile} (${currentLines.length} líneas)`);
    partNumber++;
    currentLines = [];
  };

  for await (const line of rl) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    currentLines.push(line);

    if (currentLines.length >= maxLines && !inCodeBlock) {
      if (line.trim() === '' || line.startsWith('#')) {
        writePart();
      }
    }
  }

  if (currentLines.length > 0) {
    writePart();
  }
}

const args = process.argv.slice(2);
const defaultResume = path.join(__dirname, 'output', 'code', '1_raw', 'RESUME.md');
const inputFile = args[0] || defaultResume;
const maxLines = parseInt(args[1], 10) || 10000;
const outputDir = args[0]
  ? path.dirname(inputFile)
  : path.join(__dirname, 'output', 'code', '2_parts');

console.log(`Iniciando división de ${inputFile} en bloques de aprox. ${maxLines} líneas...`);
splitMarkdown(inputFile, maxLines, outputDir).catch(console.error);
