import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Config base para Vitest unit (Camada 1 do ADR 0005).
 *
 * Esta config cobre apenas a suíte unit em `tests/unit/` — funções puras sem I/O.
 * Camadas 2 (integration), 3 (E2E) e 4 (pgTAP) terão configs separadas em
 * sprints subsequentes da 07-A.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'lib/utils/**/*.ts',
        'lib/auth/**/*.ts',
        'lib/actions/_validation.ts',
        'lib/logger/index.ts',
      ],
      exclude: [
        'lib/supabase/**',
        '**/*.test.ts',
      ],
    },
  },
})
