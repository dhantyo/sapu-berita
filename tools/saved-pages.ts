// Saved news pages for the tests live in a private repository (they're the outlets' copyrighted work).
//   npm run fixtures:pull   clone/update it into .saved-pages/ and copy the pages into test/fixtures/
//   npm run fixtures:push   copy test/fixtures/**/*.html into it, commit and push
// The private repo is <owner>/sapu-berita-fixtures (override with SAPU_FIXTURES_REPO).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { ROOT } from './lib/rules.ts';

// exFAT and FAT drives record no file owner, so git refuses "dubious ownership"; trust these two folders per call.
const git = (args: string[], cwd = ROOT) =>
  execFileSync('git', ['-c', `safe.directory=${cwd.replaceAll('\\', '/')}`, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const origin = git(['remote', 'get-url', 'origin']);
const owner = origin.match(/github\.com[/:]([^/]+)\//)?.[1];
const repo = process.env.SAPU_FIXTURES_REPO ?? `https://github.com/${owner}/sapu-berita-fixtures.git`;
const CACHE = join(ROOT, '.saved-pages');
const FIXTURES = join(ROOT, 'test', 'fixtures');

function htmlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? (d.name === '.git' ? [] : htmlFiles(join(dir, d.name))) : d.name.endsWith('.html') ? [join(dir, d.name)] : []);
}

function copy(files: string[], from: string, to: string): number {
  for (const f of files) {
    const dest = join(to, relative(from, f));
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(f, dest);
  }
  return files.length;
}

const mode = process.argv[2];
if (!existsSync(CACHE)) git(['clone', '--quiet', repo, CACHE]);
else if (git(['ls-remote', '--heads', 'origin'], CACHE)) git(['pull', '--quiet', '--ff-only', 'origin', 'HEAD'], CACHE);

if (mode === 'pull') {
  console.log(`restored ${copy(htmlFiles(CACHE), CACHE, FIXTURES)} saved pages into test/fixtures/`);
} else if (mode === 'push') {
  const n = copy(htmlFiles(FIXTURES), FIXTURES, CACHE);
  git(['add', '-A'], CACHE);
  if (git(['status', '--porcelain'], CACHE)) {
    git(['commit', '--quiet', '-m', `Update saved pages (${n} files)`], CACHE);
    git(['push', '--quiet', '-u', 'origin', 'HEAD'], CACHE);
    console.log(`pushed ${n} saved pages`);
  } else console.log('saved pages already up to date');
} else {
  console.error('usage: node tools/saved-pages.ts pull|push');
  process.exit(1);
}
