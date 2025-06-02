// 设置页面的JavaScript功能

// 自动保存定时器
let userPromptTimer = null;
let modelMemoryTimer = null;

// 自动保存指示器
function showAutoSaveIndicator(type, status) {
    const indicator = document.getElementById(`${type}AutoSaveIndicator`);
    if (!indicator) return;

    switch (status) {
        case 'saving':
            indicator.innerHTML = '<span class="text-blue-500">💾 自动保存中...</span>';
            indicator.classList.remove('hidden');
            break;
        case 'success':
            indicator.innerHTML = '<span class="text-green-500">✅ 已保存</span>';
            indicator.classList.remove('hidden');
            setTimeout(() => {
                indicator.classList.add('hidden');
            }, 2000);
            break;
        case 'error':
            indicator.innerHTML = '<span class="text-red-500">❌ 保存失败</span>';
            indicator.classList.remove('hidden');
            setTimeout(() => {
                indicator.classList.add('hidden');
            }, 3000);
            break;
    }
}

// 加载用户个性化提示词
async function loadUserPrompt() {
    try {
        if (!window.globalData || !window.globalData.userInfo || !window.globalData.userInfo.isLoggedIn) {
            console.log('用户未登录，无法加载个性化提示词');
            return;
        }

        const userId = window.globalData.userInfo.uuid || window.globalData.user_id;
        if (!userId) {
            console.log('用户ID为空，无法加载个性化提示词');
            return;
        }

        console.log('正在加载用户个性化提示词...');
        const response = await axios.post('/api/user/prompt/get', {
            user_id: userId
        });

        if (response.data.success) {
            const userPromptTextarea = document.getElementById('userPrompt');
            if (userPromptTextarea) {
                userPromptTextarea.value = response.data.data || '';
                console.log('个性化提示词加载成功');
            }
        } else {
            console.error('加载个性化提示词失败:', response.data.message);
        }
    } catch (error) {
        console.error('加载个性化提示词时发生错误:', error);
    }
}

// 加载用户个性化记忆
async function loadUserMemory() {
    try {
        if (!window.globalData || !window.globalData.userInfo || !window.globalData.userInfo.isLoggedIn) {
            console.log('用户未登录，无法加载个性化记忆');
            return;
        }

        const userId = window.globalData.userInfo.uuid || window.globalData.user_id;
        if (!userId) {
            console.log('用户ID为空，无法加载个性化记忆');
            return;
        }

        console.log('正在加载用户个性化记忆...');
        const response = await axios.post('/api/user/memory/get', {
            user_id: userId
        });

        if (response.data.success) {
            const modelMemoryTextarea = document.getElementById('modelMemory');
            if (modelMemoryTextarea) {
                modelMemoryTextarea.value = response.data.data || '';
                console.log('个性化记忆加载成功');
            }
        } else {
            console.error('加载个性化记忆失败:', response.data.message);
        }
    } catch (error) {
        console.error('加载个性化记忆时发生错误:', error);
    }
}

// 自动保存用户个性化提示词
async function autoSaveUserPrompt(content) {
    try {
        if (!window.globalData || !window.globalData.userInfo || !window.globalData.userInfo.isLoggedIn) {
            console.log('用户未登录，无法保存个性化提示词');
            return;
        }

        const userId = window.globalData.userInfo.uuid || window.globalData.user_id;
        if (!userId) {
            console.log('用户ID为空，无法保存个性化提示词');
            return;
        }

        showAutoSaveIndicator('userPrompt', 'saving');
        console.log('自动保存个性化提示词...');

        const response = await axios.post('/api/user/prompt/update', {
            user_id: userId,
            new_text: content
        });

        if (response.data.success) {
            showAutoSaveIndicator('userPrompt', 'success');
            console.log('个性化提示词自动保存成功');
        } else {
            showAutoSaveIndicator('userPrompt', 'error');
            console.error('个性化提示词自动保存失败:', response.data.message);
        }
    } catch (error) {
        showAutoSaveIndicator('userPrompt', 'error');
        console.error('个性化提示词自动保存时发生错误:', error);
    }
}

// 自动保存用户个性化记忆
async function autoSaveUserMemory(content) {
    try {
        if (!window.globalData || !window.globalData.userInfo || !window.globalData.userInfo.isLoggedIn) {
            console.log('用户未登录，无法保存个性化记忆');
            return;
        }

        const userId = window.globalData.userInfo.uuid || window.globalData.user_id;
        if (!userId) {
            console.log('用户ID为空，无法保存个性化记忆');
            return;
        }

        showAutoSaveIndicator('modelMemory', 'saving');
        console.log('自动保存个性化记忆...');

        const response = await axios.post('/api/user/memory/update', {
            user_id: userId,
            new_text: content
        });

        if (response.data.success) {
            showAutoSaveIndicator('modelMemory', 'success');
            console.log('个性化记忆自动保存成功');
        } else {
            showAutoSaveIndicator('modelMemory', 'error');
            console.error('个性化记忆自动保存失败:', response.data.message);
        }
    } catch (error) {
        showAutoSaveIndicator('modelMemory', 'error');
        console.error('个性化记忆自动保存时发生错误:', error);
    }
}

// 设置自动保存监听器
function setupAutoSave() {
    const userPromptTextarea = document.getElementById('userPrompt');
    const modelMemoryTextarea = document.getElementById('modelMemory');

    if (userPromptTextarea) {
        userPromptTextarea.addEventListener('input', function() {
            // 清除之前的定时器
            if (userPromptTimer) {
                clearTimeout(userPromptTimer);
            }

            // 设置新的定时器，3秒后自动保存
            userPromptTimer = setTimeout(() => {
                autoSaveUserPrompt(this.value);
            }, 3000);
        });
    }

    if (modelMemoryTextarea) {
        modelMemoryTextarea.addEventListener('input', function() {
            // 清除之前的定时器
            if (modelMemoryTimer) {
                clearTimeout(modelMemoryTimer);
            }

            // 设置新的定时器，3秒后自动保存
            modelMemoryTimer = setTimeout(() => {
                autoSaveUserMemory(this.value);
            }, 3000);
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('设置页面加载完成，开始初始化...');

    // 检查登录状态（如果未登录则跳转）
    if (typeof checkUserLoginStatus === 'function') {
        checkUserLoginStatus(true);
    }

    // 等待用户信息加载
    setTimeout(async () => {
        if (window.globalData && window.globalData.userInfo && window.globalData.userInfo.isLoggedIn) {
            // 加载用户设置
            await loadUserPrompt();
            await loadUserMemory();

            // 设置自动保存
            setupAutoSave();

            console.log('设置页面初始化完成');
        } else {
            console.log('用户未登录，跳过设置加载');
        }
    }, 1000);
});
