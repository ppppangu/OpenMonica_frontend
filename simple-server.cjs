const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const multer = require('multer');
const axios = require('axios');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 读取配置文件
let config = {};
try {
    const configFile = fs.readFileSync('config.yaml', 'utf8');
    config = yaml.load(configFile);
    console.log('✅ 配置文件加载成功');
} catch (error) {
    console.log('⚠️ 配置文件未找到，使用默认配置');
    config = {
        base_url: 'http://localhost:8000',
        file_manage_base_url: 'http://localhost:8087'
    };
}

// 中间件设置
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        fieldSize: 50 * 1024 * 1024  // 50MB
    }
});

// CORS设置
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// ==================== 代理路由 ====================

const MAX_PROXY_SIZE = 50 * 1024 * 1024;

app.get('/proxy', async (req, res) => {
    try {
        const target = req.query.url;
        if (!target || !(target.startsWith('http://') || target.startsWith('https://'))) {
            return res.status(400).send('Invalid url parameter');
        }

        const response = await axios.get(target, {
            responseType: 'stream',
            maxContentLength: MAX_PROXY_SIZE,
            maxBodyLength: MAX_PROXY_SIZE,
            validateStatus: () => true,
        });

        if (response.status >= 400) {
            return res.status(502).send(`Upstream responded with status ${response.status}`);
        }

        res.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        if (response.headers['content-length']) {
            res.set('Content-Length', response.headers['content-length']);
        }
        res.set('Access-Control-Allow-Origin', '*');
        res.set('X-Proxy-By', 'mindmap-proxy');
        res.set('X-Content-Type-Options', 'nosniff');

        response.data.pipe(res);
    } catch (err) {
        console.error('Proxy error:', err.message);
        res.status(502).send('Proxy fetch failed');
    }
});

// ==================== 基础路由 ====================

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'React 前端测试服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// ==================== 用户认证相关 ====================

// 用户登录
app.post('/user/account', upload.none(), (req, res) => {
    const { email, password, mode } = req.body;
    
    console.log('登录请求:', { email, mode });
    
    // ================= 新增: 账号信息更新 ================= //
    if (mode === 'update') {
        const { target, new_value, user_id } = req.body;

        // 简单校验
        if (!target || !new_value || !user_id) {
            return res.status(400).json({ status: 'fail', message: '缺少必要参数' });
        }

        // 额外密码规则校验
        if (target === 'password' && String(new_value).length < 6) {
            return res.status(400).json({ status: 'fail', message: '密码长度需≥6位' });
        }

        console.log(`更新用户(${user_id}) ${target} => ${new_value}`);
        return res.json({ status: 'success', message: `update user ${user_id} ${target} success` });
    }
    // ================= 新增逻辑结束 ================= //

    if (mode === 'check') {
        // 验证token
        const { token } = req.body;
        if (token) {
            res.json({
                success: true,
                message: 'Token 验证成功',
                user_id: 'test-user-123',
                user_email: email || 'test@example.com'
            });
        } else {
            res.json({
                success: false,
                message: 'Token 无效'
            });
        }
        return;
    }
    
    // 模拟登录验证
    if (email && password) {
        res.json({
            success: true,
            message: '登录成功',
            token: 'test-token-' + Date.now(),
            user_id: 'test-user-123',
            user_email: email,
            user_username: email.split('@')[0]
        });
    } else {
        res.json({
            success: false,
            message: '邮箱或密码不能为空'
        });
    }
});

// 用户注册
app.post('/user/register', upload.none(), (req, res) => {
    const { username, email, password } = req.body;
    
    console.log('注册请求:', { username, email });
    
    if (username && email && password) {
        res.json({
            success: true,
            message: '注册成功',
            user_id: 'new-user-' + Date.now()
        });
    } else {
        res.json({
            success: false,
            message: '请填写完整信息'
        });
    }
});

// ==================== 聊天相关 ====================

// 获取聊天历史
app.post('/user/chat/get_history_list', upload.none(), (req, res) => {
    res.json({
        success: true,
        data: [
            {
                session_id: 'session-1',
                title: '测试对话 1',
                created_at: new Date().toISOString(),
                message_count: 5
            },
            {
                session_id: 'session-2', 
                title: '测试对话 2',
                created_at: new Date().toISOString(),
                message_count: 3
            }
        ]
    });
});

// 获取聊天内容
app.post('/user/chat/get_history_content', upload.none(), (req, res) => {
    const { session_id } = req.body;
    
    res.json({
        success: true,
        data: [
            {
                role: 'user',
                content: '你好，这是一个测试消息',
                timestamp: new Date().toISOString()
            },
            {
                role: 'assistant',
                content: '你好！我是AI助手，很高兴为您服务。这是React版本的测试响应。',
                timestamp: new Date().toISOString()
            }
        ]
    });
});

// ==================== 知识库相关 ====================

// 获取知识库列表
app.post('/user/knowledgebase/get_list', upload.none(), (req, res) => {
    res.json({
        success: true,
        data: [
            {
                knowledgebase_id: 'kb-1',
                name: '测试知识库 1',
                description: '这是第一个测试知识库',
                document_count: 5,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                knowledgebase_id: 'kb-2',
                name: '测试知识库 2', 
                description: '这是第二个测试知识库',
                document_count: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ]
    });
});

// 获取知识库详情
app.post('/user/knowledgebase/get_detail', upload.none(), (req, res) => {
    const { knowledgebase_id } = req.body;
    
    res.json({
        success: true,
        data: {
            knowledgebase_id: knowledgebase_id,
            name: '测试知识库详情',
            description: '详细的知识库信息',
            document_count: 5,
            documents: [
                {
                    document_id: 'doc-1',
                    filename: '测试文档1.pdf',
                    pdf_file_path: 'http://example.com/doc1.pdf',
                    markdown_file_path: 'http://example.com/doc1.md',
                    upload_time: new Date().toISOString()
                }
            ]
        }
    });
});

// ==================== 文件管理 ====================

// 文件上传
app.post('/user/file/upload_file', upload.single('file'), (req, res) => {
    if (req.file) {
        res.json({
            success: true,
            message: '文件上传成功',
            public_url: `http://localhost:3001/files/${req.file.originalname}`,
            filename: req.file.originalname,
            file_size: req.file.size
        });
    } else {
        res.json({
            success: false,
            message: '没有接收到文件'
        });
    }
});

// ==================== 错误处理 ====================

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `API 端点不存在: ${req.method} ${req.path}`
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
    console.log(`🚀 React 测试服务器启动成功!`);
    console.log(`📍 服务器地址: http://localhost:${PORT}`);
    console.log(`🔗 前端地址: http://localhost:5174`);
    console.log(`📋 API 端点:`);
    console.log(`   - GET  /health - 健康检查`);
    console.log(`   - POST /user/account - 用户登录/验证`);
    console.log(`   - POST /user/register - 用户注册`);
    console.log(`   - POST /user/chat/* - 聊天相关`);
    console.log(`   - POST /user/knowledgebase/* - 知识库相关`);
    console.log(`   - POST /user/file/* - 文件管理`);
    console.log(`\n✅ 准备就绪，可以开始测试 React 应用！`);
});
