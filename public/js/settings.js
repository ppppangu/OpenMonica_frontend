// 设置页面的JavaScript功能

// 加载用户提示词设置
async function loadUserPromptSettings() {
    try {
        if (!window.globalData.userInfo.uuid) {
            console.log('用户UUID为空，无法加载设置');
            return;
        }

        const response = await axios.get(`/api/user/prompt/${window.globalData.userInfo.uuid}`);
        
        if (response.data.success) {
            const data = response.data.data;
            
            // 填充表单
            document.getElementById('userPrompt').value = data.user_prompt || '';
            document.getElementById('modelMemory').value = data.model_memory || '';
            
            console.log('用户设置加载成功:', data);
        } else {
            console.error('加载用户设置失败:', response.data.message);
        }
    } catch (error) {
        console.error('加载用户设置时发生错误:', error);
    }
}

// 保存用户提示词
async function saveUserPrompt() {
    try {
        const userPrompt = document.getElementById('userPrompt').value.trim();
        const modelMemory = document.getElementById('modelMemory').value.trim();
        
        if (!window.globalData.userInfo.uuid) {
            showMessage('用户信息无效，请重新登录', 'error');
            return;
        }

        // 显示保存状态
        setButtonLoading('saveUserPrompt', true, '保存中...');

        const response = await axios.post('/api/user/prompt/update', {
            uuid: window.globalData.userInfo.uuid,
            username: window.globalData.userInfo.username,
            user_prompt: userPrompt,
            model_memory: modelMemory
        });

        if (response.data.success) {
            showMessage('个人提示词保存成功！', 'success');
        } else {
            showMessage(response.data.message || '保存失败', 'error');
        }
    } catch (error) {
        console.error('保存用户提示词失败:', error);
        showMessage('保存失败，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        setButtonLoading('saveUserPrompt', false);
    }
}

// 保存模型记忆
async function saveModelMemory() {
    try {
        const userPrompt = document.getElementById('userPrompt').value.trim();
        const modelMemory = document.getElementById('modelMemory').value.trim();
        
        if (!window.globalData.userInfo.uuid) {
            showMessage('用户信息无效，请重新登录', 'error');
            return;
        }

        // 显示保存状态
        setButtonLoading('saveModelMemory', true, '更新中...');

        const response = await axios.post('/api/user/prompt/update', {
            uuid: window.globalData.userInfo.uuid,
            username: window.globalData.userInfo.username,
            user_prompt: userPrompt,
            model_memory: modelMemory
        });

        if (response.data.success) {
            showMessage('模型记忆更新成功！', 'success');
        } else {
            showMessage(response.data.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('更新模型记忆失败:', error);
        showMessage('更新失败，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        setButtonLoading('saveModelMemory', false);
    }
}

// showMessage函数已在common.js中定义


// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('设置页面加载完成，开始初始化...');

    // 检查登录状态（如果未登录则跳转）
    checkUserLoginStatus(true);

    // 加载用户设置
    loadUserPromptSettings();

    console.log('设置页面初始化完成');
});
