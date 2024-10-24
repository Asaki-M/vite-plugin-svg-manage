import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'
import VitePluginSvgManage from '..'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      'ASSETS': resolve(__dirname, './src/assets')
    }
  },
  plugins: [vue(), UnoCSS(), VitePluginSvgManage()],
  build: {
    target: 'esnext',
    minify: true, // 'esbuild',
    emptyOutDir: true,
    outDir: resolve(__dirname, '../../dist/client')
  },
})
