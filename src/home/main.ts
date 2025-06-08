// 登出功能
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (result.success) {
                    // 清除本地存储
                    localStorage.removeItem('user');
                    localStorage.removeItem('isAuthenticated');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('chatHistory');
                    sessionStorage.clear();

                    // 重定向到登录页面
                    window.location.href = '/login';
                } else {
                    console.error('登出失败:', result.message);
                    // 即使登出失败也清除本地存储并重定向到登录页面
                    localStorage.removeItem('user');
                    localStorage.removeItem('isAuthenticated');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('chatHistory');
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('登出请求失败:', error);
                // 网络错误时也清除本地存储并重定向到登录页面
                localStorage.removeItem('user');
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('authToken');
                localStorage.removeItem('chatHistory');
                window.location.href = '/login';
            }
        });
    }
});