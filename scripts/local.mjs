#!/usr/bin/env node
/**
 * Local-first runner for DashLaw.
 * Usage: node scripts/local.mjs [setup|dev|start]
 */
import { existsSync, copyFileSync, mkdirSync } from "fs";
import { spawnSync, spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(repoRoot, "apps", "web");
const envFile = path.join(webRoot, ".env");
const envExample = path.join(webRoot, ".env.example");
const command = process.argv[2] || "dev";

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: webRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureEnv() {
  if (!existsSync(envFile)) {
    copyFileSync(envExample, envFile);
    console.log("Created apps/web/.env from .env.example");
  }
}

function ensureInstall() {
  if (!existsSync(path.join(webRoot, "node_modules", "next"))) {
    console.log("Installing npm dependencies in apps/web …");
    run("npm", ["install"]);
  }
}

function ensureDatabase() {
  mkdirSync(path.join(webRoot, "prisma"), { recursive: true });
  mkdirSync(path.join(webRoot, "storage", "documents"), { recursive: true });
  run("npx", ["prisma", "generate"]);
  run("npx", ["prisma", "db", "push"]);
  const check = spawnSync("npx", ["tsx", "scripts/has-users.mjs"], {
    cwd: webRoot,
    shell: process.platform === "win32",
    env: process.env,
  });
  if (check.status === 2) {
    console.log("Empty database — loading Harbor Immigration demo data …");
    run("npx", ["prisma", "db", "seed"]);
  }
}

function startNext(script) {
  const child = spawn("npm", ["run", script], {
    cwd: webRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, BROWSER: "none" },
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

ensureEnv();
ensureInstall();
ensureDatabase();

if (command === "setup") {
  console.log("Local setup complete. Run `npm run local` or use Run and Debug → DashLaw: Run locally.");
  process.exit(0);
}

if (command === "start") {
  run("npm", ["run", "build"]);
  startNext("start");
} else {
  console.log("\nDashLaw local server → http://localhost:3000");
  console.log("Demo login: admin@harbor.example / password123\n");
  startNext("dev");
}
