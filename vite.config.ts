import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'widget-one': resolve(__dirname, 'src/widget-one/index.html'),
      },
    },
  },
});
