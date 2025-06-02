// 认证相关的JavaScript功能

// DOM元素
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const errorText = document.getElementById('errorText');
const successText = document.getElementById('successText');

// 标签页切换功能
function initTabSwitching() {
    loginTab.addEventListener('click', () => {
        switchToLogin();
    });

    registerTab.addEventListener('click', () => {
        switchToRegister();
    });
}

// 切换到登录页面
function switchToLogin() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    hideMessages();
}

// 切换到注册页面
function switchToRegister() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    hideMessages();
}

// 显示错误消息
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        hideMessages();
    }, 3000);
}

// 显示成功消息
function showSuccess(message) {
    successText.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        hideMessages();
    }, 3000);
}

// 隐藏所有消息
function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// 验证邮箱格式
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 验证密码强度
function validatePassword(password) {
    // 至少8位，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
}

// 登录表单提交
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // 基本验证
    if (!email || !password) {
        showError('请填写所有字段');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('请输入有效的邮箱地址');
        return;
    }
    
    try {
        // 显示加载状态
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '登录中...';
        submitBtn.disabled = true;
        
        const response = await axios.post('/api/user/login', {
            email: email,
            password: password
        });
        
        if (response.data.success) {
            showSuccess('登录成功！正在初始化...');

            // 保存用户信息到localStorage
            localStorage.setItem('userToken', response.data.token);
            localStorage.setItem('userInfo', JSON.stringify(response.data.user));

            // 更新全局用户信息
            if (window.globalData) {
                window.globalData.userInfo = {
                    uuid: response.data.user.uuid || '',
                    username: response.data.user.username || '',
                    email: response.data.user.email || '',
                    isLoggedIn: true
                };
                window.globalData.user_id = response.data.user.uuid || response.data.user.id;
            }

            // 初始化session管理
            if (typeof window.initializeSession === 'function') {
                try {
                    await window.initializeSession();
                    console.log('Session初始化完成');
                } catch (error) {
                    console.error('Session初始化失败:', error);
                }
            }

            // 2秒后跳转到首页
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showError(response.data.message || '登录失败，请检查邮箱和密码');
        }
    } catch (error) {
        console.error('登录错误:', error);
        showError(error.response?.data?.message || '登录失败，请稍后重试');
    } finally {
        // 恢复按钮状态
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.textContent = '登录';
        submitBtn.disabled = false;
    }
}

// 注册表单提交
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // 基本验证
    if (!username || !email || !password || !confirmPassword) {
        showError('请填写所有字段');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('请输入有效的邮箱地址');
        return;
    }
    
    if (!validatePassword(password)) {
        showError('密码至少8位，需包含字母和数字');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('两次输入的密码不一致');
        return;
    }
    
    if (!agreeTerms) {
        showError('请同意服务条款和隐私政策');
        return;
    }
    
    try {
        // 显示加载状态
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '注册中...';
        submitBtn.disabled = true;
        
        const response = await axios.post('/api/user/register', {
            username: username,
            email: email,
            password: password
        });
        
        if (response.data.success) {
            showSuccess('注册成功！请登录');
            
            // 清空注册表单
            registerForm.reset();
            
            // 2秒后切换到登录页面
            setTimeout(() => {
                switchToLogin();
            }, 2000);
        } else {
            showError(response.data.message || '注册失败');
        }
    } catch (error) {
        console.error('注册错误:', error);
        showError(error.response?.data?.message || '注册失败，请稍后重试');
    } finally {
        // 恢复按钮状态
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.textContent = '注册';
        submitBtn.disabled = false;
    }
}

// 初始化事件监听器
function initEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
}

// 检查用户是否已登录
function checkAuthStatus() {
    const token = localStorage.getItem('userToken');
    if (token) {
        // 如果已登录，可以选择直接跳转到首页
        // window.location.href = 'index.html';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('认证页面加载完成，开始初始化...');
    initTabSwitching();
    initEventListeners();
    checkAuthStatus();
});
