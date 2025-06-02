// 初始化全局变量
window.globalData = {
    availableModels: [],
    selectedModelId: '',
    selectedModelName: 'Sonnet',
    user_id: '', // 将在登录后动态设置
    session_id: '', // 将通过session管理器动态设置
    extra_messages: [],
    userInput: [],
    open_predict: false,
    predict_text: '',
    send_messages: [],
    time_interval: 10000000,
    notificationPreferences: {
        email: '123@123.com',
        phone: '12345678901'
    },
    iscompletion: false,
    // 用户信息
    userInfo: {
        uuid: '',
        username: '',
        email: '',
        isLoggedIn: false
    }
};

const modelSelector = document.getElementById('modelSelector');
const modelDropdown = document.getElementById('modelDropdown');
const modelList = document.getElementById('modelList');
const selectedModelSpan = document.getElementById('selectedModel');
const expandIcon = modelSelector.querySelector('.material-icons:last-child');

// 模型加载现在由Vue组件处理，这个函数保留为空以保持兼容性
async function loadModels() {
    // 模型加载现在由Vue组件处理
    console.log('模型加载已由Vue组件接管');
    return [];
}

// 渲染模型列表
function renderModelList(models) {
    if (!models || models.length === 0) {
        modelList.innerHTML = `
            <div class="flex items-center justify-center py-4">
                <span class="text-sm text-gray-400">暂无可用模型</span>
            </div>
        `;
        return;
    }

    modelList.innerHTML = models.map(model => `
        <div class="model-option px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 flex items-center justify-between"
             data-model-id="${model.id}" data-model-name="${model.name}">
            <span class="text-sm text-gray-700">${model.name}</span>
            <span class="material-icons text-sm text-gray-400 opacity-0 check-icon">check</span>
        </div>
    `).join('');

    // 添加点击事件
    modelList.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', () => {
            const modelId = option.dataset.modelId;
            const modelName = option.dataset.modelName;
            selectModel(modelId, modelName);
            hideDropdown();
        });
    });
}

// 渲染错误状态
function renderErrorState() {
    modelList.innerHTML = `
        <div class="flex items-center justify-center py-4">
            <span class="text-sm text-red-400">加载失败</span>
        </div>
    `;
}

// 选择模型
function selectModel(modelId, modelName) {
    // 更新全局变量
    window.globalData.selectedModelId = modelId;
    window.globalData.selectedModelName = modelName;

    // 更新显示
    selectedModelSpan.textContent = modelName;

    // 更新选中状态
    modelList.querySelectorAll('.model-option').forEach(option => {
        const checkIcon = option.querySelector('.check-icon');
        if (option.dataset.modelId === modelId) {
            checkIcon.classList.remove('opacity-0');
            option.classList.add('bg-purple-50');
        } else {
            checkIcon.classList.add('opacity-0');
            option.classList.remove('bg-purple-50');
        }
    });

    console.log('已选择模型:', { id: modelId, name: modelName });
}

// 显示上拉菜单
function showDropdown() {
    modelDropdown.classList.remove('hidden');
    expandIcon.textContent = 'expand_more'; // 菜单打开时显示向下箭头
}

// 隐藏上拉菜单
function hideDropdown() {
    modelDropdown.classList.add('hidden');
    expandIcon.textContent = 'expand_less'; // 菜单关闭时显示向上箭头
}

// 切换下拉菜单显示状态
function toggleDropdown() {
    if (modelDropdown.classList.contains('hidden')) {
        showDropdown();
    } else {
        hideDropdown();
    }
}

// 模型事件监听现在由Vue组件处理，这个函数保留为空以保持兼容性
function initEventListeners() {
    // 模型选择器事件现在由Vue组件处理
    console.log('模型选择器事件监听已由Vue组件接管');
}

// 设置问候语
function setGreeting() {
    const greetingElement = document.getElementById('greeting');
    if (!greetingElement) return;

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // 将时间转换为分钟数，便于比较
    const currentTime = hour * 60 + minute;

    // 时间段定义（以分钟为单位）
    const morningStart = 4 * 60;        // 4:00
    const morningEnd = 11 * 60 + 30;    // 11:30
    const afternoonEnd = 19 * 60;       // 19:00 (7:00 PM)

    let greeting;

    if (currentTime >= morningStart && currentTime < morningEnd) {
        // 早上4:00 - 11:30
        greeting = '早上好 🌅';
    } else if (currentTime >= morningEnd && currentTime < afternoonEnd) {
        // 中午11:30 - 下午7:00
        greeting = '下午好 ☀️';
    } else {
        // 其他时间（晚上7:00 - 早上4:00）
        greeting = '晚上好 👋';
    }

    greetingElement.textContent = greeting;
    console.log(`当前时间: ${hour}:${minute.toString().padStart(2, '0')}, 问候语: ${greeting}`);
}

