import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    // Vuetify 按需引入：自动 tree-shake 未使用的组件与样式
    vuetify({ autoImport: true }),
  ],
  build: {
    target: 'es2015',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // 分包：将第三方库拆分为独立 chunk，利用浏览器缓存
        manualChunks: {
          'vue-vendor': ['vue'],
          'vuetify-vendor': ['vuetify'],
          'chart-vendor': ['chart.js', 'vue-chartjs'],
          'typeit-vendor': ['typeit'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
