const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const multer = require('multer');
const FormData = require('form-data');

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

// 后端服务URL，注意！！！！涉及到该后端的请求，发送时需要使用form-data格式，禁止使用json格式，否则必然会报错
const BACKEND_BASE_URL = config.user_manage_url;
const MODEL_CHAT_BASE_URL = config.model_chat_url;

// 配置multer处理FormData
const upload = multer();

// CORS配置 - 允许Vite开发服务器访问
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for development
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 解析JSON和表单数据
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.none()); // 处理multipart/form-data

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// 测试路由
app.get('/test', (req, res) => {
    console.log('测试路由被访问');
    res.json({ message: '测试成功', timestamp: new Date().toISOString() });
});

// 健康检查
app.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${BACKEND_BASE_URL}/health`, {
            timeout: 10000 // 5秒超时
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

// 检查token是否有效，如果有效，返回true，否则返回false。这个函数非常重要，基本都要用。
async function check_token_valid(token) {
    try {
        if (!token) {
            console.log('Token is empty or undefined');
            return false;
        }

        const formData = new FormData();
        formData.append('mode', 'validate');
        formData.append('token', token);

        console.log('验证token:', token.substring(0, 10) + '...');

        const response = await axios.post(`${BACKEND_BASE_URL}/user/token`, formData, {
            headers: formData.getHeaders(),
            timeout: 10000
        });

        console.log('Token验证响应:', response.data);

        if (response.data && response.data.data && response.data.data.valid === true) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Token验证请求失败:', error.message);
        // 如果后端不可用，为了开发测试，暂时返回true
        console.warn('后端服务不可用，跳过token验证 (开发模式)');
        return true;
    }
}

// 获取用户的token，用于登录后获取token方便后续操作进行校验
async function get_user_token(user_uuid) {
    const formData = new FormData();
    formData.append('mode', 'request');
    formData.append('user_uuid', user_uuid);
    const response = await axios.post(`${BACKEND_BASE_URL}/user/token`, formData, {
        headers: formData.getHeaders(),
        timeout: 10000
    });

    if (response.data.status == 'success') {
        return response.data.data.token;
    } else {
        return response.data.message;
    }
}


// ==================== 页面路由 ====================

// 登录相关页面
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

// 应用页面路由
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/chat/chat.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/settings/settings.html'));
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

// ==================== API端点 ====================

// 登录端点
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('收到登录请求:', req.body);

        // 验证必要字段
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({
                success: false,
                message: '邮箱和密码是必填项'
            });
        }

        // 尝试连接后端服务
        try {
            const formData = new FormData();
            formData.append('mode', 'check');  // 使用check模式进行登录验证
            formData.append('email', req.body.email);
            formData.append('password', req.body.password);

            console.log('发送到后端的登录请求:', {
                mode: 'check',
                email: req.body.email,
                backend_url: `${BACKEND_BASE_URL}/user/account`
            });

            const response = await axios.post(`${BACKEND_BASE_URL}/user/account`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });

            console.log('后端登录响应:', response.data);

            if (response.data.success === true) {
                // 获取用户的token用于校验，并将token存入pinna中
                const token = await get_user_token(response.data.user_info.user_id);
                console.log('登录成功: ' + response.data.message);
                console.log('token: ' + token);
                console.log('user_id: ' + response.data.user_info.user_id);
                console.log('user_email: ' + response.data.user_info.email);
                console.log('user_username: ' + response.data.user_info.username);

                
                res.json({
                    success: true,
                    message: response.data.message,
                    token: token,
                    user_id: response.data.user_info.user_id,
                    user_email: response.data.user_info.email,
                    user_username: response.data.user_info.username
                });
            } else {
                console.log('登录失败: ' + response.data.message);
                res.json({
                    success: false,
                    message: response.data.message || '登录失败，请检查邮箱和密码'
                });
            }
        } catch (backendError) {
            console.warn('后端服务不可用，使用模拟登录 (开发模式):', backendError.message);

            // 模拟登录成功（用于开发测试）
            const mockToken = 'mock_token_' + Date.now();
            const mockUserId = 'mock_user_' + Date.now();

            console.log('模拟登录成功，生成token:', mockToken);

            res.json({
                success: true,
                message: '登录成功 (模拟模式)',
                token: mockToken,
                user_id: mockUserId,
                user_email: req.body.email,
                user_username: req.body.email.split('@')[0]
            });
        }
    } catch (error) {
        console.error('登录处理失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// 注册端点
app.post('/user/account', async (req, res) => {
    try {
        console.log('收到注册请求:', req.body);

        // 验证必要字段
        if (!req.body.username || !req.body.email || !req.body.password) {
            return res.status(400).json({
                success: false,
                message: '用户名、邮箱和密码是必填项'
            });
        }

        // 尝试连接后端服务
        try {
            const formData = new FormData();
            formData.append('mode', 'register');
            formData.append('username', req.body.username);
            formData.append('email', req.body.email);
            formData.append('password', req.body.password);

            console.log('发送到后端的注册请求:', {
                mode: 'register',
                username: req.body.username,
                email: req.body.email,
                backend_url: `${BACKEND_BASE_URL}/user/account`
            });

            const response = await axios.post(`${BACKEND_BASE_URL}/user/account`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });

            console.log('后端注册响应:', response.data);

            if (response.data.success === true) {
                console.log('注册成功: ' + response.data.message);
                res.json({
                    success: true,
                    message: response.data.message || '注册成功'
                });
            } else {
                console.log('注册失败: ' + response.data.message);
                res.json({
                    success: false,
                    message: response.data.message || '注册失败，请稍后重试'
                });
            }
        } catch (backendError) {
            console.warn('后端服务不可用，使用本地模拟注册:', backendError.message);

            // 模拟注册（用于开发测试）
            res.json({
                success: true,
                message: '注册成功 (模拟模式)'
            });
        }
    } catch (error) {
        console.error('注册处理失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// 获取对话session列表端点
app.post('/user/chat_history', async (req, res) => {
    try {
        const token = req.body.token;
        const valid = await check_token_valid(token);
        if (!valid) {
            console.log('token无效，请重新登录');
            alert('token无效，请重新登录');
            res.redirect('/');
            return;
        }

        console.log('获取对话session列表请求:', req.body);

        const mode = 'get_all_list'
        const user_id = req.body.user_id;

        // 验证必要字段
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: '用户ID是必填项'
            });
        }

        // 尝试连接后端服务
        try {
            const formData = new FormData();
            formData.append('mode', mode);
            formData.append('user_id', user_id);

            console.log('发送到后端的对话历史请求:', { mode: mode, user_id: user_id });

            const response = await axios.post(`${BACKEND_BASE_URL}/user/chat_history`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });

            console.log('后端对话历史响应:', response.data);
            res.json(response.data);
        } catch (backendError) {
            console.warn('后端服务不可用，使用本地模拟对话历史:', backendError.message);

            // 模拟对话session列表数据
            const mockSessions = [
                {
                    session_id: 'session_' + Date.now() + '_1',
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    session_id: 'session_' + Date.now() + '_2',
                    timestamp: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    session_id: 'session_' + Date.now() + '_3',
                    timestamp: new Date(Date.now() - 259200000).toISOString()
                },
                {
                    session_id: 'session_' + Date.now() + '_4',
                    timestamp: new Date(Date.now() - 345600000).toISOString()
                }
            ];

            res.json({
                success: true,
                message: '获取对话列表成功',
                data: {
                    sessions: mockSessions,
                    total_count: mockSessions.length
                }
            });
        }
    } catch (error) {
        console.error('获取对话历史失败:', error.message);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// 删除对话session端点
app.post('/user/chat_history/delete', async (req, res) => {
    try {
        const token = req.body.token;
        const valid = await check_token_valid(token);
        if (!valid) {
            console.log('token无效，请重新登录');
            alert('token无效，请重新登录');
            res.redirect('/');
            return;
        }

        console.log('删除对话session请求:', req.body);

        const mode = 'delete_specific'
        const user_id = req.body.user_id;
        const session_id = req.body.session_id;

        // 验证必要字段
        if (!user_id || !session_id) {
            return res.status(400).json({
                success: false,
                message: '用户ID和会话ID是必填项'
            });
        }

        // 尝试连接后端服务
        try {
            const formData = new FormData();
            formData.append('mode', mode);
            formData.append('user_id', user_id);
            formData.append('session_id', session_id);

            console.log('发送到后端的删除对话请求:', { mode: mode, user_id: user_id, session_id: session_id });

            const response = await axios.post(`${BACKEND_BASE_URL}/user/chat_history`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });
            console.log('后端删除对话响应:', response.data);
            res.json(response.data);
        } catch (backendError) {
            console.error('删除对话失败:', backendError.message);

            // 如果后端不可用，返回模拟成功响应（用于开发测试）
            console.warn('后端服务不可用，返回模拟删除成功响应');
            res.json({
                status: 'success',
                message: `delete specific chat history ${session_id} for user ${user_id} success (simulated)`
            });
        }
    } catch (error) {
        console.error('删除对话处理失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// 获取具体对话内容
app.post('/user/chat_history/get_content', async (req, res) => {
    try {
        const token = req.body.token;
        const valid = await check_token_valid(token);
        if (!valid) {
            console.log('token无效，请重新登录');
            alert('token无效，请重新登录');
            res.redirect('/');
            return;
        }

        const mode = 'get_specific'
        const user_id = req.body.user_id;
        const session_id = req.body.session_id;

        if (!user_id || !session_id) {
            return res.status(400).json({
                success: false,
                message: '用户ID和会话ID是必填项'
            });
        }

        try {
            const formData = new FormData();
            formData.append('mode', mode);
            formData.append('user_id', user_id);
            formData.append('session_id', session_id);

            const response = await axios.post(`${BACKEND_BASE_URL}/user/chat_history`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });
            console.log('后端获取对话内容响应:', response.data);
            res.json(response.data.data.chat_history);
        } catch (backendError) {
            console.error('获取对话内容失败:', backendError.message);
            res.status(500).json({
                success: false,
                message: '服务器内部错误，请稍后重试'
            });
        }
    } catch (error) {
        console.error('获取对话内容失败:', error.message);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// 获取知识库列表
app.post('/user/knowledgebase/get_list', async (req, res) => {
    try {
        console.log('收到获取知识库列表请求:', req.body);

        const token = req.body.token;
        const user_id = req.body.user_id;

        // 验证必要字段
        if (!token) {
            console.log('token缺失');
            return res.status(401).json({
                success: false,
                message: 'token是必填项，请重新登录'
            });
        }

        if (!user_id) {
            console.log('user_id缺失');
            return res.status(400).json({
                success: false,
                message: '用户ID是必填项'
            });
        }

        // 验证token
        try {
            const valid = await check_token_valid(token);
            if (!valid) {
                console.log('token无效，请重新登录');
                return res.status(401).json({
                    success: false,
                    message: 'token无效，请重新登录'
                });
            }
        } catch (tokenError) {
            console.error('token验证失败:', tokenError.message);
            return res.status(401).json({
                success: false,
                message: 'token验证失败，请重新登录'
            });
        }

        const mode = 'get'
        const target = 'list'

        try {
            const formData = new FormData();
            formData.append('mode', mode);
            formData.append('target', target);
            formData.append('user_id', user_id);

            console.log('发送到后端的知识库列表请求:', { mode, target, user_id });

            const response = await axios.post(`${BACKEND_BASE_URL}/user/knowledgebase`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });
            console.log('后端获取知识库列表响应:', response.data);
            res.json(response.data.data);
        } catch (backendError) {
            console.warn('后端服务不可用，使用本地模拟知识库数据:', backendError.message);

            // 模拟知识库列表数据
            const mockKnowledgeBases = [
                {
                    id: 'kb_1',
                    name: '金融知识库',
                    description: '学习金融过程中的知识库',
                    document_count: 4,
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    updated_at: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: 'kb_2',
                    name: '法律知识库',
                    description: '法律相关资料',
                    document_count: 3,
                    created_at: new Date(Date.now() - 172800000).toISOString(),
                    updated_at: new Date(Date.now() - 7200000).toISOString()
                },
                {
                    id: 'kb_3',
                    name: '设计知识库',
                    description: '设计相关的资料和灵感',
                    document_count: 7,
                    created_at: new Date(Date.now() - 259200000).toISOString(),
                    updated_at: new Date(Date.now() - 10800000).toISOString()
                }
            ];

            res.json(mockKnowledgeBases);
        }
    } catch (error) {
        console.error('获取知识库列表失败:', error.message);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.post('/user/knowledgebase/create', async (req, res) => {
    const token = req.body.token;
    const valid = await check_token_valid(token);
    if (!valid) {
        console.log('token无效，请重新登录');
        alert('token无效，请重新登录');
        res.redirect('/');
            return;
        }
        
        const mode = 'update'
        const name = req.body.name;
        const description = req.body.description;
        const user_id = req.body.user_id;
        const knowledgebase_id = req.body.knowledgebase_id;
        
        if (!user_id || !knowledgebase_id) {
            return res.status(400).json({
                success: false,
                message: '用户ID和知识库ID是必填项'
            });
        }
        
        try {
            const formData = new FormData();
            formData.append('mode', mode);
            formData.append('name', name);
            formData.append('description', description);
            formData.append('user_id', user_id);
            formData.append('knowledgebase_id', knowledgebase_id);
            
            const response = await axios.post(`${BACKEND_BASE_URL}/user/knowledgebase`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });
            console.log('后端创建知识库响应:', response.data);
            res.json(response.data.data);
        } catch (backendError) {
            console.error('创建知识库失败:', backendError.message);
            res.status(500).json({
                success: false,
                message: '服务器内部错误，请稍后重试'
            });
        }
});

app.post('/user/knowledgebase/delete', async (req, res) => {
    const token = req.body.token;
    const valid = await check_token_valid(token);
    if (!valid) {
        console.log('token无效，请重新登录');
        alert('token无效，请重新登录');
        res.redirect('/');
        return;
    }
    const mode = 'delete'
    const knowledgebase_id = req.body.knowledgebase_id;
    const user_id = req.body.user_id;
    const formData = new FormData();
    formData.append('mode', mode);
    formData.append('knowledgebase_id', knowledgebase_id);
    formData.append('user_id', user_id);
    const response = await axios.post(`${BACKEND_BASE_URL}/user/knowledgebase`, formData, {
        headers: formData.getHeaders(),
        timeout: 10000
    });
    console.log('后端删除知识库响应:', response.data);
    res.json(response.data.data);
});

app.post('/user/knowledgebase/update', async (req, res) => {
    const token = req.body.token;
    const valid = await check_token_valid(token);
    if (!valid) {
        console.log('token无效，请重新登录');
        alert('token无效，请重新登录');
        res.redirect('/');
        return;
    }
    const mode = 'update'
    const knowledgebase_id = req.body.knowledgebase_id;
    const user_id = req.body.user_id;
    const name = req.body.name;
    const description = req.body.description;
    const formData = new FormData();
    formData.append('mode', mode);
    formData.append('knowledgebase_id', knowledgebase_id);
    formData.append('user_id', user_id);
    formData.append('name', name);
    formData.append('description', description);
    const response = await axios.post(`${BACKEND_BASE_URL}/user/knowledgebase`, formData, {
        headers: formData.getHeaders(),
        timeout: 10000
    });
    console.log('后端更新知识库响应:', response.data);
    res.json(response.data.data);
});

app.post('/user/settings/get_user_prompt', async (req, res) => {
    try {
        const token = req.body.token;
        const valid = await check_token_valid(token);
        if (!valid) {
            console.log('token无效，请重新登录');
            return res.status(401).json({
                success: false,
                message: 'token无效，请重新登录'
            });
        }
        const mode = 'get'
        const target = 'custom_personality'
        const user_id = req.body.user_id;
        const formData = new FormData();
        formData.append('mode', mode);
        formData.append('target', target);
        formData.append('user_id', user_id);

        const response = await axios.post(`${BACKEND_BASE_URL}/user/custom`, formData, {
            headers: formData.getHeaders(),
            timeout: 10000
        });
        console.log('后端获取用户自定义响应:', response.data);

        // 确保返回正确的数据结构
        const responseData = response.data?.data || {};
        res.json(responseData);
    } catch (error) {
        console.error('获取用户提示失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户提示失败',
            error: error.message
        });
    }
});

app.post('/user/settings/get_model_memory', async (req, res) => {
    try {
        const token = req.body.token;
        const valid = await check_token_valid(token);
        if (!valid) {
            console.log('token无效，请重新登录');
            return res.status(401).json({
                success: false,
                message: 'token无效，请重新登录'
            });
        }
        const mode = 'get'
        const target = 'custom_memory'
        const user_id = req.body.user_id;
        const formData = new FormData();
        formData.append('mode', mode);
        formData.append('target', target);
        formData.append('user_id', user_id);

        const response = await axios.post(`${BACKEND_BASE_URL}/user/custom`, formData, {
            headers: formData.getHeaders(),
            timeout: 10000
        });
        console.log('后端获取模型记忆响应:', response.data);

        // 确保返回正确的数据结构
        const responseData = response.data?.data || {};
        res.json(responseData);
    } catch (error) {
        console.error('获取模型记忆失败:', error);
        res.status(500).json({
            success: false,
            message: '获取模型记忆失败',
            error: error.message
        });
    }
});

app.post('/user/settings/update_user_prompt', async (req, res) => {
    try {
        const token = req.body.token;
        const valid = await check_token_valid(token);
        if (!valid) {
            console.log('token无效，请重新登录');
            return res.status(401).json({
                success: false,
                message: 'token无效，请重新登录'
            });
        }
        const mode = 'update'
        const target = 'custom_personality'
        const user_id = req.body.user_id;
        const new_text = req.body.new_text;
        const formData = new FormData();
        formData.append('mode', mode);
        formData.append('target', target);
        formData.append('user_id', user_id);
        formData.append('new_text', new_text);

        const response = await axios.post(`${BACKEND_BASE_URL}/user/custom`, formData, {
            headers: formData.getHeaders(),
            timeout: 10000
        });
        console.log('后端更新用户提示响应:', response.data);

        // 确保返回正确的数据结构
        const responseData = response.data?.data || {};
        res.json(responseData);
    } catch (error) {
        console.error('更新用户提示失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户提示失败',
            error: error.message
        });
    }
});

app.post('/user/settings/update_model_memory', async (req, res) => {
    try {
        const token = req.body.token;
        const valid = await check_token_valid(token);
        if (!valid) {
            console.log('token无效，请重新登录');
            return res.status(401).json({
                success: false,
                message: 'token无效，请重新登录'
            });
        }
        const mode = 'update'
        const target = 'custom_memory'
        const user_id = req.body.user_id;
        const new_text = req.body.new_text;
        const formData = new FormData();
        formData.append('mode', mode);
        formData.append('target', target);
        formData.append('user_id', user_id);
        formData.append('new_text', new_text);

        const response = await axios.post(`${BACKEND_BASE_URL}/user/custom`, formData, {
            headers: formData.getHeaders(),
            timeout: 10000
        });
        console.log('后端更新模型记忆响应:', response.data);

        // 确保返回正确的数据结构
        const responseData = response.data?.data || {};
        res.json(responseData);
    } catch (error) {
        console.error('更新模型记忆失败:', error);
        res.status(500).json({
            success: false,
            message: '更新模型记忆失败',
            error: error.message
        });
    }
});

app.post('/user/setting/update_generate_user_infomation', async (req, res) => {
    // 用于更新用户username, email, password
    const token = req.body.token;
    const valid = await check_token_valid(token);
    if (!valid) {
        console.log('token无效，请重新登录');
        alert('token无效，请重新登录');
        res.redirect('/');
        return;
    }
    const mode = 'update'
    const target = req.body.target;
    const user_id = req.body.user_id;
    const new_value = req.body.new_value;
    const formData = new FormData();
    formData.append('mode', mode);
    formData.append('target', target);
    formData.append('user_id', user_id);
    formData.append('new_value', new_value);
    const response = await axios.post(`${BACKEND_BASE_URL}/user/account`, formData, {
        headers: formData.getHeaders(),
        timeout: 10000
    });
    console.log('后端更新用户信息响应:', response.data);
    res.json(response.data.data);
});

app.post('/user/model/get_list', async (req, res) => {
    try {
        console.log('收到获取模型列表请求:', req.body);
        const token = req.body.token;
        const valid = await check_token_valid(token);
        if (!valid) {
            console.log('token无效，请重新登录');
            return res.status(401).json({
                success: false,
                message: 'token无效，请重新登录'
            });
        }

        console.log('尝试从后端获取模型列表:', `${MODEL_CHAT_BASE_URL}/v1/models`);
        const response = await axios.get(`${MODEL_CHAT_BASE_URL}/v1/models`, {
            timeout: 30000, // 30 second timeout
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log('后端获取模型列表响应:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('获取模型列表失败:', error.message);

        // Return proper error response instead of mock data
        let errorMessage = '获取模型列表失败';
        let statusCode = 500;

        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            errorMessage = '连接超时，请稍后重试';
            statusCode = 408;
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            errorMessage = '无法连接到模型服务，请检查网络连接';
            statusCode = 503;
        } else if (error.response) {
            errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`;
            statusCode = error.response.status;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error_code: error.code || 'UNKNOWN_ERROR',
            retry_after: 5 // Suggest retry after 5 seconds
        });
    }
});