// 用户输入监听现在由Vue组件处理，这个函数保留为空以保持兼容性
async function listenUserInput() {
    // 用户输入现在由Vue Sender组件处理
    console.log('用户输入监听已由Vue组件接管');
}





// 思维导图按钮现在由Vue组件处理，这个函数保留为空以保持兼容性
function bindMindMapButton() {
    // 思维导图按钮现在由Vue组件处理
    console.log('思维导图按钮绑定已由Vue组件接管');
}

// 发送按钮现在由Vue组件处理，这个函数保留为空以保持兼容性
function bindSendButton() {
    // 发送按钮现在由Vue Sender组件处理
    console.log('发送按钮绑定已由Vue组件接管');
}

// 发送消息
async function sendMessage() {
    // 判断用户输入是否为空
    if (window.globalData.userInput.length === 0) {
        console.log('用户输入为空，请先输入');
        return;
    }

    // 输入框清空现在由Vue组件处理
    // 发送消息，发送时需要将extra_messages这个列表中的每个content字段，每个字段都是完整的一个字典，添加到userInput的最前面，同时注意需要将extra_messages解包后组成新的列表,否则会出现 [[{'role': 'user', 'content': '请你调用思维导图的工具，根据用户的输入的query生成对应的思维导图，使cloud模式'}], {'role': 'user', 'content': '你好'}] 这种格式，导致请求失败，不是一个字典的列表了
    // 遍历extra_messages，将每个字典的content字段添加到userInput的最前面
    const messages = [];
    console.log('处理前的extra_messages:', window.globalData.extra_messages);
    for (const item of window.globalData.extra_messages) {
        console.log('处理item:', item, 'content类型:', typeof item.content, '是否为数组:', Array.isArray(item.content));
        // 检查content是否是数组，如果是数组就展开后再添加，如果不是就直接添加
        if (Array.isArray(item.content)) {
            messages.push(...item.content);
        } else {
            messages.push(item.content);
        }
    }
    console.log('处理后的messages:', messages);
    // 使用扩展运算符将userInput数组中的元素添加到messages中，而不是将整个数组作为一个元素
    messages.push(...window.globalData.userInput);
    const modelId = window.globalData.selectedModelId;
    const user_id = window.globalData.user_id;
    const session_id = window.globalData.session_id;
    const requestBody = {
        model_id: modelId,
        user_id: user_id,
        session_id: session_id,
        messages: messages
    };
    // 只需清空用户输入，extra_messages不需要清空
    window.globalData.userInput = [];
    console.log('发送消息:', requestBody);
    const response = await axios.post('/api/chat', requestBody);
    console.log('消息发送成功:', response.data);
}


// 通知偏好选择器功能
function bindNotificationSelector() {
    const notificationSelector = document.getElementById('notificationSelector');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const selectedNotifications = document.getElementById('selectedNotifications');
    const emailNotification = document.getElementById('emailNotification');
    const smsNotification = document.getElementById('smsNotification');

    if (!notificationSelector || !notificationDropdown) return;

    // 初始化全局数据中的通知偏好
    if (!window.globalData.notificationPreferences) {
        window.globalData.notificationPreferences = {
            email: true,  // 默认选中邮件通知
            sms: false    // 默认不选中短信通知
        };
    }

    // 点击选择器按钮显示/隐藏下拉菜单
    notificationSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');

        // 更新箭头方向
        const arrow = notificationSelector.querySelector('.material-icons:last-child');
        if (notificationDropdown.classList.contains('hidden')) {
            arrow.textContent = 'expand_more';
        } else {
            arrow.textContent = 'expand_less';
        }
    });

    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
        if (!notificationSelector.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.classList.add('hidden');
            const arrow = notificationSelector.querySelector('.material-icons:last-child');
            arrow.textContent = 'expand_more';
        }
    });

    // 更新显示的通知偏好文本
    function updateNotificationDisplay() {
        const preferences = [];
        if (window.globalData.notificationPreferences.email) {
            preferences.push('邮件通知');
        }
        if (window.globalData.notificationPreferences.sms) {
            preferences.push('短信通知');
        }

        if (preferences.length === 0) {
            selectedNotifications.textContent = '无通知';
        } else if (preferences.length === 1) {
            selectedNotifications.textContent = preferences[0];
        } else {
            selectedNotifications.textContent = preferences.join('、');
        }

        console.log('通知偏好已更新:', window.globalData.notificationPreferences);
    }

    // 邮件通知复选框事件
    if (emailNotification) {
        emailNotification.addEventListener('change', (e) => {
            window.globalData.notificationPreferences.email = e.target.checked;
            updateNotificationDisplay();
        });
    }

    // 短信通知复选框事件
    if (smsNotification) {
        smsNotification.addEventListener('change', (e) => {
            window.globalData.notificationPreferences.sms = e.target.checked;
            updateNotificationDisplay();
        });
    }

    // 初始化显示
    updateNotificationDisplay();
}

