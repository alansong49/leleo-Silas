import { createApp } from 'vue'
import App from './App.vue'

// Vuetify —— 组件与样式均由 vite-plugin-vuetify 按需引入
import { createVuetify } from 'vuetify'
// MDI 图标字体只打包站点实际用到的 79 个图标（4.7KB，原来是 403KB 全量字体 + 800KB CSS）
import './styles/mdi.css'
import './styles/app.less'
import './styles/mobile.less'


const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi', // 这已经是默认值-仅用于显示目的 
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

