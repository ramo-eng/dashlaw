#!/usr/bin/env node
/**
 * Local-first runner for DashLaw on Supabase.
 * Usage: node scripts/local.mjs [setup|dev|start]
 */
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "fs";
import { spawnSync, spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(repoRoot, "apps", "web");
const envFile = path.join(webRoot, ".env");
const envExample = path.join(webRoot, ".env.example");
const command = process.argv[2] || "dev";

function run(cmd, args, cwd = webRoot) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runCapture(cmd, args, cwd = repoRoot) {
  return spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env,
  });
}

function ensureEnv() {
  if (!existsSync(envFile)) {
    copyFileSync(envExample, envFile);
    console.log("Created apps/web/.env from .env.example");
  }
}

function readDotEnv() {
  const text = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
  const map = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    map[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).replace(/^"|"$/g, "");
  }
  return map;
}

function upsertEnv(updates) {
  let text = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}="${value}"`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(text)) text = text.replace(re, line);
    else text += `\n${line}\n`;
  }
  writeFileSync(envFile, text);
}

function hostedSupabase(env) {
  return (env.NEXT_PUBLIC_SUPABASE_URL || "").includes("supabase.co");
}

function ensureInstall() {
  if (!existsSync(path.join(webRoot, "node_modules", "next"))) {
    console.log("Installing npm dependencies in apps/web …");
    run("npm", ["install"]);
  }
  if (!existsSync(path.join(webRoot, "node_modules", "@supabase", "supabase-js"))) {
    run("npm", ["install", "@supabase/supabase-js"]);
  }
}

function dockerAvailable() {
  return runCapture("docker", ["info"]).status === 0;
}

function ensureLocalSupabase() {
  const env = readDotEnv();
  if (hostedSupabase(env)) {
    console.log("Using hosted Supabase project:", env.NEXT_PUBLIC_SUPABASE_URL);
    return;
  }
  if (!dockerAvailable()) {
    console.error(`
Docker is required to run Supabase locally.
Install Docker Desktop, or put a hosted project's keys in apps/web/.env
(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, DIRECT_URL).
`);
    process.exit(1);
  }
  console.log("Starting local Supabase (Docker) …");
  const started = runCapture("npx", ["--yes", "supabase", "start"], repoRoot);
  process.stdout.write(started.stdout || "");
  process.stderr.write(started.stderr || "");
  if (started.status !== 0) {
    console.error("Could not start local Supabase. Is Docker running?");
    process.exit(started.status ?? 1);
  }
  const status = runCapture("npx", ["--yes", "supabase", "status", "-o", "env"], repoRoot);
  if (status.status !== 0) {
    console.error(status.stderr);
    process.exit(1);
  }
  const parsed = {};
  for (const line of (status.stdout || "").split("\n")) {
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    parsed[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
  }
  const dbUrl = parsed.DB_URL || parsed.POSTGRES_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  upsertEnv({
    NEXT_PUBLIC_SUPABASE_URL: parsed.API_URL || parsed.SUPABASE_URL || "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.ANON_KEY || parsed.SUPABASE_ANON_KEY || "",
    SUPABASE_SERVICE_ROLE_KEY: parsed.SERVICE_ROLE_KEY || parsed.SUPABASE_SERVICE_ROLE_KEY || "",
    DATABASE_URL: dbUrl,
    DIRECT_URL: dbUrl,
  });
  console.log("Wrote local Supabase connection settings to apps/web/.env");
}

function ensureDatabase() {
  run("npx", ["prisma", "generate"]);
  run("npx", ["prisma", "db", "push"]);
  run("npx", ["tsx", "scripts/ensure-supabase.mjs"]);
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
ensureLocalSupabase();
ensureDatabase();

if (command === "setup") {
  console.log("Local Supabase setup complete. Run `npm run local` or use Run and Debug → DashLaw: Run locally.");
  process.exit(0);
}

if (command === "start") {
  run("npm", ["run", "build"]);
  startNext("start");
} else {
  console.log("\nDashLaw local server → http://localhost:3000");
  console.log("Supabase Studio → http://127.0.0.1:54323");
  console.log("Demo login: admin@harbor.example / password123\n");
  startNext("dev");
}
