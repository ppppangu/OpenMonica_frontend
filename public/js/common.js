// 通用的JavaScript功能，所有页面都可以使用

// 初始化全局变量（如果不存在）
if (!window.globalData) {
    window.globalData = {
        userInfo: {
            uuid: '',
            username: '',
            email: '',
            isLoggedIn: false
        }
    };
}

// 从localStorage加载用户信息到全局变量
function loadUserInfo() {
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
            
            console.log('用户信息已加载到全局变量:', window.globalData.userInfo);
        } else {
            // 用户未登录
            window.globalData.userInfo = {
                uuid: '',
                username: '',
                email: '',
                isLoggedIn: false
            };
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
    }
}

// 检查用户登录状态
function checkUserLoginStatus(redirectToLogin = false) {
    if (!window.globalData.userInfo.isLoggedIn) {
        console.log('用户未登录');
        if (redirectToLogin) {
            console.log('跳转到登录页面');
            window.location.href = 'login.html';
        }
    } else {
        console.log('用户已登录:', window.globalData.userInfo.username);
    }
}

// 显示消息提示
function showMessage(message, type = 'info', duration = 3000) {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    messageDiv.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageDiv);
    
    // 添加进入动画
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
        messageDiv.style.opacity = '1';
    }, 10);
    
    // 自动移除
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(100%)';
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, duration);
}

// 通用的导航函数
function navigateTo(page) {
    window.location.href = page;
}

// 通用的按钮状态管理
function setButtonLoading(buttonId, isLoading, loadingText = '加载中...') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
    } else {
        button.textContent = button.dataset.originalText || button.textContent;
        button.disabled = false;
    }
}

// 格式化日期
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
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

// 复制文本到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showMessage('已复制到剪贴板', 'success');
        return true;
    } catch (err) {
        console.error('复制失败:', err);
        showMessage('复制失败', 'error');
        return false;
    }
}

// 获取URL参数
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 设置URL参数
function setUrlParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

// 本地存储封装
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('存储失败:', error);
            return false;
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('读取存储失败:', error);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除存储失败:', error);
            return false;
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空存储失败:', error);
            return false;
        }
    }
};

// 页面加载时自动初始化用户信息
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
});

// 导出到全局作用域
window.CommonUtils = {
    loadUserInfo,
    checkUserLoginStatus,
    showMessage,
    navigateTo,
    setButtonLoading,
    formatDate,
    debounce,
    throttle,
    validateEmail,
    validatePassword,
    copyToClipboard,
    getUrlParameter,
    setUrlParameter,
    storage
};
