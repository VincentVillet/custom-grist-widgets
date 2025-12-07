import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // This makes the server accessible externally
    allowedHosts: [
      'localhost',
      '.ngrok-free.dev', // Allow all ngrok free tier subdomains
    ],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'widget-one': resolve(__dirname, 'src/widget-one/index.html'),
        'generate-meals': resolve(__dirname, 'src/generate-meals/index.html'),
      },
    },
  },
});
