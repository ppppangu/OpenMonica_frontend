// Session管理工具
class SessionManager {
    constructor() {
        this.currentSessionId = null;
        this.sessions = [];
    }

    // 初始化session管理
    async initializeSession() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        console.log(`[SessionManager] 开始初始化session管理... 当前页面: ${currentPage}`);

        // 检查用户登录状态
        if (!window.globalData || !window.globalData.userInfo || !window.globalData.userInfo.isLoggedIn) {
            console.error('[SessionManager] 用户未登录，无法初始化session');
            return null;
        }

        const userId = window.globalData.userInfo.uuid || window.globalData.user_id;
        if (!userId) {
            console.error('[SessionManager] 用户ID不存在，无法初始化session');
            return null;
        }

        console.log(`[SessionManager] 用户ID: ${userId}`);

        try {
            // 首先尝试从localStorage获取保存的session_id
            const savedSessionId = localStorage.getItem('currentSessionId');
            if (savedSessionId) {
                console.log(`[SessionManager] 从localStorage获取到保存的session_id: ${savedSessionId}`);

                // 验证这个session是否仍然有效
                const isValid = await this.validateSession(savedSessionId, userId);
                if (isValid) {
                    this.currentSessionId = savedSessionId;
                    this.updateGlobalSessionId(savedSessionId);
                    console.log(`[SessionManager] ✅ 使用保存的有效session: ${savedSessionId}`);
                    return savedSessionId;
                } else {
                    console.log(`[SessionManager] ❌ 保存的session已失效: ${savedSessionId}`);
                    localStorage.removeItem('currentSessionId');
                }
            } else {
                console.log('[SessionManager] localStorage中没有保存的session');
            }

            // 获取用户的所有session列表
            console.log('[SessionManager] 正在获取用户session列表...');
            const sessions = await this.fetchSessionList(userId);

            if (sessions && sessions.length > 0) {
                // 按时间戳排序，选择最新的session
                const sortedSessions = sessions.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );

                const latestSession = sortedSessions[0];
                this.currentSessionId = latestSession.session_id;
                this.updateGlobalSessionId(latestSession.session_id);
                this.saveSessionToStorage(latestSession.session_id);

                console.log(`[SessionManager] ✅ 使用最新的session: ${latestSession.session_id} (共${sessions.length}个session)`);
                return latestSession.session_id;
            } else {
                // 没有session，创建新的
                console.log('[SessionManager] 没有现有session，正在创建新session...');
                const newSession = await this.createNewSession(userId);
                if (newSession && newSession.session_id) {
                    this.currentSessionId = newSession.session_id;
                    this.updateGlobalSessionId(newSession.session_id);
                    this.saveSessionToStorage(newSession.session_id);

                    console.log(`[SessionManager] ✅ 创建新session成功: ${newSession.session_id}`);
                    return newSession.session_id;
                } else {
                    console.error('[SessionManager] ❌ 创建新session失败');
                }
            }
        } catch (error) {
            console.error('[SessionManager] 初始化session失败:', error);

            // 如果所有方法都失败，使用默认session
            const defaultSessionId = 'session_default_' + Date.now();
            this.currentSessionId = defaultSessionId;
            this.updateGlobalSessionId(defaultSessionId);
            this.saveSessionToStorage(defaultSessionId);

            console.log(`[SessionManager] ⚠️ 使用默认session: ${defaultSessionId}`);
            return defaultSessionId;
        }

        console.error('[SessionManager] ❌ 所有初始化方法都失败');
        return null;
    }

    // 获取session列表
    async fetchSessionList(userId) {
        try {
            console.log('正在获取session列表，用户ID:', userId);
            const response = await axios.post('/api/user/chat/list', {
                user_id: userId
            });

            if (response.data && Array.isArray(response.data)) {
                this.sessions = response.data;
                console.log('获取到session列表:', response.data);
                return response.data;
            } else {
                console.log('session列表为空或格式错误');
                return [];
            }
        } catch (error) {
            console.error('获取session列表失败:', error);
            return [];
        }
    }

    // 验证session是否有效
    async validateSession(sessionId, userId) {
        try {
            const sessions = await this.fetchSessionList(userId);
            return sessions.some(session => session.session_id === sessionId);
        } catch (error) {
            console.error('验证session失败:', error);
            return false;
        }
    }

    // 创建新session - 使用UUID直接生成，不调用专门的端点
    async createNewSession(userId) {
        try {
            console.log('正在创建新session，用户ID:', userId);

            // 直接使用UUID生成新的session_id
            const newSessionId = 'session_' + this.generateUUID();
            const newSession = {
                session_id: newSessionId,
                timestamp: new Date().toISOString(),
                title: 'AI助手对话'
            };

            console.log('创建新session成功:', newSession);
            return newSession;
        } catch (error) {
            console.error('创建新session失败:', error);
            return null;
        }
    }

    // 生成UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // 更新全局session ID
    updateGlobalSessionId(sessionId) {
        if (window.globalData) {
            window.globalData.session_id = sessionId;
            window.globalData.user_id = window.globalData.userInfo.uuid || window.globalData.user_id;
            console.log('更新全局session_id:', sessionId);
            console.log('更新全局user_id:', window.globalData.user_id);
        }
    }

    // 保存session到localStorage
    saveSessionToStorage(sessionId) {
        try {
            localStorage.setItem('currentSessionId', sessionId);
            console.log('session已保存到localStorage:', sessionId);
        } catch (error) {
            console.error('保存session到localStorage失败:', error);
        }
    }

    // 切换到指定session
    async switchToSession(sessionId) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        console.log(`[SessionManager] 切换到session: ${sessionId} (页面: ${currentPage})`);

        this.currentSessionId = sessionId;
        this.updateGlobalSessionId(sessionId);
        this.saveSessionToStorage(sessionId);

        console.log(`[SessionManager] ✅ Session切换完成: ${sessionId}`);
    }

    // 获取当前session ID
    getCurrentSessionId() {
        return this.currentSessionId;
    }

    // 清除session数据
    clearSession() {
        this.currentSessionId = null;
        this.sessions = [];
        localStorage.removeItem('currentSessionId');
        console.log('session数据已清除');
    }

    // 创建新会话（供外部调用）
    async createNewSessionForUser() {
        const userId = window.globalData?.userInfo?.uuid || window.globalData?.user_id;
        if (!userId) {
            console.error('[SessionManager] 用户ID不存在，无法创建新会话');
            return null;
        }

        const newSession = await this.createNewSession(userId);
        if (newSession && newSession.session_id) {
            this.currentSessionId = newSession.session_id;
            this.updateGlobalSessionId(newSession.session_id);
            this.saveSessionToStorage(newSession.session_id);

            console.log(`[SessionManager] ✅ 手动创建新会话成功: ${newSession.session_id}`);
            return newSession;
        }

        return null;
    }
}

// 创建全局session管理器实例
window.sessionManager = new SessionManager();

// 导出函数供其他脚本使用
window.initializeSession = () => window.sessionManager.initializeSession();
window.switchToSession = (sessionId) => window.sessionManager.switchToSession(sessionId);
window.getCurrentSessionId = () => window.sessionManager.getCurrentSessionId();
window.clearSession = () => window.sessionManager.clearSession();
window.createNewSessionForUser = () => window.sessionManager.createNewSessionForUser();

console.log('Session管理器已初始化');