app.post('/user/chat', async (req, res) => {
    const token = req.body.token;
    const valid = await check_token_valid(token);
    if (!valid) {
        console.log('token无效，请重新登录');
        alert('token无效，请重新登录');
        res.redirect('/');
        return;
    }
    // 获取用户id和相关的消息，以及“额外消息”
    const user_id = req.body.user_id;
    const model_id = req.body.model_id;

    // Parse JSON strings from FormData
    let user_message_list = [];
    let extra_request_list = [];

    try {
        user_message_list = JSON.parse(req.body.user_message_list || '[]');
    } catch (e) {
        console.error('Error parsing user_message_list:', e);
        user_message_list = [];
    }

    try {
        extra_request_list = JSON.parse(req.body.extra_request_list || '[]');
    } catch (e) {
        console.error('Error parsing extra_request_list:', e);
        extra_request_list = [];
    }

    console.log('Parsed user_message_list:', user_message_list);
    console.log('Parsed extra_request_list:', extra_request_list);

    // 将user_message和extra_request_list合并成一个列表
    const messages_list = [
        ...user_message_list,
        ...extra_request_list
    ]

    // extra_request_list是一个数组，数组中每个元素是一个字典，字典中包含两个键值对，两个键分别是name和parameters，name对应的键是字符串，parameters对应的键是一个列表字典，列表字典中是所需参数的名字和对应的值
    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('model', model_id);
    formData.append('messages', JSON.stringify(messages_list));

    console.log('Sending to backend:', {
        user_id: user_id,
        model: model_id,
        messages: messages_list
    });

    const response = await axios.post(`${BACKEND_BASE_URL}/user/chat`, formData, {
        headers: formData.getHeaders(),
        timeout: 10000
    });
    console.log('后端聊天响应:', response.data);
    res.json(response.data.data);
});

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

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 静态文件目录: ${__dirname}`);
    console.log(`🔗 后端服务地址: ${BACKEND_BASE_URL}`);
    console.log(`🌐 可访问的页面:`);
    console.log(`   - http://localhost:${PORT}/ (登录页面)`);
    console.log(`   - http://localhost:${PORT}/login (登录页面)`);
    console.log(`   - http://localhost:${PORT}/signin (登录页面)`);
    console.log(`   - http://localhost:${PORT}/signup (注册页面)`);
    console.log(`   - http://localhost:${PORT}/index (主聊天界面)`);
    console.log(`   - http://localhost:${PORT}/settings (设置)`);
    console.log(`   - http://localhost:${PORT}/help (帮助)`);
    console.log(`   - http://localhost:${PORT}/knowledgebase (知识库)`);
    console.log(`   - http://localhost:${PORT}/basedetail (知识库详情)`);
    console.log(`   - http://localhost:${PORT}/home (用户账户)`);
    console.log(`🔧 API端点:`);
    console.log(`   - GET  /health (健康检查)`);
    console.log(`   - POST /user/chat_history (聊天记录)`);
    console.log(`   - POST /user/chat_history/delete (删除聊天记录)`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器正在关闭...');
    process.exit(0);
});
