import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    globalSetup: ['tests/integration/globalSetup.ts'],
    pool: 'forks',
    // All integration tests share one Postgres DB, so files must run serially.
    // Otherwise they race: a transient admin user created in handle_new_user makes
    // tasks.actions' last-admin guard see count>1, letting it downgrade the
    // test-admin and cascading FORBIDDEN/RLS failures elsewhere. maxConcurrency
    // only serializes WITHIN a file; fileParallelism:false serializes across files.
    fileParallelism: false,
    maxConcurrency: 1,
  },
})
