import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 官网落地页部署到 GitHub Pages 项目页：
// https://aquarkgn.github.io/HuHaa-MySkills/
// 因此生产构建 base 必须为 '/HuHaa-MySkills/'，否则静态资源 404。
// 本地 dev 用 '/'；若后续绑定自定义域名，构建时传 BASE_URL='/' 覆盖。
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.BASE_URL || (mode === 'production' ? '/HuHaa-MySkills/' : '/'),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 11531,
    open: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 11532,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
  },
}))
