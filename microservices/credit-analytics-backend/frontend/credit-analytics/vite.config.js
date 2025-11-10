import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    allowedHosts: ['рефенансье.рф', 'xn--80ajab2bbqnw9f.xn--p1ai'],
    proxy: {
      '/api': {
        target: 'http://localhost:8100',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: '../../../../frontend/client/widgets/refinance',
    emptyOutDir: true,
  },
})
