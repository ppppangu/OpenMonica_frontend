const axios = require('axios');
const { check_token_valid } = require('./token');

/**
 * Model management module
 * Handles model-related endpoints
 */

/**
 * 获取模型列表处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createGetModelListHandler(config, upload) {
    return async (req, res) => {
        try {
            console.log('收到获取模型列表请求:', req.body);
            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
            if (!valid) {
                console.log('token无效，请重新登录');
                return res.status(401).json({
                    success: false,
                    message: 'token无效，请重新登录'
                });
            }

            console.log('尝试从后端获取模型列表:', `${config.model_chat_url}/v1/models`);
            const response = await axios.get(`${config.model_chat_url}/v1/models`, {
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
    };
}

/**
 * Setup model routes
 * @param {Object} app - Express app instance
 * @param {Object} config - Configuration object
 * @param {Object} upload - multer upload middleware
 */
function setupModelRoutes(app, config, upload) {
    // 获取模型列表端点
    app.post('/user/model/get_list', upload.none(), createGetModelListHandler(config, upload));
}

module.exports = {
    createGetModelListHandler,
    setupModelRoutes
};
