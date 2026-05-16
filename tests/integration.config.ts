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
    maxConcurrency: 1, // all integration tests share 1 process (same DB state)
  },
})
