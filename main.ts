import { createApp } from 'vue'
import './styles.css'
import ChatFrame from './ChatFrame.vue'
// import { createPinia } from 'pinia'
// import { Plugin } from 'vue'
const chatframeApp = createApp(ChatFrame);
// const pinia = createPinia()
// chatframeApp.use(pinia as Plugin)
chatframeApp.mount('#chatframe')