// 闪电按钮现在由Vue组件处理，这个函数保留为空以保持兼容性
function bindFlashButton() {
    // 闪电按钮现在由Vue组件处理
    console.log('闪电按钮绑定已由Vue组件接管');
}

// 从localStorage加载用户信息到全局变量
async function loadUserInfo() {
    try {
        const userToken = localStorage.getItem('userToken');
        const userInfoStr = localStorage.getItem('userInfo');

        if (userToken && userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);

            // 更新全局变量中的用户信息
            window.globalData.userInfo = {
                uuid: userInfo.uuid || '',
                username: userInfo.username || '',
                email: userInfo.email || '',
                isLoggedIn: true
            };

            // 设置 user_id
            window.globalData.user_id = userInfo.uuid || '';

            console.log('用户信息已加载到全局变量:', window.globalData.userInfo);

            // 使用新的session管理器初始化session
            if (typeof window.initializeSession === 'function') {
                try {
                    await window.initializeSession();
                    console.log('Session初始化完成');
                } catch (error) {
                    console.error('Session初始化失败:', error);
                    // 如果session初始化失败，使用默认session
                    window.globalData.session_id = 'session_default_' + Date.now();
                }
            } else {
                // 如果session管理器不可用，使用旧的逻辑
                await loadLatestSessionId();
            }
        } else {
            // 用户未登录
            window.globalData.userInfo = {
                uuid: '',
                username: '',
                email: '',
                isLoggedIn: false
            };
            window.globalData.user_id = '';
            window.globalData.session_id = '';
            console.log('用户未登录');
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
        window.globalData.userInfo = {
            uuid: '',
            username: '',
            email: '',
            isLoggedIn: false
        };
        window.globalData.user_id = '';
        window.globalData.session_id = '';
    }
}

// 加载最新的会话ID
async function loadLatestSessionId() {
    if (!window.globalData.user_id) {
        console.log('用户ID不存在，无法获取会话列表');
        return;
    }

    try {
        console.log('正在获取最新会话ID，用户ID:', window.globalData.user_id);
        const response = await axios.post('/api/user/chat/list', {
            user_id: window.globalData.user_id
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            // 按时间戳排序，获取最新的会话
            const sortedSessions = response.data.sort((a, b) =>
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            const latestSession = sortedSessions[0];
            window.globalData.session_id = latestSession.session_id;

            console.log('已设置最新会话ID:', window.globalData.session_id);
        } else {
            // 如果没有会话，生成一个新的会话ID
            window.globalData.session_id = 'session_' + Date.now();
            console.log('没有现有会话，生成新会话ID:', window.globalData.session_id);
        }
    } catch (error) {
        console.error('获取会话列表失败:', error);
        // 如果获取失败，生成一个新的会话ID
        window.globalData.session_id = 'session_' + Date.now();
        console.log('获取会话失败，生成新会话ID:', window.globalData.session_id);
    }
}

// 检查用户登录状态
function checkUserLoginStatus() {
    if (!window.globalData.userInfo.isLoggedIn) {
        console.log('用户未登录，可能需要跳转到登录页面');
        // 这里添加跳转到登录页面的逻辑，如果用户未登录，则跳转到登录页面
        window.location.href = 'login.html';
    } else {
        console.log('用户已登录:', window.globalData.userInfo.username);
        // 更新全局user_id为用户的UUID
        window.globalData.user_id = window.globalData.userInfo.uuid;
        console.log('更新全局user_id为:', window.globalData.user_id);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('页面加载完成，开始初始化...');
    await loadUserInfo(); // 加载用户信息（异步）
    checkUserLoginStatus(); // 检查登录状态

    // 如果用户已登录，初始化会话
    if (window.globalData.userInfo.isLoggedIn) {
        console.log('用户已登录，开始初始化会话...');
        if (window.sessionManager) {
            try {
                const sessionId = await window.sessionManager.initializeSession();
                console.log('会话初始化完成，session_id:', sessionId);
            } catch (error) {
                console.error('会话初始化失败:', error);
            }
        }
    }

    setGreeting();
    initEventListeners();
    loadModels();
    listenUserInput();
    bindSendButton();
    bindMindMapButton();
    bindNotificationSelector();
    bindFlashButton();
});