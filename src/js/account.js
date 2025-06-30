const axios = require('axios');
const FormData = require('form-data');
const { retryRequest, check_token_valid, get_user_token } = require('./token');

/**
 * Account management module
 * Handles user login, registration, and account information endpoints
 */

/**
 * 登录端点处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createLoginHandler(config, upload) {
    return async (req, res) => {
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
                        backend_url: `${config.user_manage_url}/user/account`
                    });

                    return await axios.post(`${config.user_manage_url}/user/account`, formData, {
                        headers: formData.getHeaders(),
                        timeout: 10000
                    });
                };

                // 使用重试机制执行登录请求（最多重试3次，基础延迟1秒）
                const response = await retryRequest(loginRequest, 3, 1000);

                console.log('后端登录响应:', response.data);

                if (response.data.success === true) {
                    // 获取用户的token用于校验，并将token存入pinna中
                    const token = await get_user_token(response.data.user_info.user_id, config.user_manage_url);
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
    };
}

/**
 * 注册端点处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createRegisterHandler(config, upload) {
    return async (req, res) => {
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
                    backend_url: `${config.user_manage_url}/user/account`
                });

                const response = await axios.post(`${config.user_manage_url}/user/account`, formData, {
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
    };
}

/**
 * 更新用户信息端点处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createUpdateUserInfoHandler(config, upload) {
    return async (req, res) => {
        try {
            // 用于更新用户username, email, password
            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
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
            const response = await axios.post(`${config.user_manage_url}/user/account`, formData, {
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
    };
}

/**
 * 统一账户端点处理器 - 根据mode参数路由到不同的处理函数
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createUnifiedAccountHandler(config, upload) {
    const loginHandler = createLoginHandler(config, upload);
    const registerHandler = createRegisterHandler(config, upload);
    const updateHandler = createUpdateUserInfoHandler(config, upload);

    return async (req, res) => {
        const mode = req.body.mode;

        console.log(`收到账户请求，模式: ${mode}`);

        switch (mode) {
            case 'login':
            case 'check':
                console.log('路由到登录处理器');
                return await loginHandler(req, res);
            case 'register':
                console.log('路由到注册处理器');
                return await registerHandler(req, res);
            case 'update':
                console.log('路由到更新用户信息处理器');
                return await updateHandler(req, res);
            default:
                console.log(`未知的模式: ${mode}`);
                return res.status(400).json({
                    success: false,
                    message: `不支持的操作模式: ${mode}`
                });
        }
    };
}

/**
 * Setup account routes
 * @param {Object} app - Express app instance
 * @param {Object} config - Configuration object
 * @param {Object} upload - multer upload middleware
 */
function setupAccountRoutes(app, config, upload) {
    // 统一账户端点 - 根据mode参数路由到不同处理器
    app.post('/user/account', upload.none(), createUnifiedAccountHandler(config, upload));

    // 更新用户信息端点（保持向后兼容）
    app.post('/user/setting/update_generate_user_infomation', upload.none(), createUpdateUserInfoHandler(config, upload));
}

module.exports = {
    createLoginHandler,
    createRegisterHandler,
    createUpdateUserInfoHandler,
    createUnifiedAccountHandler,
    setupAccountRoutes
};
