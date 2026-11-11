// Saved news pages (test/fixtures/**/*.html) are the outlets' copyrighted work, so they are not in the
// public repository. They live in a private repo and are restored locally with `npm run fixtures:pull`.
// Without them, tests that need a saved page are skipped (CI); everything else still runs.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const FIXTURES = join(import.meta.dirname, 'fixtures');
export const hasSavedPage = (dir: string) => existsSync(join(dir, 'page.html'));
export const savedPagesPresent = () => hasSavedPage(join(FIXTURES, 'kompas', 'hidayat-nur-wahid-mundur-dari-wakil-ketua-mpr'));
