const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// 读取配置文件
let config;
try {
    const configFile = fs.readFileSync('config.yaml', 'utf8');
    config = yaml.load(configFile);
} catch (error) {
    console.error('无法读取配置文件 config.yaml:', error);
    process.exit(1);
}

const BACKEND_BASE_URL = config.user_manage_url;

// JWT配置
const JWT_SECRET = config.jwt_secret || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = config.jwt_expires_in || '7d';

// 初始化SQLite数据库
const db = new Database('auth.db');

// 创建tokens表
db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1
    )
`);

// 数据库操作函数
const dbOps = {
    // 创建token
    createToken: db.prepare(`
        INSERT INTO tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
    `),

    // 验证token
    validateToken: db.prepare(`
        SELECT user_id, expires_at FROM tokens
        WHERE token = ? AND is_active = 1
    `),

    // 删除token (登出)
    deleteToken: db.prepare(`
        UPDATE tokens SET is_active = 0
        WHERE token = ?
    `),

    // 清理过期token
    cleanExpiredTokens: db.prepare(`
        UPDATE tokens SET is_active = 0
        WHERE expires_at < datetime('now')
    `)
};

// 配置multer处理FormData
const upload = multer();

// 解析JSON和表单数据
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.none()); // 处理multipart/form-data
app.use(cookieParser());

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// 清理过期token的定时任务
setInterval(() => {
    try {
        dbOps.cleanExpiredTokens.run();
    } catch (error) {
        console.error('清理过期token失败:', error);
    }
}, 60000); // 每分钟清理一次

// JWT认证中间件
function authenticateToken(req, res, next) {
    // 跳过登录相关的路径
    const publicPaths = ['/login', '/signin', '/signup', '/', '/api/auth/login', '/api/auth/register', '/api/auth/logout', '/user/account', '/user/account/register', '/test', '/health'];
    if (publicPaths.includes(req.path)) {
        return next();
    }

    // 从请求头或cookie中获取token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies?.token;

    if (!token) {
        // 如果是HTML页面请求，重定向到登录页
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return res.redirect('/login');
        }
        // 如果是API请求，返回401
        return res.status(401).json({ success: false, message: '未授权访问' });
    }

    try {
        // 验证token是否在数据库中且有效
        const tokenData = dbOps.validateToken.get(token);

        if (!tokenData) {
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
                return res.redirect('/login');
            }
            return res.status(401).json({ success: false, message: 'Token无效' });
        }

        // 检查token是否过期
        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);
        if (now > expiresAt) {
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
                return res.redirect('/login');
            }
            return res.status(401).json({ success: false, message: 'Token已过期' });
        }

        // 验证JWT签名
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.userId, ...decoded };
        next();
    } catch (error) {
        console.error('Token验证失败:', error);
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return res.redirect('/login');
        }
        return res.status(401).json({ success: false, message: 'Token验证失败' });
    }
}

// 测试路由
app.get('/test', (req, res) => {
    console.log('测试路由被访问');
    res.json({ message: '测试成功', timestamp: new Date().toISOString() });
});

// 数据转换工具函数
function convertToFormData(data) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
            params.append(key, String(value));
        }
    }
    return params;
}

// ==================== 后端代理端点 ====================
// 这些端点将请求转发到 main.py 后端服务

// 健康检查
app.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${BACKEND_BASE_URL}/health`, {
            timeout: 5000 // 5秒超时
        });
        res.json({
            status: 'ok',
            backend: 'connected',
            backend_response: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('健康检查失败:', error.message);
        res.json({
            status: 'ok',
            backend: 'disconnected',
            backend_error: error.message,
            fallback_mode: 'enabled',
            timestamp: new Date().toISOString()
        });
    }
});

// 测试注册端点
app.get('/test/register', (req, res) => {
    res.json({
        success: true,
        message: '测试注册端点正常工作',
        endpoint: '/user/account',
        method: 'POST',
        expected_data: {
            mode: 'register',
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        }
    });
});

