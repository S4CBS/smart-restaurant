import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    watch: {
      // Атомарные записи редакторов создают временные каталоги внутри src —
      // наблюдателю они не нужны и на Windows дают EBUSY.
      ignored: ['**/*.tmpdir/**', '**/.*.tmpdir/**'],
    },
  },
  build: {
    target: 'es2020',
  },
});
