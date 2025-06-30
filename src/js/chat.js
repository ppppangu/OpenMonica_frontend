const axios = require('axios');
const FormData = require('form-data');
const { check_token_valid } = require('./token');

/**
 * Chat management module
 * Handles chat history retrieval, message sending, and streaming response handling
 */

/**
 * 统一的聊天历史处理器 - 支持获取列表、获取具体内容、删除会话
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createChatHistoryHandler(config, upload) {
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

            console.log('聊天历史请求:', req.body);

            const mode = req.body.mode || 'get_all_list';
            const user_id = req.body.user_id;
            const session_id = req.body.session_id;

            // 验证必要字段
            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID是必填项'
                });
            }

            if ((mode === 'get_specific' || mode === 'delete_specific') && !session_id) {
                return res.status(400).json({
                    success: false,
                    message: '会话ID是必填项'
                });
            }

            // 尝试连接后端服务
            try {
                const formData = new FormData();
                formData.append('mode', mode);
                formData.append('user_id', user_id);
                if (session_id) {
                    formData.append('session_id', session_id);
                }

                console.log('发送到后端的聊天历史请求:', { mode, user_id, session_id });

                const response = await axios.post(`${config.user_manage_url}/user/chat_history`, formData, {
                    headers: formData.getHeaders(),
                    timeout: 10000
                });

                console.log('后端聊天历史响应:', response.data);
                res.json(response.data);
            } catch (backendError) {
                console.warn('后端服务不可用，使用模拟响应:', backendError.message);

                // 根据模式返回不同的模拟数据
                if (mode === 'get_all_list') {
                    const mockSessions = [
                        {
                            session_id: 'session_' + Date.now() + '_1',
                            timestamp: new Date(Date.now() - 86400000).toISOString()
                        },
                        {
                            session_id: 'session_' + Date.now() + '_2',
                            timestamp: new Date(Date.now() - 172800000).toISOString()
                        }
                    ];

                    res.json({
                        status: 'success',
                        message: `get all chat history list for user ${user_id} success`,
                        data: mockSessions
                    });
                } else if (mode === 'get_specific') {
                    res.json({
                        status: 'success',
                        message: `get specific chat history ${session_id} for user ${user_id} success`,
                        data: {
                            session_id: session_id,
                            chat_history: [
                                {
                                    messages: [
                                        {
                                            role: 'user',
                                            content: [{ type: 'text', text: '你好' }]
                                        }
                                    ],
                                    timestamp: new Date().toISOString()
                                },
                                {
                                    messages: [
                                        {
                                            role: 'assistant',
                                            content: [{ type: 'text', text: '你好！我是AI助手，很高兴为您服务。' }]
                                        }
                                    ],
                                    timestamp: new Date().toISOString()
                                }
                            ]
                        }
                    });
                } else if (mode === 'delete_specific') {
                    res.json({
                        status: 'success',
                        message: `delete specific chat history ${session_id} for user ${user_id} success`
                    });
                }
            }
        } catch (error) {
            console.error('聊天历史处理失败:', error.message);
            res.status(500).json({
                success: false,
                message: '服务器内部错误，请稍后重试'
            });
        }
    };
}

/**
 * 删除对话session端点处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createDeleteChatHistoryHandler(config, upload) {
    return async (req, res) => {
        try {
            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
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

                const response = await axios.post(`${config.user_manage_url}/user/chat_history`, formData, {
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
    };
}

/**
 * 获取具体对话内容处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createGetChatContentHandler(config, upload) {
    return async (req, res) => {
        try {
            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
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

                const response = await axios.post(`${config.user_manage_url}/user/chat_history`, formData, {
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
    };
}

/**
 * 聊天流式响应处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createChatStreamHandler(config, upload) {
    return async (req, res) => {
        const token = req.body.token;
        const valid = await check_token_valid(token, config.user_manage_url);
        if (!valid) {
            console.log('token无效，请重新登录');
            return res.status(401).json({
                success: false,
                message: 'token无效，请重新登录'
            });
        }

        // 获取用户id和相关的消息，以及"额外消息"
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

        // 根据API文档，构建正确的消息格式
        // 对于纯语言模型，使用简单的消息格式
        // 对于多模态模型，使用复杂的content数组格式
        let messages_list;

        if (user_message_list.length > 0) {
            messages_list = user_message_list;
        } else {
            // 如果没有提供消息列表，从text字段构建
            const text = req.body.text || '';
            messages_list = [{
                "role": "user",
                "content": text
            }];
        }

        // 根据API文档构建FormData
        const formData = new FormData();
        formData.append('user_id', user_id);
        formData.append('model', model_id);
        formData.append('messages', JSON.stringify(messages_list));

        console.log('FormData内容:');
        console.log('- user_id:', user_id);
        console.log('- model:', model_id);
        console.log('- messages (JSON):', JSON.stringify(messages_list));

        console.log('Sending to backend:', {
            user_id: user_id,
            model: model_id,
            messages: messages_list
        });

        console.log('Backend URL:', `${config.model_chat_url}/v1/chat/completions`);
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
                const response = await axios.post(`${config.model_chat_url}/v1/chat/completions`, formData, {
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

                    // 在转发给前端之前，移除模型心跳符号 ☯ 以及其紧随的换行符
                    const cleanedChunkStr = chunkStr.replace(/☯(\r?\n)?/g, '');

                    // 转发清洗后的数据
                    res.write(cleanedChunkStr);
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
                console.error('请求URL:', `${config.model_chat_url}/v1/chat/completions`);

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
    };
}

/**
 * Setup chat routes
 * @param {Object} app - Express app instance
 * @param {Object} config - Configuration object
 * @param {Object} upload - multer upload middleware
 */
function setupChatRoutes(app, config, upload) {
    // 统一的聊天历史端点 - 支持获取列表、获取具体内容、删除会话
    app.post('/user/chat_history', upload.none(), createChatHistoryHandler(config, upload));

    // 聊天流式响应端点
    app.post('/user/chat', upload.none(), createChatStreamHandler(config, upload));
}

module.exports = {
    createChatHistoryHandler,
    createChatStreamHandler,
    setupChatRoutes
};
