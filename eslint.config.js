import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      '.browser-profiles/**',
      'artifacts/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks, 'react-refresh': refresh },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },
  {
    files: ['scripts/native-browser-check.mjs'],
    languageOptions: { globals: { chrome: 'readonly', navigator: 'readonly' } },
  },
  {
    files: ['scripts/measure-contrast.mjs'],
    languageOptions: { globals: { document: 'readonly', getComputedStyle: 'readonly' } },
  },
  {
    files: ['scripts/store-assets.mjs'],
    languageOptions: { globals: { document: 'readonly' } },
  },
  {
    files: ['scripts/measure-performance.mjs'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        performance: 'readonly',
        crypto: 'readonly',
        MutationObserver: 'readonly',
        PerformanceObserver: 'readonly',
        KeyboardEvent: 'readonly',
        requestAnimationFrame: 'readonly',
      },
    },
  },
);
