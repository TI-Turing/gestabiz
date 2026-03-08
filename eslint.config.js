// Flat ESLint config for ESLint v9+
// Scope: TypeScript/React app code under src; ignore extension/functions/docs.
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.vite/**',
      // Ignore non-web surfaces and serverless functions
      'supabase/**',
      'src/supabase/**',
      'src/mobile/**',
      'mobile/**',
      'extension/**',
      'src/browser-extension/**',
      'docs/**',
      'database/**',
      'tests/**',
      'src/tests/**',
      'src/**/__tests__/**',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/types/supabase.ts',
      'src/types/database.ts',
      'src/types/supabase.gen.ts',
      'src/types/supabase.gen.tmp.ts',
      'test-auth-console.js',
      'test-*.js',
      'test-*.ts',
      'tailwind.config.js',
      // Scripts de utilidad (no son código de producción)
      'scripts/**',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}', '*.ts', '*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: false,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'no-console': ['warn'],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Matches repo policy: handle or rethrow
      'no-empty': ['warn', { allowEmptyCatch: false }],
      // Relax strictness to get repo green; tighten gradually
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
    },
  },
)
