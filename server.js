const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件服务 - 托管所有HTML、CSS、JS文件
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'dist')));

// 解析JSON和表单数据
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由 - 直接提供HTML文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname, 'help.html'));
});

app.get('/knowledgebase', (req, res) => {
    res.sendFile(path.join(__dirname, 'knowledgebase.html'));
});

app.get('/basedetail', (req, res) => {
    res.sendFile(path.join(__dirname, 'basedetail.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});


// API端点 - 基本的表单处理（返回简单响应）
app.post('/api/chat', (req, res) => {
    console.log('聊天请求:', req.body);
    res.json({ 
        success: true, 
        message: '消息已接收',
        data: req.body 
    });
});

app.post('/api/auth/login', (req, res) => {
    console.log('登录请求:', req.body);
    // 登录成功后重定向到主聊天界面
    res.redirect('/index');
});

app.post('/api/auth/register', (req, res) => {
    console.log('注册请求:', req.body);
    res.json({
        success: true,
        message: '注册成功，请登录',
        user: { id: 1, username: req.body.username }
    });
});

app.post('/api/user/profile', (req, res) => {
    console.log('用户资料更新:', req.body);
    res.json({ 
        success: true, 
        message: '资料更新成功'
    });
});

app.post('/api/settings/prompts', (req, res) => {
    console.log('用户提示词更新:', req.body);
    res.json({ 
        success: true, 
        message: '提示词已保存'
    });
});

app.post('/api/settings/memory', (req, res) => {
    console.log('模型记忆更新:', req.body);
    res.json({ 
        success: true, 
        message: '模型记忆已保存'
    });
});



// 404处理 - 重定向到登录页面
app.use((req, res) => {
    res.redirect('/');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 静态文件目录: ${__dirname}`);
    console.log(`🌐 可访问的页面:`);
    console.log(`   - http://localhost:${PORT}/ (登录页面)`);
    console.log(`   - http://localhost:${PORT}/index (主聊天界面)`);
    console.log(`   - http://localhost:${PORT}/settings (设置)`);
    console.log(`   - http://localhost:${PORT}/help (帮助)`);
    console.log(`   - http://localhost:${PORT}/knowledgebase (知识库)`);
    console.log(`   - http://localhost:${PORT}/basedetail (知识库详情)`);
    console.log(`   - http://localhost:${PORT}/home (用户账户)`);
    console.log(`   - http://localhost:${PORT}/login (登录)`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器正在关闭...');
    process.exit(0);
});
