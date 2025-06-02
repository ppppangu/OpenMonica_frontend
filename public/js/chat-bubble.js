// 聊天气泡组件 - 强制使用 ant-design-x-vue
let chatApp = null;
let isStreamingActive = false;

// 全局变量存储累积的流式内容
window.globalStreamingContent = '';

// 初始化聊天组件
function initChatBubble() {
    const { createApp, ref, reactive, onMounted, nextTick, h } = Vue;

    // 强制使用 ant-design-x-vue 组件
    console.log('强制使用 ant-design-x-vue Bubble 组件');

    // 检查 ant-design-x-vue 是否已加载
    if (typeof window.antdx === 'undefined') {
        console.error('ant-design-x-vue 未加载，请检查CDN链接');
        // 仍然尝试使用，可能是全局变量名不同
    }

    // 尝试获取 Bubble 组件
    let Bubble;
    if (window.antdx && window.antdx.Bubble) {
        Bubble = window.antdx.Bubble;
        console.log('找到 antdx.Bubble 组件');
    } else {
        console.error('无法找到 Bubble 组件，可用的全局变量:', Object.keys(window).filter(key => key.toLowerCase().includes('ant')));
        console.log('使用备用方案');
        initSimpleChatBubble();
        return;
    }

    chatApp = createApp({
        components: {
            Bubble
        },
        setup() {
            // 当前用户消息（来自全局变量）
            const currentUserMessage = ref('');

            // 当前流式消息
            const streamingMessage = ref('');
            const isStreaming = ref(false);

            // 聊天界面是否显示
            const chatVisible = ref(false);

            // 获取当前用户输入的最后一条消息
            const getCurrentUserMessage = () => {
                if (window.globalData && window.globalData.userInput && window.globalData.userInput.length > 0) {
                    const lastMessage = window.globalData.userInput[window.globalData.userInput.length - 1];
                    return lastMessage.content || '';
                }
                return '';
            };

            // 开始流式响应
            const startStreaming = () => {
                // 清空之前的对话内容，开始新对话
                streamingMessage.value = '';
                window.globalStreamingContent = ''; // 重置全局累积内容
                isStreamingActive = true;
                isStreaming.value = true;
                // 更新当前用户消息
                currentUserMessage.value = getCurrentUserMessage();
                // 显示聊天界面
                showChat();
            };

            // 更新流式消息内容
            const updateStreamingMessage = (content) => {
                streamingMessage.value = content; // 直接设置内容，不累积
                // 自动滚动到底部
                nextTick(() => {
                    const container = document.querySelector('.chat-messages-container');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                });
            };

            // 结束流式响应
            const endStreaming = () => {
                isStreaming.value = false;
                // 不清空 streamingMessage，保持AI回答显示
                isStreamingActive = false;
                // 保持用户消息显示，不清空
            };

            // 显示聊天界面
            const showChat = () => {
                console.log('显示聊天界面'); // 调试信息
                chatVisible.value = true;
                // 隐藏所有主要内容区域，显示聊天区域
                const toolsSection = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
                const bottomSection = document.querySelector('section.mt-8'); // "在所有平台实时互通使用智达AI助手"区域

                if (toolsSection) {
                    toolsSection.style.display = 'none';
                    console.log('隐藏工具区域');
                }
                // 不隐藏senderApp，让它保持可见
                if (bottomSection) {
                    bottomSection.style.display = 'none';
                    console.log('隐藏底部区域');
                }
                console.log('聊天界面显示状态:', chatVisible.value);
            };

            // 隐藏聊天界面
            const hideChat = () => {
                chatVisible.value = false;
                // 显示所有原始内容区域，隐藏聊天区域
                const toolsSection = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
                const bottomSection = document.querySelector('section.mt-8');

                if (toolsSection) {
                    toolsSection.style.display = 'grid';
                }
                if (bottomSection) {
                    bottomSection.style.display = 'flex';
                }
                // senderApp保持显示，不需要特别处理
            };

            // 清空聊天记录
            const clearChat = () => {
                currentUserMessage.value = '';
                streamingMessage.value = '';
                isStreaming.value = false;
                window.globalStreamingContent = '';
                isStreamingActive = false;
            };

            // 暴露方法给全局使用
            window.chatBubbleAPI = {
                startStreaming,
                updateStreamingMessage,
                endStreaming,
                showChat,
                hideChat,
                clearChat
            };

            return {
                currentUserMessage,
                streamingMessage,
                isStreaming,
                chatVisible,
                showChat,
                hideChat,
                clearChat
            };
        },
        template: `
            <div id="chatContainer" v-show="chatVisible" class="chat-container bg-white rounded-xl shadow-sm">
                <div class="chat-header flex justify-between items-center p-4 border-b bg-white rounded-t-xl">
                    <h2 class="text-xl font-semibold text-gray-700">AI 对话</h2>
                    <div class="flex space-x-2">
                        <button @click="clearChat" class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">
                            清空对话
                        </button>
                        <button @click="hideChat" class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">
                            返回工具
                        </button>
                    </div>
                </div>

                <div class="chat-messages-container overflow-y-auto p-4" style="height: 600px;">
                    <!-- 欢迎消息 -->
                    <div v-if="!currentUserMessage && !isStreaming && !streamingMessage" class="mb-6">
                        <Bubble
                            content="您好！我是智达AI助手，在所有平台实时互通使用。我可以帮助您解答问题、生成内容、分析数据等。请告诉我您需要什么帮助？"
                            placement="start"
                            :avatar="{ src: '', children: '🤖' }"
                            variant="outlined"
                        />
                    </div>

                    <!-- 当前用户消息 -->
                    <div v-if="currentUserMessage" class="mb-4">
                        <Bubble
                            :content="currentUserMessage"
                            placement="end"
                            :avatar="{ src: '', children: '👤' }"
                            variant="filled"
                        />
                    </div>

                    <!-- 流式消息 -->
                    <div v-if="isStreaming" class="mb-4">
                        <Bubble
                            :content="streamingMessage || '正在思考中...'"
                            placement="start"
                            :avatar="{ src: '', children: '🤖' }"
                            variant="outlined"
                            :loading="!streamingMessage"
                            :messageRender="(content) => h('div', { style: { whiteSpace: 'pre-wrap' } }, content)"
                        />
                    </div>

                    <!-- 已完成的AI回答 -->
                    <div v-if="!isStreaming && streamingMessage && currentUserMessage" class="mb-4">
                        <Bubble
                            :content="streamingMessage"
                            placement="start"
                            :avatar="{ src: '', children: '🤖' }"
                            variant="outlined"
                            :messageRender="(content) => h('div', { style: { whiteSpace: 'pre-wrap' } }, content)"
                        />
                    </div>
                </div>
            </div>
        `
    });

    // 挂载到页面
    const chatMountPoint = document.getElementById('chatBubbleApp');
    if (chatMountPoint) {
        chatApp.mount(chatMountPoint);
        console.log('聊天气泡组件已初始化');

        // 添加测试按钮（仅用于调试）
        if (window.location.search.includes('debug=true')) {
            const testButton = document.createElement('button');
            testButton.textContent = '测试聊天';
            testButton.className = 'fixed top-4 left-4 z-50 px-4 py-2 bg-blue-500 text-white rounded';
            testButton.onclick = () => {
                if (window.chatBubbleAPI) {
                    // 模拟用户输入
                    if (window.globalData) {
                        window.globalData.userInput = [{
                            role: 'user',
                            content: '这是一条测试消息'
                        }];
                    }
                    window.chatBubbleAPI.showChat();
                    window.chatBubbleAPI.startStreaming();
                    setTimeout(() => {
                        window.chatBubbleAPI.updateStreamingMessage('这是一条流式响应测试...');
                    }, 1000);
                    setTimeout(() => {
                        window.chatBubbleAPI.endStreaming();
                    }, 3000);
                }
            };
            document.body.appendChild(testButton);
        }
    } else {
        console.error('找不到聊天组件挂载点 #chatBubbleApp');
    }
}

