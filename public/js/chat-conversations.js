// 聊天会话列表管理
let conversations = [];
let activeSessionId = '';

// 获取聊天会话列表
async function fetchConversations() {
    // 检查用户登录状态
    if (!window.globalData || !window.globalData.userInfo || !window.globalData.userInfo.isLoggedIn) {
        console.error('用户未登录，无法获取会话列表');
        renderConversations(); // 渲染空状态
        return;
    }

    const userId = window.globalData.userInfo.uuid || window.globalData.user_id;
    if (!userId) {
        console.error('用户ID不存在，无法获取会话列表');
        renderConversations(); // 渲染空状态
        return;
    }

    try {
        console.log('正在获取会话列表，用户ID:', userId);

        // 使用session管理器获取会话列表
        if (window.sessionManager && typeof window.sessionManager.fetchSessionList === 'function') {
            const sessionData = await window.sessionManager.fetchSessionList(userId);

            if (sessionData && Array.isArray(sessionData)) {
                // 按时间戳排序（最新的在前）
                const sortedData = sessionData.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );

                // 转换为组件需要的格式
                conversations = sortedData.map((item, index) => ({
                    key: item.session_id,
                    label: `Conversation Session${index + 1}`,
                    session_id: item.session_id,
                    timestamp: item.timestamp
                }));

                // 如果当前没有活跃session，自动选择最新的
                if (!activeSessionId && conversations.length > 0) {
                    activeSessionId = conversations[0].session_id;
                    if (window.sessionManager) {
                        window.sessionManager.switchToSession(activeSessionId);
                    }
                }

                console.log('会话列表获取成功:', conversations);
                renderConversations();
            } else {
                console.log('会话列表为空');
                renderConversations(); // 渲染空状态
            }
        } else {
            // 如果session管理器不可用，使用原来的方法
            const response = await axios.post('/api/user/chat/list', {
                user_id: userId
            });

            if (response.data && Array.isArray(response.data)) {
                // 按时间戳排序（最新的在前）
                const sortedData = response.data.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );

                // 转换为组件需要的格式
                conversations = sortedData.map((item, index) => ({
                    key: item.session_id,
                    label: `Conversation Session${index + 1}`,
                    session_id: item.session_id,
                    timestamp: item.timestamp
                }));

                console.log('会话列表获取成功:', conversations);
                renderConversations();
            } else {
                console.error('会话列表数据格式错误:', response.data);
            }
        }
    } catch (error) {
        console.error('获取会话列表失败:', error);
    }
}

// 删除会话
async function deleteConversation(sessionId) {
    // 检查用户登录状态
    if (!window.globalData || !window.globalData.userInfo || !window.globalData.userInfo.isLoggedIn) {
        console.error('用户未登录，无法删除会话');
        return;
    }

    const userId = window.globalData.userInfo.uuid || window.globalData.user_id;
    if (!userId) {
        console.error('用户ID不存在，无法删除会话');
        return;
    }

    try {
        console.log('正在删除会话，用户ID:', userId, '会话ID:', sessionId);
        const response = await axios.post('/api/user/chat/delete', {
            user_id: userId,
            session_id: sessionId
        });

        console.log('会话删除成功:', response.data);

        // 重新获取会话列表
        await fetchConversations();

        // 如果删除的是当前活跃会话，清空活跃状态
        if (activeSessionId === sessionId) {
            activeSessionId = '';
        }
    } catch (error) {
        console.error('删除会话失败:', error);
        alert('删除会话失败，请重试');
    }
}

// 会话点击处理
function handleConversationClick(conversation) {
    activeSessionId = conversation.session_id;

    // 使用session管理器切换会话
    if (window.sessionManager && typeof window.sessionManager.switchToSession === 'function') {
        window.sessionManager.switchToSession(conversation.session_id);
    } else {
        // 如果session管理器不可用，直接更新全局会话ID
        if (window.globalData) {
            window.globalData.session_id = conversation.session_id;
            console.log('切换到会话:', conversation.session_id);
        }
    }

    // 重新渲染以更新活跃状态
    renderConversations();
}

// 简化的选择会话函数
function selectConversation(sessionId) {
    activeSessionId = sessionId;

    // 使用session管理器切换会话
    if (window.sessionManager && typeof window.sessionManager.switchToSession === 'function') {
        window.sessionManager.switchToSession(sessionId);
    } else {
        // 如果session管理器不可用，直接更新全局会话ID
        if (window.globalData) {
            window.globalData.session_id = sessionId;
            console.log('切换到会话:', sessionId);
        }
    }

    // 重新渲染以更新活跃状态
    renderConversations();
}

