const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const multer = require('multer');
const axios = require('axios');

// Import modular components
const { setupHealthRoutes } = require('./src/js/health');
const { setupAccountRoutes } = require('./src/js/account');
const { setupChatRoutes } = require('./src/js/chat');
const { setupCloudFileRoutes } = require('./src/js/cloud-file');
const { setupKnowledgeBaseRoutes } = require('./src/js/knowledgebase');
const { setupKnowledgeGraphRoutes } = require('./src/js/knowledgebase-graph');
const { setupCustomRoutes } = require('./src/js/custom');
const { setupModelRoutes } = require('./src/js/model');

// 读取配置文件
let config;
try {
    const configFile = fs.readFileSync('config.yaml', 'utf8');
    config = yaml.load(configFile);
} catch (error) {
    console.error('无法读取配置文件 config.yaml:', error);
    process.exit(1);
}

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

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

// ==================== 路由设置 ====================

// 页面路由
const pages = ['/', '/login', '/signin', '/signup', '/index', '/settings', '/help', '/knowledgebase', '/home'];
pages.forEach(route => {
    app.get(route, (req, res) => {
        const filePath = route === '/' ? '/login.html' : `${route}.html`;
        res.sendFile(path.join(__dirname, filePath));
    });
});

// ==================== 模块化路由设置 ====================

// 设置所有模块化路由
function setupModularRoutes() {
    // 健康检查路由
    setupHealthRoutes(app, config);
    
    // 账户管理路由
    setupAccountRoutes(app, config, upload);
    
    // 聊天相关路由
    setupChatRoutes(app, config, upload);
    
    // 文件管理路由
    setupCloudFileRoutes(app, config, upload);
    
    // 知识库管理路由
    setupKnowledgeBaseRoutes(app, config, upload);
    
    // 知识图谱路由
    setupKnowledgeGraphRoutes(app, config, upload);
    
    // 自定义设置路由
    setupCustomRoutes(app, config, upload);
    
    // 模型管理路由
    setupModelRoutes(app, config, upload);
}

// ==================== API端点 ====================
// 所有API端点现在通过模块化路由设置
setupModularRoutes();

// ==================== 代理路由 ====================

// 统一最大代理文件大小（50MB，与文件上传一致）
const MAX_PROXY_SIZE = 50 * 1024 * 1024;

app.get('/proxy', async (req, res) => {
    try {
        const target = req.query.url;
        if (!target || !(target.startsWith('http://') || target.startsWith('https://'))) {
            return res.status(400).send('Invalid url parameter');
        }

        // 使用 axios 以 stream 方式获取内容
        const response = await axios.get(target, {
            responseType: 'stream',
            maxContentLength: MAX_PROXY_SIZE,
            maxBodyLength: MAX_PROXY_SIZE,
            validateStatus: () => true, // 我们自行处理状态码
        });

        if (response.status >= 400) {
            return res.status(502).send(`Upstream responded with status ${response.status}`);
        }

        // 透传重要头部
        res.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        if (response.headers['content-length']) {
            res.set('Content-Length', response.headers['content-length']);
        }
        res.set('Access-Control-Allow-Origin', '*');
        res.set('X-Proxy-By', 'mindmap-proxy');
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('Content-Security-Policy', "sandbox allow-scripts allow-same-origin");

        // 管道传输
        response.data.pipe(res);
    } catch (err) {
        console.error('Proxy error:', err.message);
        res.status(502).send('Proxy fetch failed');
    }
});

// ==================== 路由设置 ====================

// Favicon处理
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// 静态文件服务 - 托管所有HTML、CSS、JS文件（放在路由后面，避免覆盖路由）
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'dist')));

// 404处理 - 重定向到首页
app.use((req, res) => {
    res.redirect('/');
});

// 启动主服务器
const serverInstance = app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 静态文件目录: ${__dirname}`);
    console.log(`🔗 配置信息:`);
    console.log(`   - 用户管理服务: ${config.user_manage_url}`);
    console.log(`   - 模型聊天服务: ${config.model_chat_url}`);
    console.log(`   - 文件管理服务: ${config.file_manage_url}`);
    console.log(`🌐 可访问的页面:`);
    console.log(`   - http://localhost:${PORT}/ (登录页面)`);
    console.log(`   - http://localhost:${PORT}/login (登录页面)`);
    console.log(`   - http://localhost:${PORT}/signin (登录页面)`);
    console.log(`   - http://localhost:${PORT}/signup (注册页面)`);
    console.log(`   - http://localhost:${PORT}/index (主聊天界面)`);
    console.log(`   - http://localhost:${PORT}/settings (设置)`);
    console.log(`   - http://localhost:${PORT}/help (帮助)`);
    console.log(`   - http://localhost:${PORT}/knowledgebase (知识库)`);
    console.log(`   - http://localhost:${PORT}/home (用户账户)`);
    console.log(`🔧 API端点: 通过模块化路由提供`);

    // 调整 Node.js 服务器超时设置，防止 60s 空闲断开
    serverInstance.keepAliveTimeout = 61_000; // 61s > 常见 60s idle timeout
    serverInstance.headersTimeout = 65_000;
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器正在关闭...');
    process.exit(0);
});
