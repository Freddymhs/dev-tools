const { run } = require("./lib/runner.cjs");
const { mainMenu, submenu, askVar } = require("./lib/menu.cjs");

if (!process.stdin.isTTY) {
  console.error("dev-tools TUI requiere una terminal interactiva.");
  process.exit(1);
}

process.on("SIGINT", () => {
  console.log("\n\nHasta luego.");
  process.exit(0);
});

const OPERATIONS = {
  generate: {
    scripts: ["generate_bundle.cjs"],
    labels: ["Generando bundle del proyecto..."],
    alwaysAsk: [{ key: "PROJECT_PATH", label: "Ruta absoluta al proyecto" }],
  },
  "generate-split": {
    scripts: ["generate_bundle.cjs", "split_markdown.cjs"],
    labels: ["Generando bundle del proyecto...", "Dividiendo en partes..."],
    alwaysAsk: [{ key: "PROJECT_PATH", label: "Ruta absoluta al proyecto" }],
  },
  split: {
    scripts: ["split_markdown.cjs"],
    labels: ["Dividiendo markdown en partes..."],
  },
  download: {
    scripts: ["download_video.cjs"],
    labels: ["Descargando video..."],
    alwaysAsk: [{ key: "DOWNLOAD_URL", label: "URL del video o ruta local" }],
  },
  "split-video": {
    scripts: ["split_video.cjs"],
    labels: ["Dividiendo video en segmentos..."],
  },
  transcript: {
    scripts: ["transcript_video.cjs"],
    labels: ["Transcribiendo partes..."],
  },
  pipeline: {
    scripts: ["download_video.cjs", "split_video.cjs", "transcript_video.cjs"],
    labels: ["Descargando video...", "Dividiendo video en segmentos...", "Transcribiendo partes..."],
    alwaysAsk: [{ key: "DOWNLOAD_URL", label: "URL del video o ruta local" }],
  },
};

const separator = (msg) =>
  console.log(`\n${"─".repeat(48)}\n${msg ? `  ${msg}\n` : ""}`);

const askAlways = async (fields) => {
  const extraEnv = {};
  for (const { key, label } of (fields || [])) {
    const value = await askVar(label);
    if (value) extraEnv[key] = value;
  }
  return extraEnv;
};

const executeOperation = async (opKey) => {
  const op = OPERATIONS[opKey];
  const extraEnv = await askAlways(op.alwaysAsk);

  for (const [i, script] of op.scripts.entries()) {
    const label = op.labels[i];
    separator(`▶  ${label}`);
    const code = await run(script, extraEnv);
    if (code !== 0) {
      console.log(`\n❌ ${label} terminó con error (código ${code})`);
      return;
    }
    console.log(`\n✅ ${label.replace("...", " completado")}`);
  }
  separator();
};

const main = async () => {
  console.log("\n🛠️  dev-tools\n");

  while (true) {
    const category = await mainMenu();
    if (!category || category === "exit") break;

    const operation = await submenu(category);
    if (!operation || operation === "back") continue;

    await executeOperation(operation);
  }

  console.log("\nHasta luego.");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
