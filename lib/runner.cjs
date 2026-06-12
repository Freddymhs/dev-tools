const { spawn } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const run = (scriptPath, extraEnv = {}) =>
  new Promise((resolve) => {
    const child = spawn("node", [path.join(ROOT, scriptPath)], {
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });
    child.on("close", resolve);
  });

module.exports = { run };
