import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ChatBox from './ChatBox.vue'
import ChatFrame from './ChatFrame.vue'
import ChatList from './ChatList.vue'
import Hello from './hello.vue'

import { useUserStore } from '../store/user_info'
import { useChatHistoryStore } from '../store/chat_history'
import { useChatHistoryContentStore } from '../store/chat_history_content'
import { useModelListStore } from '../store/model_list'


// 创建Pinia实例
const pinia = createPinia()



// 聊天页面功能
document.addEventListener('DOMContentLoaded', async () => {
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

    // 流式组件已移除 - 现在使用ChatBox内置的实时流式响应

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

        // 初始化模型列表
        const modelListStore = useModelListStore()
        await modelListStore.get_model_list()
        console.log('Model list fetched from API, current list:', modelListStore.model_list)
    }, 100) // 稍微增加延迟确保组件完全挂载

    // 初始化聊天输入框拖拽调整大小功能
    initChatInputResize()

    // 初始化CSS变量
    updateMainContentPadding(180) // 设置默认高度


});

// 更新主内容区域的底部间距以适应聊天输入框高度变化
function updateMainContentPadding(inputHeight: number) {
    const mainContentElement = document.getElementById('container-main-content')
    if (mainContentElement) {
        mainContentElement.style.setProperty('--chat-input-height', `${inputHeight}px`)
    }
}

// 聊天输入框拖拽调整大小功能
function initChatInputResize() {
    const chatInputContainer = document.getElementById('container-chat-input')

    if (!chatInputContainer) {
        console.warn('Chat input container not found')
        return
    }

    let isResizing = false
    let startY = 0
    let startHeight = 0

    // 检测鼠标是否在容器顶部边缘
    function isInResizeArea(e: MouseEvent): boolean {
        const rect = chatInputContainer.getBoundingClientRect()
        return e.clientY >= rect.top - 5 && e.clientY <= rect.top + 10
    }

    // 鼠标移动事件 - 更新光标样式
    chatInputContainer.addEventListener('mousemove', (e) => {
        if (isResizing) return

        if (isInResizeArea(e)) {
            chatInputContainer.style.cursor = 'ns-resize'
        } else {
            chatInputContainer.style.cursor = 'default'
        }
    })

    // 鼠标离开容器
    chatInputContainer.addEventListener('mouseleave', () => {
        if (!isResizing) {
            chatInputContainer.style.cursor = 'default'
        }
    })

    // 鼠标按下事件
    chatInputContainer.addEventListener('mousedown', (e) => {
        if (!isInResizeArea(e)) return

        isResizing = true
        startY = e.clientY
        startHeight = chatInputContainer.offsetHeight

        // 添加拖拽状态类
        chatInputContainer.classList.add('resizing')

        // 防止文本选择
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'ns-resize'

        e.preventDefault()
    })

    // 全局鼠标移动事件
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return

        // 计算新高度（向上拖拽增加高度）
        const deltaY = startY - e.clientY // 向上拖拽为正值
        const newHeight = Math.max(180, Math.min(450, startHeight + deltaY))

        chatInputContainer.style.height = `${newHeight}px`

        // 更新CSS变量以动态调整主内容区域的底部间距
        updateMainContentPadding(newHeight)

        e.preventDefault()
    })

    // 全局鼠标释放事件
    document.addEventListener('mouseup', () => {
        if (!isResizing) return

        isResizing = false

        // 移除拖拽状态类
        chatInputContainer.classList.remove('resizing')

        // 恢复默认样式
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
        chatInputContainer.style.cursor = 'default'
    })
}