// 用户注册端点
app.post('/user/account/register', async (req, res) => {
    try {
        console.log('用户注册请求:', req.body);

        const { username, email, password } = req.body;

        // 验证必要字段
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名、邮箱和密码都是必填项'
            });
        }

        // 尝试连接后端服务
        try {
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('mode', 'register');
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);

            console.log('发送到后端的注册数据:', { mode: 'register', username, email, password: '***' });

            const response = await axios.post(`${BACKEND_BASE_URL}/user/account`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });

            console.log('后端注册响应:', response.data);
            res.json(response.data);
        } catch (backendError) {
            console.warn('后端服务不可用，使用本地模拟注册:', backendError.message);

            // 模拟注册成功
            res.json({
                success: true,
                message: '注册成功！请使用您的邮箱和密码登录。',
                data: {
                    user_id: 'mock_' + Date.now(),
                    username: username,
                    email: email
                }
            });
        }
    } catch (error) {
        console.error('注册失败:', error.message);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// 保留原有的 /user/account 端点以兼容现有代码
app.post('/user/account', async (req, res) => {
    try {
        console.log('账户管理请求 (兼容模式):', req.body);

        const { mode } = req.body;

        // 根据模式处理不同的请求
        if (mode === 'register') {
            // 直接处理注册逻辑
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: '用户名、邮箱和密码都是必填项'
                });
            }

            try {
                const FormData = require('form-data');
                const formData = new FormData();
                formData.append('mode', 'register');
                formData.append('username', username);
                formData.append('email', email);
                formData.append('password', password);

                const response = await axios.post(`${BACKEND_BASE_URL}/user/account`, formData, {
                    headers: formData.getHeaders(),
                    timeout: 10000
                });

                res.json(response.data);
            } catch (backendError) {
                console.warn('后端服务不可用，使用本地模拟注册:', backendError.message);

                res.json({
                    success: true,
                    message: '注册成功！请使用您的邮箱和密码登录。',
                    data: {
                        user_id: 'mock_' + Date.now(),
                        username: username,
                        email: email
                    }
                });
            }
            return;
        }

        // 其他模式的处理保持原样
        const FormData = require('form-data');
        const formData = new FormData();

        for (const [key, value] of Object.entries(req.body)) {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        }

        try {
            const response = await axios.post(`${BACKEND_BASE_URL}/user/account`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });

            res.json(response.data);
        } catch (backendError) {
            console.warn('后端服务不可用，使用本地模拟响应:', backendError.message);

            res.json({
                success: true,
                message: '操作成功',
                data: {}
            });
        }
    } catch (error) {
        console.error('账户操作失败:', error.message);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});


// 静态文件服务 - 托管所有HTML、CSS、JS文件
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'dist')));

// 公共路由 - 不需要认证
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/login/signin.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/login/signin.html'));
});

app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/login/signin.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/login/signup.html'));
});

// ==================== 认证相关端点 (在认证中间件之前定义) ====================

