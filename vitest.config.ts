import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    // Real multi-page article fixtures parse megabytes of HTML; 5s is too tight when they run in parallel.
    testTimeout: 30_000,
  },
});
