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

// 1. 获取用户资料
app.post('/api/user/get-profile', (req, res) => {
    console.log('获取用户资料:', req.body);
    res.json({ 
        success: true, 
        message: '获取用户资料成功',
        data: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            avatar: 'avatar.jpg'
        }
    });
});

app.post('/api/settings/prompts', (req, res) => {
    console.log('用户提示词更新:', req.body);
    res.json({ 
        success: true, 
        message: '提示词已保存'
    });
});

// 2. 获取用户提示词
app.post('/api/settings/get-prompts', (req, res) => {
    console.log('获取用户提示词:', req.body);
    res.json({ 
        success: true, 
        message: '获取提示词成功',
        data: [
            { id: 1, title: '提示词1', content: '这是提示词内容1' },
            { id: 2, title: '提示词2', content: '这是提示词内容2' }
        ]
    });
});

app.post('/api/settings/memory', (req, res) => {
    console.log('模型记忆更新:', req.body);
    res.json({ 
        success: true, 
        message: '模型记忆已保存'
    });
});

// 3. 获取模型记忆
app.post('/api/settings/get-memory', (req, res) => {
    console.log('获取模型记忆:', req.body);
    res.json({ 
        success: true, 
        message: '获取模型记忆成功',
        data: {
            enabled: true,
            memoryLength: 10,
            customSettings: {}
        }
    });
});

// 4. 获取可用模型列表
app.post('/api/models/list', (req, res) => {
    console.log('获取可用模型列表:', req.body);
    res.json({ 
        success: true, 
        message: '获取模型列表成功',
        data: [
            { id: 'gpt-4', name: 'GPT-4', description: '高级模型' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '快速模型' }
        ]
    });
});

// 5. 获取可用提示词列表
app.post('/api/prompts/list', (req, res) => {
    console.log('获取可用提示词列表:', req.body);
    res.json({ 
        success: true, 
        message: '获取提示词列表成功',
        data: [
            { id: 1, title: '通用提示词', content: '通用提示词内容' },
            { id: 2, title: '编程提示词', content: '编程提示词内容' }
        ]
    });
});

// 6. 将资源上传到云端，获取公网URL
app.post('/api/upload/resource', (req, res) => {
    console.log('上传资源到云端:', req.body);
    res.json({ 
        success: true, 
        message: '资源上传成功',
        data: {
            url: 'https://example.com/uploads/resource123.pdf'
        }
    });
});

// 7. 获取已有知识库列表
app.post('/api/knowledgebase/list', (req, res) => {
    console.log('获取知识库列表:', req.body);
    res.json({ 
        success: true, 
        message: '获取知识库列表成功',
        data: [
            { id: 1, name: '知识库1', description: '这是知识库1的描述', documentCount: 5 },
            { id: 2, name: '知识库2', description: '这是知识库2的描述', documentCount: 3 }
        ]
    });
});

// 8. 获取单个知识库的详情
app.post('/api/knowledgebase/detail', (req, res) => {
    console.log('获取知识库详情:', req.body);
    res.json({ 
        success: true, 
        message: '获取知识库详情成功',
        data: {
            id: req.body.id,
            name: '知识库详情',
            description: '这是知识库的详细描述',
            createdAt: '2023-01-01',
            updatedAt: '2023-06-01',
            documentCount: 5
        }
    });
});

// 9. 新建知识库
app.post('/api/knowledgebase/create', (req, res) => {
    console.log('新建知识库:', req.body);
    res.json({ 
        success: true, 
        message: '知识库创建成功',
        data: {
            id: 3,
            name: req.body.name,
            description: req.body.description
        }
    });
});

// 10. 更改知识库信息
app.post('/api/knowledgebase/update', (req, res) => {
    console.log('更新知识库信息:', req.body);
    res.json({ 
        success: true, 
        message: '知识库信息更新成功',
        data: {
            id: req.body.id,
            name: req.body.name,
            description: req.body.description
        }
    });
});

// 11. 删除某个知识库
app.post('/api/knowledgebase/delete', (req, res) => {
    console.log('删除知识库:', req.body);
    res.json({ 
        success: true, 
        message: '知识库删除成功',
        data: {
            id: req.body.id
        }
    });
});

// 12. 上传文件到知识库
app.post('/api/knowledgebase/upload', (req, res) => {
    console.log('上传文件到知识库:', req.body);
    res.json({ 
        success: true, 
        message: '文件上传成功',
        data: {
            fileId: 'file123',
            fileName: req.body.fileName,
            fileSize: '1.2MB',
            knowledgebaseId: req.body.knowledgebaseId
        }
    });
});

// 13. 获取知识库内文档的具体列表
app.post('/api/knowledgebase/documents', (req, res) => {
    console.log('获取知识库文档列表:', req.body);
    res.json({ 
        success: true, 
        message: '获取文档列表成功',
        data: [
            { id: 'doc1', name: '文档1.pdf', size: '1.2MB', uploadTime: '2023-05-01' },
            { id: 'doc2', name: '文档2.docx', size: '0.8MB', uploadTime: '2023-05-15' }
        ]
    });
});

// 14. 下载文件到根目录下的files/documents目录
app.post('/api/knowledgebase/download', (req, res) => {
    console.log('下载文件到本地:', req.body);
    res.json({ 
        success: true, 
        message: '文件下载成功',
        data: {
            path: '/files/documents/document123.pdf',
            fileName: '文档.pdf'
        }
    });
});

// 15. 删除知识库内的某个文档
app.post('/api/knowledgebase/document/delete', (req, res) => {
    console.log('删除知识库文档:', req.body);
    res.json({ 
        success: true, 
        message: '文档删除成功',
        data: {
            documentId: req.body.documentId,
            knowledgebaseId: req.body.knowledgebaseId
        }
    });
});

// 16. 获取用户的所有聊天记录会话列表
app.post('/api/chat/sessions', (req, res) => {
    console.log('获取聊天会话列表:', req.body);
    res.json({ 
        success: true, 
        message: '获取会话列表成功',
        data: [
            { id: 'session1', title: '会话1', lastMessage: '最后一条消息', lastTime: '2023-06-01T10:30:00Z' },
            { id: 'session2', title: '会话2', lastMessage: '最后一条消息', lastTime: '2023-06-02T14:20:00Z' }
        ]
    });
});

// 17. 获取用户的某个会话的具体聊天记录
app.post('/api/chat/history', (req, res) => {
    console.log('获取会话聊天记录:', req.body);
    res.json({ 
        success: true, 
        message: '获取聊天记录成功',
        data: {
            sessionId: req.body.sessionId,
            messages: [
                { id: 'msg1', role: 'user', content: '用户消息1', timestamp: '2023-06-01T10:20:00Z' },
                { id: 'msg2', role: 'assistant', content: '助手回复1', timestamp: '2023-06-01T10:20:30Z' }
            ]
        }
    });
});

// 18. 删除某个会话id
app.post('/api/chat/session/delete', (req, res) => {
    console.log('删除聊天会话:', req.body);
    res.json({ 
        success: true, 
        message: '会话删除成功',
        data: {
            sessionId: req.body.sessionId
        }
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
