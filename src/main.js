import { createApp } from 'vue'
import App from './App.vue'

// Vuetify —— 组件按需由 vite-plugin-vuetify 注入；
// 但基础层（reset / 字体的 font-family+line-height / 间距工具类 pa-* ma-* / 过渡动画 fade-dialog-slide）必须显式引入，
// 否则布局尺寸、字体、弹窗动画都和原版不一致
import 'vuetify/styles'
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