// 处理流式聊天响应
async function handleStreamingChat(requestBody) {
    try {
        // 显示聊天界面并开始流式响应
        if (window.chatBubbleAPI) {
            window.chatBubbleAPI.startStreaming();
        }

        // 发送流式请求
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 处理完整的行
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一个不完整的行

            for (const line of lines) {
                if (line.trim() === '') continue; // 跳过空行

                if (line.startsWith('data: ')) {
                    const content = line.slice(6); // 移除 "data: " 前缀，保留所有内容包括空格

                    // 检查结束标记
                    if (content.trim() === '[DONE]') {
                        if (window.chatBubbleAPI) {
                            window.chatBubbleAPI.endStreaming();
                        }
                        return;
                    }

                    // 尝试解析JSON格式（兼容旧格式）
                    try {
                        const data = JSON.parse(content);

                        // 检查是否有错误
                        if (data.error) {
                            console.error('服务器返回错误:', data.error);
                            if (window.chatBubbleAPI) {
                                window.chatBubbleAPI.endStreaming();
                            }
                            throw new Error(data.error);
                        }

                        if (data.content && window.chatBubbleAPI) {
                            // 使用全局变量累积内容
                            window.globalStreamingContent += data.content;
                            console.log('累积JSON内容:', window.globalStreamingContent);
                            // 更新显示的内容为累积的完整内容
                            window.chatBubbleAPI.updateStreamingMessage(window.globalStreamingContent);
                        }

                        if (data.done) {
                            if (window.chatBubbleAPI) {
                                window.chatBubbleAPI.endStreaming();
                            }
                            return;
                        }
                    } catch (e) {
                        // 如果不是JSON格式，直接作为文本内容处理
                        if (content && window.chatBubbleAPI) {
                            // 使用全局变量累积内容，保持原始格式包括换行符
                            window.globalStreamingContent += content;
                            console.log('累积文本内容:', window.globalStreamingContent);
                            // 更新显示的内容为累积的完整内容
                            window.chatBubbleAPI.updateStreamingMessage(window.globalStreamingContent);
                        }
                    }
                }
            }
        }

        // 确保结束流式响应
        if (window.chatBubbleAPI) {
            window.chatBubbleAPI.endStreaming();
        }

    } catch (error) {
        console.error('流式聊天请求失败:', error);

        if (window.chatBubbleAPI) {
            window.chatBubbleAPI.endStreaming();
            // 显示具体的错误消息
            const errorMessage = error.message || '发生了未知错误，请重试。';
            window.globalStreamingContent = `❌ 错误: ${errorMessage}`;
            if (window.chatBubbleAPI.updateStreamingMessage) {
                window.chatBubbleAPI.updateStreamingMessage(window.globalStreamingContent);
            }
        }
    }
}

