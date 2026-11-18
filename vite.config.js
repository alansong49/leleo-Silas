import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    // 按需引入 Vuetify 组件 + 样式（原来是全量引入，JS/CSS 都严重超标）
    vuetify({
      autoImport: true,
      styles: { configFile: 'src/settings.scss' },
    }),
  ],
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // 大依赖拆成独立 chunk，首屏只加载必需部分，其余按需/并行加载
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('chart.js') || id.includes('vue-chartjs')) return 'charts'
          if (id.includes('typeit')) return 'typeit'
          return 'vendor'
        },
      },
    },
  },
  esbuild: {
    legalComments: 'none',
    pure: ['console.log', 'console.debug', 'console.info'],
  },
})
