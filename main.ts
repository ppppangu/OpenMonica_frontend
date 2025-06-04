import { createApp } from 'vue'
import './styles.css'
import ChatFrame from './ChatFrame.vue'
import ChatList from './ChatList.vue'
// import { createPinia } from 'pinia'
// import { Plugin } from 'vue'
const chatframeApp = createApp(ChatFrame);
const chatlistApp = createApp(ChatList);
// const pinia = createPinia()
// chatframeApp.use(pinia as Plugin)
// 聊天框
chatframeApp.mount('#chatframe')
// 聊天列表
chatlistApp.mount('#chatlist')