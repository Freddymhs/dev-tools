const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ENV_LOCAL = process.env.DEV_TOOLS_ENV_FILE || path.join(ROOT, ".env.local");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  fs.readFileSync(filePath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (key) process.env[key] = value;
    });
};

const loadEnv = () => {
  loadEnvFile(path.join(ROOT, ".env"));
  loadEnvFile(ENV_LOCAL);
};

module.exports = { loadEnv };
