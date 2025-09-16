import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    // 添加代理配置解决CloudBase证书问题
    proxy: {
      '/tcb': {
        target: 'https://tcb-api.tencentcloudapi.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/tcb/, '')
      },
      '/cloudbase': {
        target: 'https://tcb-api.tencentcloudapi.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cloudbase/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
