// Run from an isolated consumer after copying this file into its root.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolveModelScopeWithDiagnostics } from "./node_modules/@earendil-works/pi-coding-agent/dist/bundle/index.js";

const packageRoot = new URL("./node_modules/@earendil-works/pi-coding-agent/", import.meta.url);
const requirePi = createRequire(new URL("package.json", packageRoot));
assert.equal(JSON.parse(readFileSync(new URL("package.json", packageRoot))).version, "0.87.1");
const license = readFileSync(new URL("LICENSE", packageRoot), "utf8");
assert.ok(license.startsWith("MIT License\n\nCopyright (c) 2025 Mario Zechner\n"));
assert.ok(license.includes("The above copyright notice and this permission notice shall be included"));
assert.equal(JSON.parse(readFileSync(requirePi.resolve("brace-expansion/package.json"))).version, "5.0.12");
const { expand } = requirePi("brace-expansion");
assert.deepEqual(expand("a{b,c}d"), ["abd", "acd"]);

const chunksDir = new URL("dist/bundle/chunks/", packageRoot);
const bundledCode = readdirSync(chunksDir)
  .filter((name) => name.endsWith(".js"))
  .map((name) => readFileSync(new URL(name, chunksDir), "utf8"))
  .join("\n");
for (const guard of ["EXPANSION_MAX_LENGTH", "EXPANSION_MAX_DEPTH", "EXPANSION_MAX_REWRITES"]) {
  assert.ok(bundledCode.includes(guard), `Missing bundled security guard: ${guard}`);
}

const models = ["alpha", "beta"].map((id) => ({ id, name: id, provider: "fixture" }));
const runtime = { getAvailable: async () => models };
const ordinary = await resolveModelScopeWithDiagnostics(["fixture/{alpha,beta}*"], runtime);
assert.deepEqual(ordinary.scopedModels.map(({ model }) => model.id), ["alpha", "beta"]);
assert.deepEqual(ordinary.diagnostics, []);

for (const [name, pattern] of [
  ["chained-expansion-memory", "*" + "{a,b}".repeat(1500)],
  ["nested-expansion-depth", "*" + "{".repeat(1500) + "a,b" + "}".repeat(1500)],
  ["rewrite-rescan", "*{a}" + "}".repeat(10000) + ",z}"],
]) {
  const result = await resolveModelScopeWithDiagnostics([pattern], runtime);
  assert.equal(result.scopedModels.length, 0);
  console.log(`PASS bundled resolver ${name}`);
}
console.log("PASS upstream MIT notice, patched installed dependency, all bundled guards, ordinary model scoping; no provider calls.");
