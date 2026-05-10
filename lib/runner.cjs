const { spawn } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const run = (scriptPath) =>
  new Promise((resolve) => {
    const child = spawn("node", [path.join(ROOT, scriptPath)], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", resolve);
  });

const runSequence = async (scripts) => {
  for (const script of scripts) {
    const code = await run(script);
    if (code !== 0) return code;
  }
  return 0;
};

module.exports = { run, runSequence };
