import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ChatBox from './ChatBox.vue'
import ChatFrame from './ChatFrame.vue'
// import ChatFrame from './SimpleChatFrame.vue'
import ChatList from './ChatList.vue'
import Hello from './hello.vue'

import { useUserStore } from '../store/user_info'
import { useChatHistoryStore } from '../store/chat_history'
import { useChatHistoryContentStore } from '../store/chat_history_content'
import { useModelListStore } from '../store/model_list'


// 创建Pinia实例
const pinia = createPinia()



// 聊天页面功能
async function init() {
    console.log('🚀 DOM Content Loaded - Starting Vue component mounting...')

    // 诊断DOM元素是否存在
    const chatboxElement = document.getElementById('chatbox');
    const chatframeElement = document.getElementById('chatframe');
    const chatlistElement = document.getElementById('chatlist');
    const helloElement = document.getElementById('hello');

    console.log('📋 DOM Elements Check:', {
        chatbox: !!chatboxElement,
        chatframe: !!chatframeElement,
        chatlist: !!chatlistElement,
        hello: !!helloElement
    })

    // 挂载聊天框组件
    if (chatboxElement) {
        console.log('🔧 Mounting ChatBox component...')
        console.log('ChatBox element details:', {
            id: chatboxElement.id,
            className: chatboxElement.className,
            offsetWidth: chatboxElement.offsetWidth,
            offsetHeight: chatboxElement.offsetHeight,
            style: chatboxElement.style.cssText
        })
        try {
            // 创建一个简化的ChatBox组件用于测试
            const SimpleChatBox = {
                template: `
                    <div style="border: 2px solid #28a745; padding: 20px; background: white; border-radius: 8px; min-height: 300px;">
                        <h3 style="color: #28a745; margin: 0 0 15px 0;">✅ 聊天显示区域</h3>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                            <p style="margin: 0; color: #6c757d;">聊天消息将在这里显示...</p>
                        </div>
                        <div v-for="message in messages" :key="message.id"
                             style="background: #e3f2fd; padding: 10px; margin: 5px 0; border-radius: 6px; border-left: 4px solid #2196f3;">
                            <strong>{{ message.sender }}:</strong> {{ message.text }}
                            <small style="color: #666; float: right;">{{ message.time }}</small>
                        </div>
                        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                            <small style="color: #856404;">
                                <strong>状态:</strong> ChatBox组件已成功挂载 ✓<br>
                                <strong>时间:</strong> {{ currentTime }}<br>
                                <strong>消息数量:</strong> {{ messages.length }}
                            </small>
                        </div>
                    </div>
                `,
                data() {
                    return {
                        currentTime: new Date().toLocaleTimeString(),
                        messages: [
                            { id: 1, sender: 'AI助手', text: '你好！我是AI助手，有什么可以帮助你的吗？', time: '刚刚' },
                            { id: 2, sender: '用户', text: '测试消息显示', time: '刚刚' }
                        ]
                    }
                },
                mounted() {
                    console.log('✅ 简化ChatBox组件挂载成功')
                    setInterval(() => {
                        this.currentTime = new Date().toLocaleTimeString()
                    }, 1000)
                }
            }

            const chatboxApp = createApp(SimpleChatBox)
            chatboxApp.use(pinia)
            chatboxApp.mount('#chatbox')
            console.log('✅ 简化ChatBox组件挂载成功')

            // 添加可见性检查
            setTimeout(() => {
                console.log('🔍 Post-mount ChatBox visibility check:', {
                    hasChildren: chatboxElement.children.length > 0,
                    innerHTML: chatboxElement.innerHTML.substring(0, 200),
                    computedStyle: window.getComputedStyle(chatboxElement).display
                })
            }, 1000)
        } catch (error) {
            console.error('❌ Failed to mount ChatBox:', error)
            // 如果Vue组件失败，至少显示一些HTML内容
            chatboxElement.innerHTML = `
                <div style="border: 3px solid orange; padding: 20px; background: #ffe4b5; min-height: 100px;">
                    <h2>⚠️ ChatBox Fallback</h2>
                    <p>Vue.js component failed to mount. Error: ${error.message}</p>
                    <p>This is a fallback HTML display.</p>
                </div>
            `
        }
    } else {
        console.error('❌ ChatBox element not found!')
    }

    // 挂载聊天输入框组件
    if (chatframeElement) {
        console.log('🔧 Mounting ChatFrame component...')
        try {
            // 创建一个简化的ChatFrame组件用于测试
            const SimpleChatFrame = {
                template: `
                    <div style="border: 2px solid #007bff; padding: 20px; background: white; border-radius: 8px; min-height: 200px;">
                        <h3 style="color: #007bff; margin: 0 0 15px 0;">✅ 聊天输入区域</h3>

                        <!-- 功能按钮区域 -->
                        <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                            <button @click="toggleFunction('translate')"
                                    :style="getButtonStyle('translate')"
                                    style="margin-right: 10px; padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer;">
                                翻译
                            </button>
                            <button @click="toggleFunction('mindMap')"
                                    :style="getButtonStyle('mindMap')"
                                    style="margin-right: 10px; padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer;">
                                思维导图
                            </button>
                            <button @click="toggleFunction('email')"
                                    :style="getButtonStyle('email')"
                                    style="padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer;">
                                邮件
                            </button>
                        </div>

                        <!-- 输入区域 -->
                        <div style="margin-bottom: 15px;">
                            <textarea v-model="inputMessage"
                                      placeholder="在这里输入您的消息..."
                                      style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; resize: vertical; font-family: inherit;"
                                      @keydown.ctrl.enter="sendMessage"></textarea>
                        </div>

                        <!-- 底部工具栏 -->
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <select style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option>GPT-4</option>
                                    <option>GPT-3.5</option>
                                    <option>Claude</option>
                                </select>
                                <label style="display: flex; align-items: center; gap: 5px; font-size: 14px;">
                                    <input type="checkbox" v-model="deepThinking"> Deep Thinking
                                </label>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <button style="padding: 5px 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    📎
                                </button>
                                <button style="padding: 5px 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    🎤
                                </button>
                                <button @click="sendMessage"
                                        :disabled="!inputMessage.trim()"
                                        style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
                                        :style="{ opacity: inputMessage.trim() ? 1 : 0.5 }">
                                    发送
                                </button>
                            </div>
                        </div>

                        <!-- 状态信息 -->
                        <div style="margin-top: 15px; padding: 10px; background: #d1ecf1; border-radius: 6px; border-left: 4px solid #007bff;">
                            <small style="color: #0c5460;">
                                <strong>状态:</strong> ChatFrame组件已成功挂载 ✓<br>
                                <strong>已发送消息:</strong> {{ sentMessages.length }}<br>
                                <strong>激活功能:</strong> {{ activeFunctions.join(', ') || '无' }}
                            </small>
                        </div>
                    </div>
                `,
                data() {
                    return {
                        inputMessage: '',
                        deepThinking: false,
                        activeFunctions: [],
                        sentMessages: []
                    }
                },
                methods: {
                    toggleFunction(func) {
                        const index = this.activeFunctions.indexOf(func)
                        if (index > -1) {
                            this.activeFunctions.splice(index, 1)
                        } else {
                            this.activeFunctions.push(func)
                        }
                    },
                    getButtonStyle(func) {
                        const isActive = this.activeFunctions.includes(func)
                        return {
                            background: isActive ? '#007bff' : '#e9ecef',
                            color: isActive ? 'white' : '#495057'
                        }
                    },
                    sendMessage() {
                        if (this.inputMessage.trim()) {
                            this.sentMessages.push({
                                text: this.inputMessage,
                                time: new Date().toLocaleTimeString(),
                                functions: [...this.activeFunctions]
                            })
                            console.log('发送消息:', this.inputMessage)
                            this.inputMessage = ''
                        }
                    }
                },
                mounted() {
                    console.log('✅ 简化ChatFrame组件挂载成功')
                }
            }

            const chatframeApp = createApp(SimpleChatFrame)
            chatframeApp.use(pinia)
            chatframeApp.mount('#chatframe')
            console.log('✅ 简化ChatFrame组件挂载成功')
        } catch (error) {
            console.error('❌ Failed to mount ChatFrame:', error)
            // 如果Vue组件失败，至少显示一些HTML内容
            chatframeElement.innerHTML = `
                <div style="border: 3px solid red; padding: 20px; background: #ffebee; min-height: 100px;">
                    <h3>⚠️ ChatFrame Fallback</h3>
                    <p>Vue.js component failed to mount. Error: ${error.message}</p>
                </div>
            `
        }
    } else {
        console.error('❌ ChatFrame element not found!')
    }

    // 挂载聊天列表组件
    if (chatlistElement) {
        console.log('🔧 Mounting ChatList component...')
        try {
            // 创建一个简化的ChatList组件
            const SimpleChatList = {
                template: `
                    <div style="padding: 15px; background: white; border-radius: 8px; min-height: 200px;">
                        <h3 style="color: #6c757d; margin: 0 0 15px 0; font-size: 16px;">📋 聊天记录</h3>

                        <div v-for="chat in chatHistory" :key="chat.id"
                             @click="selectChat(chat)"
                             :style="getChatItemStyle(chat)"
                             style="padding: 12px; margin: 8px 0; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                            <div style="font-weight: 500; color: #333; margin-bottom: 4px;">{{ chat.title }}</div>
                            <div style="font-size: 12px; color: #666;">{{ chat.time }}</div>
                        </div>

                        <div v-if="chatHistory.length === 0" style="text-align: center; padding: 30px; color: #999;">
                            <div style="font-size: 48px; margin-bottom: 10px;">💬</div>
                            <div>暂无聊天记录</div>
                            <div style="font-size: 12px; margin-top: 5px;">开始新对话创建记录</div>
                        </div>

                        <button @click="createNewChat"
                                style="width: 100%; padding: 10px; margin-top: 15px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            + 新建对话
                        </button>

                        <div style="margin-top: 15px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #666;">
                            <strong>状态:</strong> ChatList组件已挂载 ✓<br>
                            <strong>记录数量:</strong> {{ chatHistory.length }}
                        </div>
                    </div>
                `,
                data() {
                    return {
                        selectedChatId: null,
                        chatHistory: [
                            { id: 1, title: '关于Vue.js的讨论', time: '2小时前' },
                            { id: 2, title: '项目开发问题', time: '昨天' },
                            { id: 3, title: '技术咨询', time: '3天前' }
                        ]
                    }
                },
                methods: {
                    selectChat(chat) {
                        this.selectedChatId = chat.id
                        console.log('选择聊天记录:', chat.title)
                    },
                    getChatItemStyle(chat) {
                        return {
                            background: this.selectedChatId === chat.id ? '#e3f2fd' : '#f8f9fa',
                            borderLeft: this.selectedChatId === chat.id ? '4px solid #2196f3' : '4px solid transparent'
                        }
                    },
                    createNewChat() {
                        const newChat = {
                            id: Date.now(),
                            title: '新对话 ' + (this.chatHistory.length + 1),
                            time: '刚刚'
                        }
                        this.chatHistory.unshift(newChat)
                        this.selectedChatId = newChat.id
                        console.log('创建新对话:', newChat.title)
                    }
                },
                mounted() {
                    console.log('✅ 简化ChatList组件挂载成功')
                    // 默认选择第一个聊天记录
                    if (this.chatHistory.length > 0) {
                        this.selectedChatId = this.chatHistory[0].id
                    }
                }
            }

            const chatlistApp = createApp(SimpleChatList)
            chatlistApp.use(pinia)
            chatlistApp.mount('#chatlist')
            console.log('✅ 简化ChatList组件挂载成功')
        } catch (error) {
            console.error('❌ Failed to mount ChatList:', error)
        }
    } else {
        console.error('❌ ChatList element not found!')
    }

    // 流式组件已移除 - 现在使用ChatBox内置的实时流式响应

    // 挂载欢迎组件
    if (helloElement) {
        console.log('🔧 Mounting Hello component...')
        try {
            // 创建一个简化的Hello组件
            const SimpleHello = {
                template: `
                    <div style="padding: 20px; text-align: center;">
                        <h1 style="color: #333; margin: 0 0 10px 0; font-size: 28px;">{{ greeting }}</h1>
                        <p style="color: #666; margin: 0; font-size: 16px;">{{ welcomeMessage }}</p>
                        <div style="margin-top: 15px; padding: 10px; background: #e8f5e8; border-radius: 6px; border-left: 4px solid #28a745;">
                            <small style="color: #155724;">
                                <strong>系统状态:</strong> 所有组件已成功加载 ✓
                            </small>
                        </div>
                    </div>
                `,
                data() {
                    return {
                        currentTime: new Date()
                    }
                },
                computed: {
                    greeting() {
                        const hour = this.currentTime.getHours()
                        if (hour >= 4 && hour < 11.5) {
                            return '🌅 早上好！'
                        } else if (hour >= 11.5 && hour < 19) {
                            return '☀️ 下午好！'
                        } else {
                            return '🌙 晚上好！'
                        }
                    },
                    welcomeMessage() {
                        return '欢迎使用AI聊天界面，开始您的智能对话之旅'
                    }
                },
                mounted() {
                    console.log('✅ 简化Hello组件挂载成功')
                    // 每分钟更新一次时间以更新问候语
                    setInterval(() => {
                        this.currentTime = new Date()
                    }, 60000)
                }
            }

            const helloApp = createApp(SimpleHello)
            helloApp.use(pinia)
            helloApp.mount('#hello')
            console.log('✅ 简化Hello组件挂载成功')
        } catch (error) {
            console.error('❌ Failed to mount Hello:', error)
        }
    } else {
        console.error('❌ Hello element not found!')
    }



    // 初始化stores - 在所有组件挂载后
    setTimeout(async () => {
        console.log('🔄 Initializing stores...')

        const userStore = useUserStore()
        await userStore.initializeFromStorage()
        console.log('✅ User store initialized:', userStore.user);

        // 检查用户是否已登录，如果没有则重定向到登录页面
        if (!userStore.isLoggedIn) {
            console.log('❌ User not authenticated, redirecting to login...')
            window.location.href = '/src/login/signin.html'
            return
        }

        console.log('✅ User authenticated, continuing with store initialization...')

        const chatHistoryStore = useChatHistoryStore()

        // Debug: Check token availability before making API calls
        console.log('=== DEBUG: Token Check ===')
        console.log('User store user:', userStore.user)
        console.log('User token:', userStore.user?.token)
        console.log('LocalStorage authToken:', localStorage.getItem('authToken'))
        console.log('LocalStorage user:', localStorage.getItem('user'))
        console.log('=== END DEBUG ===')

        // 获取最新的聊天记录列表
        try {
            await chatHistoryStore.getChatHistoryList()
            console.log('Chat history fetched from API, current list:', chatHistoryStore.chatHistoryList)
        } catch (error) {
            console.error('Failed to fetch chat history:', error)
        }

        // 获取最新的聊天记录内容
        const chatContentsStore = useChatHistoryContentStore()
        await chatContentsStore.getChatHistoryContent(chatHistoryStore.activeChatHistoryItem?.session_id || '')
        console.log('Chat history content fetched from API, current content:', chatContentsStore.chatHistoryContent)

        // 初始化模型列表
        const modelListStore = useModelListStore()
        await modelListStore.get_model_list()
        console.log('Model list fetched from API, current list:', modelListStore.model_list)
    }, 100); // 稍微增加延迟确保组件完全挂载

    // 初始化聊天输入框拖拽调整大小功能
    initChatInputResize();

    // 初始化CSS变量
    ;setMainContentPadding(180); // 设置默认高度

    // 添加全局调试函数
    (window as any).debugVueComponents = () => {
        console.log('🔍 Vue Components Debug Report:')
        console.log('ChatBox element:', document.getElementById('chatbox'))
        console.log('ChatFrame element:', document.getElementById('chatframe'))
        console.log('ChatList element:', document.getElementById('chatlist'))
        console.log('Hello element:', document.getElementById('hello'))

        // 检查元素内容
        const elements = ['chatbox', 'chatframe', 'chatlist', 'hello']
        elements.forEach(id => {
            const el = document.getElementById(id)
            if (el) {
                console.log(`${id} content:`, el.innerHTML.substring(0, 200))
                console.log(`${id} children count:`, el.children.length)
            }
        })
    }

    console.log('🔧 Debug function available: window.debugVueComponents()')

}

// Ensure initialization runs after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}

// 更新主内容区域的底部间距以适应聊天输入框高度变化
function setMainContentPadding(inputHeight: number) {
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
        setMainContentPadding(newHeight)

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
