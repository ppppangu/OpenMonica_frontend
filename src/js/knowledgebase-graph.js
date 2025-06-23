const axios = require('axios');
const FormData = require('form-data');
const { check_token_valid } = require('./token');

/**
 * Knowledge base graph management module
 * Handles knowledge graph generation and retrieval
 */

/**
 * 知识图谱生成处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createGenerateKnowledgeGraphHandler(config, upload) {
    return async (req, res) => {
        try {
            console.log('收到知识图谱生成请求:', req.body);

            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
            if (!valid) {
                console.log('token无效，请重新登录');
                return res.status(401).json({
                    success: false,
                    message: 'token无效，请重新登录'
                });
            }

            const { user_id, knowledge_base_id, level = 'document' } = req.body;

            if (!user_id || !knowledge_base_id) {
                return res.status(400).json({
                    status: "error",
                    message: '缺少必要参数: user_id, knowledge_base_id'
                });
            }

            // 创建FormData发送到后端
            const formData = new FormData();
            formData.append('mode', 'produce');
            formData.append('user_id', user_id);
            formData.append('knowledge_base_id', knowledge_base_id);
            formData.append('level', level);

            console.log('发送知识图谱生成请求到后端:', {
                url: `${config.file_manage_url}/graph/knowledge_base`,
                mode: 'produce',
                user_id,
                knowledge_base_id,
                level
            });

            const response = await axios.post(`${config.file_manage_url}/graph/knowledge_base`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Accept-Charset': 'utf-8'
                },
                timeout: 60000, // 图谱生成可能需要更长时间
                responseEncoding: 'utf8'
            });

            console.log('后端知识图谱生成响应:', response.status, response.data);
            res.json(response.data);

        } catch (error) {
            console.error('知识图谱生成请求失败:', error.message);

            if (error.response) {
                console.error('后端错误响应:', error.response.status, error.response.data);
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({
                    status: "error",
                    message: '知识图谱生成服务暂时不可用，请稍后重试'
                });
            }
        }
    };
}

/**
 * 知识图谱获取处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createGetKnowledgeGraphHandler(config, upload) {
    return async (req, res) => {
        try {
            console.log('收到知识图谱获取请求:', req.body);

            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
            if (!valid) {
                console.log('token无效，请重新登录');
                return res.status(401).json({
                    success: false,
                    message: 'token无效，请重新登录'
                });
            }

            const { user_id, knowledge_base_id, level = 'document' } = req.body;

            if (!user_id || !knowledge_base_id) {
                return res.status(400).json({
                    status: "error",
                    message: '缺少必要参数: user_id, knowledge_base_id'
                });
            }

            // 创建FormData发送到后端
            const formData = new FormData();
            formData.append('mode', 'get');
            formData.append('user_id', user_id);
            formData.append('knowledge_base_id', knowledge_base_id);
            formData.append('level', level);

            console.log('发送知识图谱获取请求到后端:', {
                url: `${config.file_manage_url}/graph/knowledge_base`,
                mode: 'get',
                user_id,
                knowledge_base_id,
                level
            });

            const response = await axios.post(`${config.file_manage_url}/graph/knowledge_base`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Accept-Charset': 'utf-8'
                },
                timeout: 30000,
                responseEncoding: 'utf8'
            });

            console.log('后端知识图谱获取响应:', response.status, response.data);
            res.json(response.data);

        } catch (error) {
            console.error('知识图谱获取请求失败:', error.message);

            if (error.response) {
                console.error('后端错误响应:', error.response.status, error.response.data);
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({
                    status: "error",
                    message: '知识图谱获取服务暂时不可用，请稍后重试'
                });
            }
        }
    };
}

/**
 * Setup knowledge graph routes
 * @param {Object} app - Express app instance
 * @param {Object} config - Configuration object
 * @param {Object} upload - multer upload middleware
 */
function setupKnowledgeGraphRoutes(app, config, upload) {
    // 知识图谱生成端点
    app.post('/user/knowledgebase/generate_graph', upload.none(), createGenerateKnowledgeGraphHandler(config, upload));
    
    // 知识图谱获取端点
    app.post('/user/knowledgebase/get_graph', upload.none(), createGetKnowledgeGraphHandler(config, upload));
}

module.exports = {
    createGenerateKnowledgeGraphHandler,
    createGetKnowledgeGraphHandler,
    setupKnowledgeGraphRoutes
};
