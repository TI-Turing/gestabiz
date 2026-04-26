import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'

const projectRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/setup.ts'],
    exclude: [
      // Default Vitest exclusions
      '**/node_modules/**',
      '**/dist/**',
      // Excluir worktrees internos de Claude (Obsidian/Gestabiz/.claude/worktrees/)
      'Obsidian/**',
      '**/.claude/worktrees/**',
      // Tests de React Native — requieren react-test-renderer@18, incompatible con React 19
      'src/mobile/__tests__/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test-utils/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        // App Expo separada con su propio runner
        'src/mobile/**',
        // Tipos generados (database.ts 7753 líneas, supabase.gen.ts 7331)
        'src/types/**',
        // Contenido y datos estáticos
        'src/content/**',
        'src/data/**',
        // Bootstrap difícil de testear sin E2E
        'src/App.tsx',
        'src/components/MainApp.tsx',
        // Infraestructura legacy / mocks
        'src/lib/useSupabase.ts',
        'src/lib/supabase-mock.ts',
        'src/lib/supabaseTyped.ts',
        'src/lib/demoData.ts',
        // Re-exports puros
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 20,
        statements: 20,
      },
    },
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.0.0-test'),
  },
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
  },
})
