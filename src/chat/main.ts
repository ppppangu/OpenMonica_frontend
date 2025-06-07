import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import ChatBox from './ChatBox.vue'
import ChatFrame from './ChatFrame.vue'
import ChatList from './ChatList.vue'
import XStream from './xStream.vue'
import Hello from './hello.vue'
import { useUserStore } from '../store/user_info'

// 创建Pinia实例
const pinia = createPinia()

// 聊天页面功能
document.addEventListener('DOMContentLoaded', () => {
    // 设置活跃的Pinia实例
    setActivePinia(pinia)

    // 现在可以安全地使用store
    const userStore = useUserStore()
    userStore.initializeFromStorage()
    console.log(userStore.user);

    // 挂载聊天框组件
    const chatboxElement = document.getElementById('chatbox');
    if (chatboxElement) {
        const chatboxApp = createApp(ChatBox)
        chatboxApp.use(pinia)
        chatboxApp.mount('#chatbox')
    }

    // 挂载聊天输入框组件
    const chatframeElement = document.getElementById('chatframe');
    if (chatframeElement) {
        const chatframeApp = createApp(ChatFrame)
        chatframeApp.use(pinia)
        chatframeApp.mount('#chatframe')
    }

    // 挂载聊天列表组件
    const chatlistElement = document.getElementById('chatlist');
    if (chatlistElement) {
        const chatlistApp = createApp(ChatList)
        chatlistApp.use(pinia)
        chatlistApp.mount('#chatlist')
    }

    // 挂载流式组件
    const streamElement = document.getElementById('stream');
    if (streamElement) {
        const streamApp = createApp(XStream)
        streamApp.use(pinia)
        streamApp.mount('#stream')
    }

    // 挂载欢迎组件
    const helloElement = document.getElementById('hello');
    if (helloElement) {
        const helloApp = createApp(Hello)
        helloApp.use(pinia)
        helloApp.mount('#hello')
    }
});
