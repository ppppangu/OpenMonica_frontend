import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import ChatBox from './ChatBox.vue'
import ChatFrame from './ChatFrame.vue'
import ChatList from './ChatList.vue'
import XStream from './xStream.vue'
import Hello from './hello.vue'
import { useUserStore } from '../store/user_info'
import { useChatHistoryStore } from '../store/chat_history'
import { useChatHistoryContentStore } from '../store/chat_history_content'

// 创建Pinia实例
const pinia = createPinia()

// 设置活跃的Pinia实例
setActivePinia(pinia)

// 聊天页面功能
document.addEventListener('DOMContentLoaded', () => {
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

    // 初始化stores - 在所有组件挂载后
    setTimeout(async () => {
        console.log('Initializing stores...')

        const userStore = useUserStore()
        await userStore.initializeFromStorage()
        console.log('User store initialized:', userStore.user);

        // 检查用户是否已登录，如果没有则重定向到登录页面
        if (!userStore.isLoggedIn) {
            console.log('User not authenticated, redirecting to login...')
            window.location.href = '/src/login/signin.html'
            return
        }

        const chatHistoryStore = useChatHistoryStore()

        // 获取最新的聊天记录列表
        await chatHistoryStore.getChatHistoryList()
        console.log('Chat history fetched from API, current list:', chatHistoryStore.chatHistoryList)

        // 获取最新的聊天记录内容
        const chatContentsStore = useChatHistoryContentStore()
        await chatContentsStore.getChatHistoryContent(chatHistoryStore.activeChatHistoryItem?.session_id || '')
        console.log('Chat history content fetched from API, current content:', chatContentsStore.chatHistoryContent)
    }, 100) // 稍微增加延迟确保组件完全挂载


});
