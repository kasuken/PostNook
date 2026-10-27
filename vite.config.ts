import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    watch: {
      ignored: [
        '**/.browser-profiles/**',
        '**/test-results/**',
        '**/playwright-report/**',
        '**/artifacts/**',
      ],
    },
  },
  build: {
    target: 'chrome116',
    rollupOptions: {
      input: { sidepanel: 'sidepanel.html', background: 'src/extension/background.ts' },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
      },
    },
  },
});
