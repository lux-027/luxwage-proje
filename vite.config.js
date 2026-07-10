import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    open: true,
    strictPort: false
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        gizlilik: resolve(__dirname, 'gizlilik-politikasi.html'),
        kullanim: resolve(__dirname, 'kullanim-sartlari.html'),
        hakkimizda: resolve(__dirname, 'hakkimizda.html'),
        iletisim: resolve(__dirname, 'iletisim.html'),
        cerez: resolve(__dirname, 'cerez-politikasi.html')
      }
    }
  }
});
