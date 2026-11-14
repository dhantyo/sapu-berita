// Cut a release:  npm run release -- 0.3.4
//
// 1. Checks the working tree is clean, on master, and that CHANGELOG.md has a non-empty "## [Unreleased]".
// 2. Sets the version in package.json and package-lock.json, and turns "## [Unreleased]" into
//    "## [0.3.4] - <today>".
// 3. Builds and runs every check (typecheck + tests).
// 4. Commits "Release 0.3.4", pushes master, then creates and pushes the one tag v0.3.4 (CI builds,
//    signs and publishes from the tag; tags go one at a time, see docs/DEVELOPING.md).
//
// Add --dry-run to stop after step 3 and put every file back as it was.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/rules.ts';

const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const fail = (msg: string): never => {
  console.error(`release: ${msg}`);
  process.exit(1);
};
const sh = (cmd: string) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const out = (cmd: string) => execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version)) fail('usage: npm run release -- X.Y.Z [--dry-run]');
if (out('git branch --show-current') !== 'master') fail('release from master');
if (out('git status --porcelain')) fail('commit or stash your changes first');
if (out(`git tag --list v${version}`)) fail(`tag v${version} already exists`);

const pkgPath = join(ROOT, 'package.json');
const lockPath = join(ROOT, 'package-lock.json');
const logPath = join(ROOT, 'CHANGELOG.md');
const current = (JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string }).version;
const log = readFileSync(logPath, 'utf8');

const unreleased = /^## \[Unreleased\]\s*\n([\s\S]*?)(?=^## \[)/m.exec(log);
if (!unreleased) fail('CHANGELOG.md has no "## [Unreleased]" section');
if (!unreleased![1]!.trim()) fail('the "## [Unreleased]" section is empty');

// The tree was clean when we started, so every tracked change from here on is ours (the version edits, and
// the build's copy of the version in apps/extension/manifest.json): put them all back on a failure or dry run.
const restore = () => sh('git checkout -- .');

const today = new Date().toISOString().slice(0, 10);
const setVersion = (path: string, count: number) => {
  const text = readFileSync(path, 'utf8');
  const needle = `"version": "${current}"`;
  if (text.split(needle).length - 1 < count) fail(`${path} doesn't list version ${current}`);
  writeFileSync(path, text.split(needle).join(`"version": "${version}"`));
};
setVersion(pkgPath, 1);
setVersion(lockPath, 2);
writeFileSync(logPath, log.replace('## [Unreleased]', `## [${version}] - ${today}`));
console.log(`${current} → ${version}`);

try {
  sh('npm run build');
  sh('npm run check');
} catch {
  restore();
  fail('build or checks failed; version and changelog restored');
}

if (dryRun) {
  restore();
  console.log('dry run: all checks passed; nothing committed');
  process.exit(0);
}

sh(`git commit -q -am "Release ${version}" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`);
sh('git push -q');
sh(`git tag -a v${version} -m "Sapu Berita ${version}"`);
sh(`git push -q origin v${version}`);
console.log(`v${version} pushed; CI builds and publishes it (gh run list).`);
