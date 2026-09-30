# Unofficial Pi 0.87.1 security rebuild

This brooksmcmillin-owned distribution is an interim dependency-security artifact, not an official Pi release. Package identity/version remain `@earendil-works/pi-coding-agent@0.87.1` for compatibility. Install only the reviewed npm-packed `.tgz` via an immutable raw commit URL; npm lock integrity must match it. No npm registry publication, global installation, or production deployment is implied.

## Scope and sources

- Upstream source: [earendil-works/pi](https://github.com/earendil-works/pi), exact tag/npm gitHead `f07218c4d4bbc12bef056a7058c3dd49dfe41abe` (`v0.87.1`).
- Original published npm distribution SHA-512: `m8ArJUtVcQMSe1lLE/Ei7vX/JV7O39sWmWBsXV2NOU70F0qCp8GubA24pT3LnwTmM6LL2xV80/h6sQg85n69ew==`, independently matched against the infra lock.
- Source checkpoint `4b7d06666e515db74f93e16fe83bcec135addf6b`; its entire change is `provenance/build-source.patch.gz`. Decompress and apply that lossless patch to the upstream source to reconstruct the modified tree; a private/local Git object is not required.
- Patch: scoped `minimatch@10.2.6` override to `brace-expansion@5.0.12`, with root lock, official coding-agent shrinkwrap, and install lock updated. No Pi source/runtime API edits or version upgrade.
- Published CLI bundles brace expansion, so **a shrinkwrap-only edit is insufficient**. This artifact rebuilds the actual bundle as well as fixing the installed dependency graph (GHSA-6j4f-fj2g-mc7p, GHSA-qhr7-859c-m2p7, GHSA-q2hr-2g5m-vwhr).
- Gitignored model data was restored from the exact published `@earendil-works/pi-ai@0.87.1`, then validated against the pinned source's manifest/structure. No live model-catalog regeneration. Original npm pack metadata and rebuilt pack integrity are in `provenance/`.
- Original upstream license/copyright retained in `LICENSE`. Original upstream README/docs describe Pi itself, not this unofficial artifact's release status.

## Consumer transport

Use `https://raw.githubusercontent.com/brooksmcmillin/pi-runtime-security/<reviewed-commit>/artifacts/pi-coding-agent-0.87.1-security.tgz`. The payload exactly matches the tested npm pack integrity in `provenance/patched-npm-pack.json`.

Do not use GitHub's repository source archive as an npm dependency: npm ignored its shrinkwrap and resolved newer transitive packages during integration. The actual npm tarball has the required `package/npm-shrinkwrap.json` layout. Re-resolve consumers in a clean temporary dependency factory when changing same-version sources; compare the resulting graph before adopting it, since old nested lock entries may otherwise persist.

## Reproduce

Tested with Node 24.21.0, npm 11.19.0. Follow upstream source instructions and use an isolated worktree. Dependency lifecycle scripts stay disabled.

```sh
git clone --branch v0.87.1 https://github.com/earendil-works/pi.git pi-source
cd pi-source
test "$(git rev-parse HEAD)" = f07218c4d4bbc12bef056a7058c3dd49dfe41abe
gzip -dc /absolute/path/to/this-repo/provenance/build-source.patch.gz | git apply -
npm ci --ignore-scripts
mkdir -p .scratchpad
npm pack @earendil-works/pi-ai@0.87.1 --ignore-scripts --pack-destination .scratchpad
tar -xzf .scratchpad/earendil-works-pi-ai-0.87.1.tgz --strip-components=3 \
  -C packages/ai/src/providers package/dist/providers/data
npm run check:model-data
npm run build:offline
npm run check
npm pack --workspace @earendil-works/pi-coding-agent --ignore-scripts \
  --json --pack-destination .scratchpad
```

Use a machine-appropriate memory cap for build/check/tests. On the development host, these commands ran through infra `scripts/heavy-safe --profile pytest-focused`. Official generators verify shrinkwrap/install-lock consistency; they were not manually falsified. Extract the final package into a clean distribution tree so superseded hashed bundle chunks do not remain. Preserve this provenance, verifier, source patch, and upstream license.

## Verification

- Official offline build and full `npm run check` pass, including types, entry graphs, pinned/runtime dependencies, shrinkwrap/install lock, and browser smoke.
- 174 scoped upstream model-resolver/package-manager tests pass; no real provider calls.
- Outside-source npm installation with `--ignore-scripts` succeeds, npm audit is clean, Node CLI `--version` reports 0.87.1 and `--help` succeeds.
- Copy `provenance/verify-install.mjs` into an isolated installed consumer root and run it with a memory cap. It checks installed brace 5.0.12, all three bundled guards, ordinary model scoping, and actual bundled resolver memory/nesting/rewrite regression patterns.
- Initial offline build lacked gitignored model data; restoration from the same published release resolved it without live catalog changes. Initial guarded probe rejected a non-Git cwd; it was rerun capped from a Git cwd while resolving modules exclusively from the isolated consumer.

This is a **draft review checkpoint**. It does not claim complete upstream release qualification, Bun binary validation, live-provider inference, interactive UI verification, or readiness/merge authority. Infra consumers require their own compatibility and owner trust-boundary review before deployment.

## Maintenance

Replace this artifact with a tested upstream distribution once both published shrinkwrap and bundled code contain the advisory fixes. Never move a consumed commit or alter lock integrity to disguise source changes. Keep artifact changes tied to an exact upstream release, complete source patch, static data provenance, and fresh consumer/bundle checks.
