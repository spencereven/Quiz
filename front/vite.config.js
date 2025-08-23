import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        // 默认指向本地开发后端。在 Docker 等环境中，
        // 可以通过设置 VITE_API_BASE_URL 环境变量来覆盖此目标。
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
    allowedHosts: ['quiz.siento.top'],
  },
})
