// Fails the build if an em dash or en dash sneaks into the source or docs.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "README.md"];
const banned = /[–—]/;
const hits = [];

function walk(path) {
  if (statSync(path).isDirectory()) return readdirSync(path).forEach((f) => walk(join(path, f)));
  if (!/\.(tsx?|css|md|mjs)$/.test(path)) return;
  readFileSync(path, "utf8")
    .split("\n")
    .forEach((line, i) => banned.test(line) && hits.push(`${path}:${i + 1}: ${line.trim()}`));
}

roots.forEach(walk);
if (hits.length) {
  console.error(`Found ${hits.length} long dash(es):\n${hits.join("\n")}`);
  process.exit(1);
}
console.log("No long dashes found.");
