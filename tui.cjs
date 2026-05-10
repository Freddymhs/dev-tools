const { loadEnv, getVar, setVar, listMissing } = require("./lib/env.cjs");
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
    scripts: ["generate_resume.cjs"],
    required: [{ key: "PROJECT_PATH", label: "Ruta absoluta al proyecto" }],
  },
  "generate-split": {
    scripts: ["generate_resume.cjs", "split_markdown.cjs"],
    required: [{ key: "PROJECT_PATH", label: "Ruta absoluta al proyecto" }],
  },
  split: {
    scripts: ["split_markdown.cjs"],
    required: [],
  },
  download: {
    scripts: ["download_video.cjs"],
    required: [],
    alwaysAsk: [{ key: "DOWNLOAD_URL", label: "URL del video (YouTube, TikTok, etc.)" }],
  },
  "split-video": {
    scripts: ["split_video.cjs"],
    required: [],
  },
  transcript: {
    scripts: ["transcript_video.cjs"],
    required: [],
  },
  pipeline: {
    scripts: ["download_video.cjs", "split_video.cjs", "transcript_video.cjs"],
    required: [],
    alwaysAsk: [{ key: "DOWNLOAD_URL", label: "URL del video (YouTube, TikTok, etc.)" }],
  },
};

const separator = (msg) =>
  console.log(`\n${"─".repeat(48)}\n${msg ? `  ${msg}\n` : ""}`);

const askMissing = async (required) => {
  const missingKeys = listMissing(required.map((r) => r.key));
  for (const { key, label } of required) {
    if (!missingKeys.includes(key)) continue;
    const value = await askVar(key, label, getVar(key));
    if (value) setVar(key, value);
  }
};

const askAlways = async (fields) => {
  for (const { key, label } of (fields || [])) {
    const value = await askVar(key, label, getVar(key));
    if (value) setVar(key, value);
  }
};

const executeOperation = async (opKey) => {
  const op = OPERATIONS[opKey];
  await askMissing(op.required);
  await askAlways(op.alwaysAsk);

  for (const script of op.scripts) {
    separator(`▶  ${script}`);
    const code = await run(script);
    if (code !== 0) {
      console.log(`\n❌ ${script} terminó con error (código ${code})`);
      return;
    }
    console.log(`\n✅ ${script} completado`);
  }
  separator();
};

const main = async () => {
  loadEnv();
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
