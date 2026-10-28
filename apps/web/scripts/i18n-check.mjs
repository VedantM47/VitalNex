#!/usr/bin/env node
// `npm run i18n:check`: fails (exit 1) when the key sets of src/messages/{en,hi,mr}.json differ,
// or when a key is a text in one language and a group in another, or a text is empty.
// It also warns (without failing) about static t("a.b") keys used in src/ that are missing from
// en.json; keys built at run time (t(`x.${y}`)) cannot be checked this way.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const msgDir = join(root, "src", "messages");
const LANGS = ["en", "hi", "mr"];

function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out.set(key, v);
  }
  return out;
}

const flat = {};
for (const lang of LANGS) {
  const text = readFileSync(join(msgDir, `${lang}.json`), "utf8");
  flat[lang] = flatten(JSON.parse(text));
}

const problems = [];
const allKeys = new Set(LANGS.flatMap((l) => [...flat[l].keys()]));
for (const key of [...allKeys].sort()) {
  const missing = LANGS.filter((l) => !flat[l].has(key));
  if (missing.length) {
    problems.push(`missing in ${missing.join(", ")}: ${key}`);
    continue;
  }
  for (const lang of LANGS) {
    const v = flat[lang].get(key);
    if (typeof v !== "string") problems.push(`${lang}: ${key} is not a text (${Array.isArray(v) ? "array" : typeof v})`);
    else if (!v.trim()) problems.push(`${lang}: ${key} is empty`);
  }
}

// Static key usage (warning only).
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}
const groups = new Set([...flat.en.keys()].flatMap((k) => k.split(".").map((_, i, a) => a.slice(0, i + 1).join("."))));
const unknown = [];
for (const file of walk(join(root, "src"))) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/\bt\(\s*"([a-zA-Z][\w-]*(?:\.[\w-]+)+)"/g)) {
    if (!flat.en.has(m[1]) && !groups.has(m[1])) unknown.push(`${relative(root, file)}: ${m[1]}`);
  }
}

console.log(`i18n:check — ${allKeys.size} keys across ${LANGS.join(", ")}`);
if (unknown.length) {
  console.warn(`warning: ${unknown.length} static t() key(s) not in en.json:`);
  for (const u of unknown) console.warn(`  ${u}`);
}
if (problems.length) {
  console.error(`FAIL: ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("OK: en, hi and mr have the same keys and no empty texts.");