// 创建新会话
async function createNewConversation() {
    try {
        console.log('正在创建新会话...');

        if (window.createNewSessionForUser && typeof window.createNewSessionForUser === 'function') {
            const newSession = await window.createNewSessionForUser();
            if (newSession) {
                console.log('新会话创建成功:', newSession);

                // 重新获取会话列表
                await fetchConversations();

                // 自动选择新创建的会话
                activeSessionId = newSession.session_id;
                renderConversations();

                // 关闭会话列表
                const container = document.getElementById('conversationsContainer');
                if (container) {
                    container.classList.remove('show');
                }
            } else {
                console.error('创建新会话失败');
                alert('创建新会话失败，请重试');
            }
        } else {
            console.error('createNewSessionForUser函数不可用');
            alert('创建新会话功能不可用');
        }
    } catch (error) {
        console.error('创建新会话时发生错误:', error);
        alert('创建新会话失败，请重试');
    }
}

// 渲染会话列表
function renderConversations() {
    const container = document.getElementById('conversationsApp');
    if (!container) return;

    // 添加创建新会话按钮
    const createNewButton = `
        <div class="p-3 border-b border-gray-200">
            <button class="w-full px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                    onclick="createNewConversation()">
                <span class="material-icons text-sm">add</span>
                <span>新建会话</span>
            </button>
        </div>
    `;

    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="chat-conversations">
                ${createNewButton}
                <div class="p-4 text-center text-gray-500">
                    暂无会话记录
                </div>
            </div>
        `;
        return;
    }

    const conversationItems = conversations.map((conversation) => {
        const isActive = activeSessionId === conversation.session_id;
        return `
            <div class="conversation-item p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex justify-between items-center ${isActive ? 'bg-purple-50 border-purple-200' : ''}"
                 onclick="selectConversation('${conversation.session_id}')">
                <div class="flex-1">
                    <div class="text-sm font-medium text-gray-800">
                        ${conversation.label}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${new Date(conversation.timestamp).toLocaleString()}
                    </div>
                </div>
                <div class="conversation-menu">
                    <button class="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500"
                            onclick="event.stopPropagation(); if (confirm('确定要删除这个会话吗？')) { deleteConversation('${conversation.session_id}'); }">
                        <span class="material-icons text-sm">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="chat-conversations">
            ${createNewButton}
            <div class="conversation-list">
                ${conversationItems}
            </div>
        </div>
    `;
}

// 显示/隐藏会话列表
function toggleConversations() {
    console.log('toggleConversations 被调用');
    const container = document.getElementById('conversationsContainer');

    if (!container) {
        console.error('找不到会话列表容器元素 #conversationsContainer');
        return;
    }

    console.log('容器当前状态:', container.classList.contains('show') ? '显示' : '隐藏');
    container.classList.toggle('show');
    console.log('容器切换后状态:', container.classList.contains('show') ? '显示' : '隐藏');

    // 如果显示会话列表，获取数据并渲染
    if (container.classList.contains('show')) {
        console.log('开始获取会话列表数据');
        console.log('当前全局数据:', window.globalData);
        fetchConversations();

        // 添加点击外部关闭的事件监听
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    } else {
        // 移除点击外部关闭的事件监听
        document.removeEventListener('click', handleClickOutside);
    }
}

// 点击外部关闭会话列表
function handleClickOutside(event) {
    const container = document.getElementById('conversationsContainer');
    const menuButton = document.getElementById('menuButton');

    if (container && container.classList.contains('show')) {
        // 如果点击的不是会话列表容器内部，也不是菜单按钮，则关闭会话列表
        if (!container.contains(event.target) && !menuButton.contains(event.target)) {
            container.classList.remove('show');
            document.removeEventListener('click', handleClickOutside);
        }
    }
}

// 测试函数
function testToggle() {
    console.log('测试函数被调用');
    alert('测试函数工作正常！');
}

// 导出函数供其他脚本使用
window.toggleConversations = toggleConversations;
window.handleConversationClick = handleConversationClick;
window.selectConversation = selectConversation;
window.deleteConversation = deleteConversation;
window.createNewConversation = createNewConversation;
window.testToggle = testToggle;