// 简化版聊天组件（备用方案）
function initSimpleChatBubble() {
    const { createApp, ref, nextTick } = Vue;

    chatApp = createApp({
        setup() {
            const messages = ref([]);
            const streamingMessage = ref('');
            const isStreaming = ref(false);
            const chatVisible = ref(false);

            // 监听全局流式内容变化
            const updateFromGlobal = () => {
                if (window.globalStreamingContent !== undefined) {
                    streamingMessage.value = window.globalStreamingContent;
                }
            };

            // 定期检查全局变量更新
            setInterval(updateFromGlobal, 100);

            const addMessage = (content, role = 'user') => {
                messages.value.push({
                    id: Date.now(),
                    content: content,
                    role: role,
                    timestamp: new Date()
                });
                nextTick(() => {
                    const container = document.querySelector('.chat-messages-container');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                });
            };

            const startStreaming = () => {
                isStreaming.value = true;
                streamingMessage.value = '';
                window.globalStreamingContent = ''; // 重置全局累积内容
                isStreamingActive = true;
                // 显示聊天界面
                showChat();
            };

            const updateStreamingMessage = (content) => {
                // 直接使用全局变量的内容
                streamingMessage.value = window.globalStreamingContent || content;
                nextTick(() => {
                    const container = document.querySelector('.chat-messages-container');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                });
            };

            const endStreaming = () => {
                if (streamingMessage.value.trim()) {
                    addMessage(streamingMessage.value, 'assistant');
                }
                isStreaming.value = false;
                streamingMessage.value = '';
                isStreamingActive = false;
            };

            const showChat = () => {
                chatVisible.value = true;
                const toolsSection = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
                const bottomSection = document.querySelector('section.mt-8');

                if (toolsSection) {
                    toolsSection.style.display = 'none';
                }
                // 不隐藏senderApp，让它保持可见
                if (bottomSection) {
                    bottomSection.style.display = 'none';
                }
            };

            const hideChat = () => {
                chatVisible.value = false;
                const toolsSection = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
                const bottomSection = document.querySelector('section.mt-8');

                if (toolsSection) {
                    toolsSection.style.display = 'grid';
                }
                if (bottomSection) {
                    bottomSection.style.display = 'flex';
                }
                // senderApp保持显示，不需要特别处理
            };

            const clearChat = () => {
                messages.value = [];
                streamingMessage.value = '';
                isStreaming.value = false;
            };

            window.chatBubbleAPI = {
                addMessage,
                startStreaming,
                updateStreamingMessage,
                endStreaming,
                showChat,
                hideChat,
                clearChat
            };

            return {
                messages,
                streamingMessage,
                isStreaming,
                chatVisible,
                showChat,
                hideChat,
                clearChat
            };
        },
        template: `
            <div id="chatContainer" v-show="chatVisible" class="chat-container bg-white rounded-xl shadow-sm">
                <div class="chat-header flex justify-between items-center p-4 border-b bg-white rounded-t-xl">
                    <h2 class="text-xl font-semibold text-gray-700">AI 对话</h2>
                    <div class="flex space-x-2">
                        <button @click="clearChat" class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">
                            清空对话
                        </button>
                        <button @click="hideChat" class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600">
                            返回工具
                        </button>
                    </div>
                </div>

                <div class="chat-messages-container overflow-y-auto p-4" style="height: 600px;">
                    <!-- 欢迎消息 -->
                    <div v-if="messages.length === 0 && !isStreaming" class="mb-6">
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
                                    🤖
                                </div>
                            </div>
                            <div class="max-w-2xl px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
                                <div class="text-sm text-gray-800">您好！我是智达AI助手，在所有平台实时互通使用。我可以帮助您解答问题、生成内容、分析数据等。请告诉我您需要什么帮助？</div>
                            </div>
                        </div>
                    </div>

                    <!-- 历史消息 -->
                    <div v-for="message in messages" :key="message.id" class="mb-4">
                        <div :class="[
                            'flex items-start space-x-3',
                            message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        ]">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                                     :class="message.role === 'user' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'">
                                    {{ message.role === 'user' ? '👤' : '🤖' }}
                                </div>
                            </div>
                            <div :class="[
                                'max-w-2xl px-4 py-3 rounded-lg',
                                message.role === 'user'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-100 text-gray-800 border'
                            ]">
                                <div class="text-sm whitespace-pre-wrap">{{ message.content }}</div>
                                <div class="text-xs mt-1 opacity-70">
                                    {{ new Date(message.timestamp).toLocaleTimeString() }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 流式消息 -->
                    <div v-if="isStreaming" class="mb-4">
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm">
                                    🤖
                                </div>
                            </div>
                            <div class="max-w-2xl px-4 py-3 rounded-lg bg-gray-100 text-gray-800 border">
                                <div v-if="streamingMessage" class="text-sm whitespace-pre-wrap">{{ streamingMessage }}</div>
                                <div v-else class="text-sm">正在思考中...</div>
                                <div v-if="!streamingMessage" class="flex space-x-1 mt-2">
                                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                                </div>
                                <div v-else class="text-xs mt-1 opacity-70">正在输入...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    });

    const chatMountPoint = document.getElementById('chatBubbleApp');
    if (chatMountPoint) {
        chatApp.mount(chatMountPoint);
        console.log('简化版聊天气泡组件已初始化');
    }
}

// 导出函数供全局使用
window.initChatBubble = initChatBubble;
window.handleStreamingChat = handleStreamingChat;
