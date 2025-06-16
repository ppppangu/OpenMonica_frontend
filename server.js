const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const multer = require('multer');
const FormData = require('form-data');
const fileUpload = require('express-fileupload');

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
const FILE_MANAGE_BASE_URL = config.file_manage_url;

// 配置multer处理FormData
const upload = multer();
const uploadFile = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Accept all files
        cb(null, true);
    }
});

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

// 解析JSON数据
app.use(express.json());

// 对大部分路由应用urlencoded中间件，但跳过文件上传路由
app.use('/api', express.urlencoded({ extended: true }));

// 为特定的非文件上传路由应用urlencoded中间件
app.use('/user/account', express.urlencoded({ extended: true }));
app.use('/user/chat_history', express.urlencoded({ extended: true }));
app.use('/user/chat', express.urlencoded({ extended: true }));
// 注意：/user/knowledgebase 路由使用 upload.none() 中间件，不需要 urlencoded 中间件

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

// 重试机制工具函数
async function retryRequest(requestFunction, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`尝试第 ${attempt} 次请求...`);
            const result = await requestFunction();
            console.log(`第 ${attempt} 次请求成功`);
            return result;
        } catch (error) {
            lastError = error;
            console.warn(`第 ${attempt} 次请求失败:`, error.message);

            if (attempt < maxRetries) {
                // 指数退避：每次重试延迟时间翻倍
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.log(`等待 ${delay}ms 后进行第 ${attempt + 1} 次重试...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`所有 ${maxRetries} 次重试都失败了，抛出最后一个错误`);
    throw lastError;
}

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
    try {
        console.log('开始获取用户token，使用重试机制...');

        // 定义获取token的请求函数
        const getTokenRequest = async () => {
            const formData = new FormData();
            formData.append('mode', 'request');
            formData.append('user_uuid', user_uuid);

            return await axios.post(`${BACKEND_BASE_URL}/user/token`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });
        };

        // 使用重试机制执行获取token请求（最多重试3次，基础延迟1秒）
        const response = await retryRequest(getTokenRequest, 3, 1000);

        if (response.data.status == 'success') {
            console.log('获取token成功');
            return response.data.data.token;
        } else {
            console.warn('获取token失败:', response.data.message);
            return response.data.message;
        }
    } catch (error) {
        console.error('获取token重试失败:', error.message);
        // 返回一个模拟token，避免登录流程中断
        const fallbackToken = 'fallback_token_' + Date.now();
        console.log('使用fallback token:', fallbackToken);
        return fallbackToken;
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
app.post('/api/auth/login', upload.none(), async (req, res) => {
    try {
        console.log('收到登录请求:', req.body);

        // 验证必要字段
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({
                success: false,
                message: '邮箱和密码是必填项'
            });
        }

        // 尝试连接后端服务，使用重试机制
        try {
            console.log('开始登录请求，使用重试机制...');

            // 定义登录请求函数
            const loginRequest = async () => {
                const formData = new FormData();
                formData.append('mode', 'check');  // 使用check模式进行登录验证
                formData.append('email', req.body.email);
                formData.append('password', req.body.password);

                console.log('发送到后端的登录请求:', {
                    mode: 'check',
                    email: req.body.email,
                    backend_url: `${BACKEND_BASE_URL}/user/account`
                });

                return await axios.post(`${BACKEND_BASE_URL}/user/account`, formData, {
                    headers: formData.getHeaders(),
                    timeout: 10000
                });
            };

            // 使用重试机制执行登录请求（最多重试3次，基础延迟1秒）
            const response = await retryRequest(loginRequest, 3, 1000);

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
            console.warn('所有重试尝试都失败，后端服务不可用，使用模拟登录 (开发模式):', backendError.message);

            // 记录详细的错误信息
            if (backendError.code === 'ECONNABORTED') {
                console.warn('错误类型: 请求超时');
            } else if (backendError.code === 'ECONNREFUSED') {
                console.warn('错误类型: 连接被拒绝');
            } else if (backendError.code === 'ENOTFOUND') {
                console.warn('错误类型: 域名解析失败');
            } else {
                console.warn('错误类型: 其他网络错误');
            }

            // 模拟登录成功（用于开发测试）
            const mockToken = 'mock_token_' + Date.now();
            const mockUserId = 'mock_user_' + Date.now();

            console.log('模拟登录成功，生成token:', mockToken);

            res.json({
                success: true,
                message: '登录成功 (模拟模式 - 后端服务重试失败)',
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
app.post('/user/account', upload.none(), async (req, res) => {
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
app.post('/user/chat_history', upload.none(), async (req, res) => {
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
app.post('/user/chat_history/delete', upload.none(), async (req, res) => {
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
app.post('/user/chat_history/get_content', upload.none(), async (req, res) => {
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
app.post('/user/knowledgebase/get_list', upload.none(), async (req, res) => {
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

app.post('/user/knowledgebase/get_detail', upload.none(), async (req, res) => {
// 返回数据格式
// {
//     "status": "success",
//     "message": "get specific knowledgebase xxx for user 9836c8af-3eb9-4739-b6fa-52ec6687141d success",
//     "data": {
//         "id": "xxx",
//         "user_id": "9836c8af-3eb9-4739-b6fa-52ec6687141d",
//         "name": "Knowledge Base xxx",
//         "description": "Auto-created knowledge base for user 9836c8af-3eb9-4739-b6fa-52ec6687141d",
//         "documents": [
//             {
//                 "id": "814ee39a-bbfd-490c-9195-c8dde3690576",
//                 "name": "Document 814ee39a-bbfd-490c-9195-c8dde3690576",
//                 "pdf_file_path": "http://1.tcp.cpolar.cn:21729/publicfiles/9836c8af-3eb9-4739-b6fa-52ec6687141d/knowledgebase/xxx/814ee39a-bbfd-490c-9195-c8dde3690576/814ee39a-bbfd-490c-9195-c8dde3690576.pdf",
//                 "markdown_file_path": "http://1.tcp.cpolar.cn:21729/publicfiles/9836c8af-3eb9-4739-b6fa-52ec6687141d/knowledgebase/xxx/814ee39a-bbfd-490c-9195-c8dde3690576/814ee39a-bbfd-490c-9195-c8dde3690576.md",
//                 "upload_time": "2025-06-16T04:48:05.183986+00:00"
//             },
//             {
//                 "id": "dac08e54-cf3b-444a-982f-d2f6d0a872f7",
//                 "name": "Document dac08e54-cf3b-444a-982f-d2f6d0a872f7",
//                 "pdf_file_path": "http://1.tcp.cpolar.cn:21729/publicfiles/9836c8af-3eb9-4739-b6fa-52ec6687141d/knowledgebase/xxx/dac08e54-cf3b-444a-982f-d2f6d0a872f7/dac08e54-cf3b-444a-982f-d2f6d0a872f7.pdf",
//                 "markdown_file_path": "http://1.tcp.cpolar.cn:21729/publicfiles/9836c8af-3eb9-4739-b6fa-52ec6687141d/knowledgebase/xxx/dac08e54-cf3b-444a-982f-d2f6d0a872f7/dac08e54-cf3b-444a-982f-d2f6d0a872f7.md",
//                 "upload_time": "2025-06-16T04:53:17.491103+00:00"
//             }
//         ],
//         "document_count": 2
//     }
// }

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
        const target = 'detail'
        const knowledgebase_id = req.body.knowledgebase_id;
        const user_id = req.body.user_id;
        const formData = new FormData();
        formData.append('mode', mode);
        formData.append('target', target);
        formData.append('knowledgebase_id', knowledgebase_id);
        formData.append('user_id', user_id);
        const response = await axios.post(`${BACKEND_BASE_URL}/user/knowledgebase`, formData, {
            headers: formData.getHeaders(),
            timeout: 10000
        });
        console.log('后端获取知识库详情响应:', response.data);
        res.json(response.data.data);
    } catch (error) {
        console.error('获取知识库详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.post('/user/knowledgebase/create', upload.none(), async (req, res) => {
    try {
        console.log('收到创建知识库请求:', req.body);

        const token = req.body.token;
        const user_id = req.body.user_id;
        const name = req.body.name;
        const description = req.body.description;
        const knowledgebase_id = req.body.knowledgebase_id;

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

        if (!name || !name.trim()) {
            console.log('name缺失');
            return res.status(400).json({
                success: false,
                message: '知识库名称是必填项'
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

        const mode = 'update';

        try {
            const formData = new FormData();
            formData.append('mode', mode);
            formData.append('name', name.trim());
            formData.append('description', description || '');
            formData.append('user_id', user_id);
            if (knowledgebase_id) {
                formData.append('knowledgebase_id', knowledgebase_id);
            }

            console.log('发送到后端的创建知识库请求:', {
                mode,
                name: name.trim(),
                description: description || '',
                user_id,
                knowledgebase_id
            });

            const response = await axios.post(`${BACKEND_BASE_URL}/user/knowledgebase`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });

            console.log('后端创建知识库响应:', response.data);

            // 检查后端响应格式
            if (response.data && response.data.status === 'success') {
                res.json({
                    success: true,
                    message: response.data.message || '知识库创建成功',
                    data: response.data.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: response.data?.message || '创建知识库失败'
                });
            }
        } catch (backendError) {
            console.error('创建知识库失败:', backendError.message);
            console.warn('后端服务不可用，返回模拟成功响应');

            // 后端不可用时返回模拟成功响应
            res.json({
                success: true,
                message: '知识库创建成功（模拟响应）',
                data: {
                    knowledgebase_id: knowledgebase_id || Math.random().toString(36).substring(2, 15),
                    name: name.trim(),
                    description: description || ''
                }
            });
        }
    } catch (error) {
        console.error('创建知识库接口错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.post('/user/knowledgebase/delete', upload.none(), async (req, res) => {
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
    } catch (error) {
        console.error('删除知识库失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

// File upload route - using raw multipart parsing to avoid middleware conflicts
// {
//     "status": "success",
//     "message": "File uploaded successfully",
//     "data": {
//         "file_id": "adc60863-0848-4969-843c-d361ee178ab8",
//         "filename": "【排版结果】.docx",
//         "object_path": "xxxx/default_file_space/adc60863-0848-4969-843c-d361ee178ab8/【排版结果】.docx",
//         "public_url": "http://120.46.208.202:9000/publicfiles/xxxx/default_file_space/adc60863-0848-4969-843c-d361ee178ab8/【排版结果】.docx",
//         "file_size": 18246
//     }
// }
app.post('/user/file/upload_file', upload.single('upload'), async (req, res) => {
    // 简单的模拟文件上传实现，避免中间件冲突
    console.log('收到文件上传请求');
    console.log('Headers:', req.headers);
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
        
            // 获取上传的文件
            const upload_file = req.file;
            const user_id = req.body.user_id;

            console.log('文件信息:', {
                file_exists: !!upload_file,
                filename: upload_file?.originalname,
                size: upload_file?.size,
                mimetype: upload_file?.mimetype,
                user_id: user_id
            });

            if (!upload_file) {
                return res.status(400).json({
                    success: false,
                    message: '未找到上传文件'
                });
            }

            const formData = new FormData();
            // 使用文件的 buffer 和相关信息 - 修正FormData.append语法
            formData.append('upload', upload_file.buffer, upload_file.originalname);
            formData.append('user_id', user_id);

            console.log('发送到后端的FormData信息:', {
                upload_url: `${FILE_MANAGE_BASE_URL}/upload_minio`,
                user_id: user_id,
                filename: upload_file.originalname,
                buffer_size: upload_file.buffer.length
            });

            const response = await axios.post(`${FILE_MANAGE_BASE_URL}/upload_minio`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 10000
            });
            res.json(response.data.data);
        } catch (error) {
            console.error('文件上传错误:', error);
            res.status(500).json({
                success: false,
                message: '文件上传失败'
            });
        }
    });

app.post('/user/knowledgebase/update_document', upload.none(), async (req, res) => {
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
        const knowledgebase_id = req.body.knowledgebase_id;
        const user_id = req.body.user_id;
        const mode = 'simple';
        const file_url = req.body.file_url;
        const formData = new FormData();
        formData.append('mode', mode);
        formData.append('knowledgebase_id', knowledgebase_id);
        formData.append('user_id', user_id);
        formData.append('file_url', file_url);
        const response = await axios.post(`${BACKEND_BASE_URL}/user/knowledgebase`, formData, {
            headers: formData.getHeaders(),
            timeout: 10000
        });
        console.log('后端更新知识库响应:', response.data);
        // 如果返回status为ok，则说明更新成功，否则更新失败
        if (response.data.status === 'ok') {
            res.json({
                success: true,
                message: '更新成功'
            });
        } else {
            res.json({
                success: false,
                message: '更新失败'
            });
        }
    } catch (error) {
        console.error('更新知识库失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.post('/user/knowledgebase/update', upload.none(), async (req, res) => {
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
    } catch (error) {
        console.error('更新知识库失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.post('/user/settings/get_user_prompt', upload.none(), async (req, res) => {
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

app.post('/user/settings/get_model_memory', upload.none(), async (req, res) => {
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

app.post('/user/settings/update_user_prompt', upload.none(), async (req, res) => {
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

app.post('/user/settings/update_model_memory', upload.none(), async (req, res) => {
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

app.post('/user/setting/update_generate_user_infomation', upload.none(), async (req, res) => {
    try {
        // 用于更新用户username, email, password
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
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.post('/user/model/get_list', upload.none(), async (req, res) => {
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

app.post('/user/prompt/get_prompt', upload.none(), async (req, res) => {
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
        const prompt_id = req.body.target;
        const parameters = req.body.parameters;
        // 真实后端里这里发送的post请求用的是json请求，别的基本都是formData
        const response = await axios.post(`${BACKEND_BASE_URL}/user/prompt`, {
            prompt_id: prompt_id,
            parameters: parameters
        });
        console.log('后端获取提示响应:', response.data);
        res.json(response.data.data);
    } catch (error) {
        console.error('获取提示失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.post('/user/prompt/get_prompt_list', upload.none(), async (req, res) => {
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
        const response = await axios.get(`${BACKEND_BASE_URL}/v1/prompts`);
        console.log('后端获取提示列表响应:', response.data);
        res.json(response.data.data);
    } catch (error) {
        console.error('获取提示列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.post('/user/chat', upload.none(), async (req, res) => {
    const token = req.body.token;
    const valid = await check_token_valid(token);
    if (!valid) {
        console.log('token无效，请重新登录');
        return res.status(401).json({
            success: false,
            message: 'token无效，请重新登录'
        });
    }

    // 获取用户id和相关的消息，以及“额外消息”
    const user_id = req.body.user_id + '@' + req.body.session_id;
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

    console.log('FormData内容:');
    console.log('- user_id:', req.body.user_id);
    console.log('- session_id:', req.body.session_id);
    console.log('- model:', model_id);
    console.log('- messages (JSON):', JSON.stringify(messages_list));
    console.log('- 拼接后的user_id:', user_id);

    console.log('Sending to backend:', {
        user_id: user_id,
        model: model_id,
        messages: messages_list
    });

    console.log('Backend URL:', `${MODEL_CHAT_BASE_URL}/user/chat`);
    console.log('FormData headers:', formData.getHeaders ? formData.getHeaders() : 'No headers method');

    try {
        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // 尝试连接后端服务获取流式响应
        try {
            console.log('正在发送请求到模型聊天服务...');
            const response = await axios.post(`${MODEL_CHAT_BASE_URL}/v1/chat/completions`, formData, {
                headers: formData.getHeaders(),
                timeout: 30000,
                responseType: 'stream'
            });
            console.log('模型聊天服务响应状态:', response.status);
            console.log('模型聊天服务响应头:', response.headers);

            // 如果后端返回流式响应，转发给客户端
            response.data.on('data', (chunk) => {
                const chunkStr = chunk.toString();

                // 详细日志：记录每个接收到的数据块
                console.log('=== 后端流式数据块 ===');
                console.log('原始块长度:', chunk.length);
                console.log('字符串块长度:', chunkStr.length);
                console.log('块内容 (原始):', JSON.stringify(chunkStr));
                console.log('块内容 (可读):', chunkStr);

                // 检查是否包含SSE格式
                if (chunkStr.includes('data:')) {
                    console.log('✓ 检测到SSE格式数据');
                    // 分析SSE格式的每一行
                    const lines = chunkStr.split('\n');
                    lines.forEach((line, index) => {
                        if (line.trim()) {
                            console.log(`  行 ${index}: "${line}"`);
                        } else {
                            console.log(`  行 ${index}: (空行)`);
                        }
                    });
                } else {
                    console.log('⚠ 非SSE格式数据');
                }
                console.log('=== 数据块结束 ===\n');

                // 转发SSE格式的数据，保持原始格式
                res.write(chunkStr);
            });

            response.data.on('end', () => {
                console.log('Backend stream ended');
                res.write('data: [DONE]\n\n');
                res.end();
            });

            response.data.on('error', (error) => {
                console.error('Backend stream error:', error);
                res.write(`data: {"error": "Stream error"}\n\n`);
                res.end();
            });

        } catch (backendError) {
            console.error('=== 模型聊天服务请求失败详情 ===');
            console.error('错误消息:', backendError.message);
            console.error('错误代码:', backendError.code);
            console.error('请求URL:', `${MODEL_CHAT_BASE_URL}/user/chat`);

            if (backendError.response) {
                console.error('响应状态:', backendError.response.status);
                console.error('响应状态文本:', backendError.response.statusText);
                console.error('响应头:', backendError.response.headers);
                console.error('响应数据:', backendError.response.data);
            } else if (backendError.request) {
                console.error('请求已发送但未收到响应');
                console.error('请求详情:', backendError.request);
            } else {
                console.error('请求配置错误:', backendError.config);
            }
            console.error('=== 错误详情结束 ===');

            console.warn('后端服务不可用，使用模拟流式响应');

            // 模拟流式响应 - 包含换行符测试
            const mockResponse = "你好！我是AI助手，很高兴为您服务。\n\n这是一个模拟的流式响应，用于演示实时聊天功能。\n\n包含多行文本：\n- 第一行\n- 第二行\n- 第三行\n\n测试完成！";
            const chunks = mockResponse.split('');

            console.log('=== 开始模拟流式响应 ===');
            console.log('总字符数:', chunks.length);
            console.log('原始响应:', JSON.stringify(mockResponse));

            let index = 0;
            const sendChunk = () => {
                if (index < chunks.length) {
                    const chunk = chunks[index];
                    const sseData = `data: {"content": "${chunk}"}\n\n`;

                    // 详细日志：记录每个发送的数据块
                    console.log(`=== 模拟数据块 ${index + 1}/${chunks.length} ===`);
                    console.log('字符:', JSON.stringify(chunk));
                    console.log('SSE格式:', JSON.stringify(sseData));
                    console.log('发送内容:', sseData);
                    console.log('=== 模拟块结束 ===\n');

                    res.write(sseData);
                    index++;
                    setTimeout(sendChunk, 50); // 50ms delay between chunks
                } else {
                    const doneData = 'data: [DONE]\n\n';
                    console.log('=== 发送结束标记 ===');
                    console.log('结束标记:', JSON.stringify(doneData));
                    console.log('=== 模拟流式响应完成 ===\n');
                    res.write(doneData);
                    res.end();
                }
            };

            // 开始发送模拟响应
            setTimeout(sendChunk, 100);
        }

    } catch (error) {
        console.error('聊天处理失败:', error);
        res.write(`data: {"error": "服务器内部错误"}\n\n`);
        res.end();
    }
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

// 启动主服务器
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
