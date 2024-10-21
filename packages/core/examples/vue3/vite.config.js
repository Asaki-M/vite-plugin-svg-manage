import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VitePluginSvgManage from 'vite-plugin-svg-manage'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePluginSvgManage({
      vue: 3
    })
  ],
})
