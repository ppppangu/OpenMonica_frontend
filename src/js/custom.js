const axios = require('axios');
const FormData = require('form-data');
const { check_token_valid } = require('./token');

/**
 * Custom settings management module
 * Handles user custom prompts and model memory endpoints
 */

/**
 * 获取用户自定义提示处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createGetUserPromptHandler(config, upload) {
    return async (req, res) => {
        try {
            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
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

            const response = await axios.post(`${config.user_manage_url}/user/custom`, formData, {
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
    };
}

/**
 * 获取模型记忆处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createGetModelMemoryHandler(config, upload) {
    return async (req, res) => {
        try {
            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
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

            const response = await axios.post(`${config.user_manage_url}/user/custom`, formData, {
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
    };
}

/**
 * 更新用户自定义提示处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createUpdateUserPromptHandler(config, upload) {
    return async (req, res) => {
        try {
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
            const target = 'custom_personality'
            const user_id = req.body.user_id;
            const new_text = req.body.new_text;
            const formData = new FormData();
            formData.append('mode', mode);
            formData.append('target', target);
            formData.append('user_id', user_id);
            formData.append('new_text', new_text);

            const response = await axios.post(`${config.user_manage_url}/user/custom`, formData, {
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
    };
}

/**
 * 更新模型记忆处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createUpdateModelMemoryHandler(config, upload) {
    return async (req, res) => {
        try {
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
            const target = 'custom_memory'
            const user_id = req.body.user_id;
            const new_text = req.body.new_text;
            const formData = new FormData();
            formData.append('mode', mode);
            formData.append('target', target);
            formData.append('user_id', user_id);
            formData.append('new_text', new_text);

            const response = await axios.post(`${config.user_manage_url}/user/custom`, formData, {
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
    };
}

/**
 * 获取提示处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createGetPromptHandler(config, upload) {
    return async (req, res) => {
        try {
            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
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
            const response = await axios.post(`${config.user_manage_url}/user/prompt`, {
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
    };
}

/**
 * 获取提示列表处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createGetPromptListHandler(config, upload) {
    return async (req, res) => {
        try {
            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
            if (!valid) {
                console.log('token无效，请重新登录');
                return res.status(401).json({
                    success: false,
                    message: 'token无效，请重新登录'
                });
            }
            const response = await axios.get(`${config.user_manage_url}/v1/prompts`);
            console.log('后端获取提示列表响应:', response.data);
            res.json(response.data.data);
        } catch (error) {
            console.error('获取提示列表失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器内部错误，请稍后重试'
            });
        }
    };
}

/**
 * Setup custom settings routes
 * @param {Object} app - Express app instance
 * @param {Object} config - Configuration object
 * @param {Object} upload - multer upload middleware
 */
function setupCustomRoutes(app, config, upload) {
    // 用户自定义提示相关端点
    app.post('/user/settings/get_user_prompt', upload.none(), createGetUserPromptHandler(config, upload));
    app.post('/user/settings/update_user_prompt', upload.none(), createUpdateUserPromptHandler(config, upload));
    
    // 模型记忆相关端点
    app.post('/user/settings/get_model_memory', upload.none(), createGetModelMemoryHandler(config, upload));
    app.post('/user/settings/update_model_memory', upload.none(), createUpdateModelMemoryHandler(config, upload));
    
    // 提示相关端点
    app.post('/user/prompt/get_prompt', upload.none(), createGetPromptHandler(config, upload));
    app.post('/user/prompt/get_prompt_list', upload.none(), createGetPromptListHandler(config, upload));
}

module.exports = {
    createGetUserPromptHandler,
    createGetModelMemoryHandler,
    createUpdateUserPromptHandler,
    createUpdateModelMemoryHandler,
    createGetPromptHandler,
    createGetPromptListHandler,
    setupCustomRoutes
};
