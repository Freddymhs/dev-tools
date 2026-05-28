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

const getVar = (key) => process.env[key] || "";

const setVar = (key, value) => {
  process.env[key] = value;
  const current = fs.existsSync(ENV_LOCAL)
    ? fs.readFileSync(ENV_LOCAL, "utf-8")
    : "";
  const lines = current.split("\n");
  const idx = lines.findIndex((l) => l.match(new RegExp(`^${key}=`)));
  if (idx !== -1) {
    lines[idx] = `${key}=${value}`;
  } else {
    if (current && !current.endsWith("\n")) lines.push("");
    lines.push(`${key}=${value}`);
  }
  fs.writeFileSync(ENV_LOCAL, lines.join("\n"), "utf-8");
};

const listMissing = (keys) => keys.filter((k) => !process.env[k]);

module.exports = { loadEnv, getVar, setVar, listMissing };