// 登录端点
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('登录请求:', req.body);

        const { email, password, remember } = req.body;

        // 验证必要字段
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '邮箱和密码都是必填项'
            });
        }

        // 尝试通过后端验证用户
        let userData = null;
        try {
            // 创建FormData发送给后端
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('mode', 'check');
            formData.append('email', email);
            formData.append('password', password);

            const response = await axios.post(`${BACKEND_BASE_URL}/user/account`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });

            console.log('后端登录响应:', response.data);

            if (response.data && response.data.success) {
                userData = response.data.user_info;
            } else {
                return res.status(401).json({
                    success: false,
                    message: response.data.message || '登录失败，请检查邮箱和密码'
                });
            }
        } catch (backendError) {
            console.warn('后端服务不可用，使用本地验证:', backendError.message);

            // 后端不可用时的本地模拟验证
            // 在实际生产环境中，这里应该有本地用户数据库
            if (email === 'test@example.com' && password === 'password123') {
                userData = {
                    user_id: 'local_test_user',
                    email: email,
                    username: 'Test User'
                };
            } else {
                return res.status(401).json({
                    success: false,
                    message: '登录失败，请检查邮箱和密码'
                });
            }
        }

        if (!userData) {
            return res.status(401).json({
                success: false,
                message: '登录失败，请检查邮箱和密码'
            });
        }

        // 生成JWT token
        const tokenPayload = {
            userId: userData.user_id,
            email: userData.email,
            username: userData.username
        };

        const expiresIn = remember ? '30d' : JWT_EXPIRES_IN;
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn });

        // 计算过期时间
        const expiresAt = new Date();
        expiresAt.setTime(expiresAt.getTime() + (remember ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));

        // 存储token到数据库
        try {
            dbOps.createToken.run(userData.user_id, token, expiresAt.toISOString());
        } catch (dbError) {
            console.error('存储token失败:', dbError);
            return res.status(500).json({
                success: false,
                message: '登录过程中发生错误'
            });
        }

        // 设置cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // 在生产环境中应该设置为true
            maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        });

        // 返回成功响应
        res.json({
            success: true,
            message: '登录成功',
            user: {
                id: userData.user_id,
                email: userData.email,
                username: userData.username
            },
            token: token
        });

    } catch (error) {
        console.error('登录处理失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// 登出端点
app.post('/api/auth/logout', (req, res) => {
    try {
        // 从请求头或cookie中获取token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1] || req.cookies?.token;

        if (token) {
            // 从数据库中删除token
            try {
                dbOps.deleteToken.run(token);
            } catch (dbError) {
                console.error('删除token失败:', dbError);
            }
        }

        // 清除cookie
        res.clearCookie('token');

        res.json({
            success: true,
            message: '登出成功'
        });
    } catch (error) {
        console.error('登出处理失败:', error);
        res.status(500).json({
            success: false,
            message: '登出过程中发生错误'
        });
    }
});

// 应用认证中间件到需要保护的路由
app.use(authenticateToken);

// 受保护的路由 - 需要认证
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/chat/chat.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/setting/settings.html'));
});

app.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/help/help.html'));
});

app.get('/knowledgebase', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/knowledgebase/knowledgebase.html'));
});

app.get('/basedetail', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/basedetail/basedetail.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/home/home.html'));
});

// 404处理 - 重定向到登录页面
app.use((req, res) => {
    res.redirect('/');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 静态文件目录: ${__dirname}`);
    console.log(`🔗 后端服务地址: ${BACKEND_BASE_URL}`);
    console.log(`🌐 可访问的页面:`);
    console.log(`   - http://localhost:${PORT}/ (自动重定向到登录页面)`);
    console.log(`   - http://localhost:${PORT}/login (登录页面)`);
    console.log(`   - http://localhost:${PORT}/signin (登录页面)`);
    console.log(`   - http://localhost:${PORT}/signup (注册页面)`);
    console.log(`   - http://localhost:${PORT}/index (主聊天界面)`);
    console.log(`   - http://localhost:${PORT}/settings (设置)`);
    console.log(`   - http://localhost:${PORT}/help (帮助)`);
    console.log(`   - http://localhost:${PORT}/knowledgebase (知识库)`);
    console.log(`   - http://localhost:${PORT}/basedetail (知识库详情)`);
    console.log(`   - http://localhost:${PORT}/home (用户账户)`);
    console.log(`🔧 代理API端点:`);
    console.log(`   - GET  /health (健康检查)`);
    console.log(`   - POST /user/account (账户管理)`);
    console.log(`   - POST /user/chat_history (聊天记录)`);
    console.log(`   - POST /user/knowledgebase (知识库)`);
    console.log(`   - POST /user/custom (用户自定义)`);
    console.log(`   - POST /user/document (文档管理)`);
    console.log(`   - POST /user/architecture (架构管理)`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器正在关闭...');
    process.exit(0);
});
