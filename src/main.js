import { createApp } from 'vue'
import App from './App.vue'

// Vuetify（vite-plugin-vuetify 会自动按需引入组件样式，无需手动 import *）
import { createVuetify } from 'vuetify'
import { aliases } from 'vuetify/iconsets/mdi-svg'
import { iconAliases, mdiIconSet } from './icons'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      ...iconAliases,
    },
    sets: {
      mdi: mdiIconSet,
    },
  },
  defaults: {
    VCard: {
      variant: 'tonal',
    },
  },
})
const app = createApp(App);
// 仅在生产环境静默警告，开发环境保留以方便调试
if (import.meta.env.PROD) {
  app.config.warnHandler = () => {};
}
app.use(vuetify).mount('#app')
