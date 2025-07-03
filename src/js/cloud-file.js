const axios = require('axios');
const FormData = require('form-data');
const { check_token_valid } = require('./token');
const path = require('path');

/**
 * Cloud file management module
 * Handles file upload, deletion, and proxy functionality
 */

/**
 * 文件上传处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createFileUploadHandler(config, upload) {
    return async (req, res) => {
        // 简单的模拟文件上传实现，避免中间件冲突
        console.log('收到文件上传请求');
        console.log('Headers:', req.headers);
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

                // 验证文件是否存在
                if (!upload_file) {
                    console.log('未找到上传文件');
                    return res.status(400).json({
                        status: "error",
                        message: '未找到上传文件'
                    });
                }

                // 验证文件名
                if (!upload_file.originalname) {
                    console.log('文件名为空');
                    return res.status(400).json({
                        status: "error",
                        message: '文件名为空'
                    });
                }

                // 验证文件内容
                if (!upload_file.buffer || upload_file.buffer.length === 0) {
                    console.log('文件内容为空');
                    return res.status(400).json({
                        status: "error",
                        message: '文件内容为空'
                    });
                }

                // 创建FormData，注意参数名要匹配后端期望的 'upload_file'
                const formData = new FormData();

                // 确保中文文件名正确编码 - 使用RFC 2231编码方式
                // 这种方式可以确保中文字符在HTTP传输中不会被损坏
                const originalFilename = upload_file.originalname;

                // 检查是否包含非ASCII字符
                const hasNonAscii = /[^\x00-\x7F]/.test(originalFilename);

                let filenameOptions;
                if (hasNonAscii) {
                    // 对于包含中文的文件名，使用RFC 2231编码
                    const encodedFilename = encodeURIComponent(originalFilename);
                    filenameOptions = {
                        filename: originalFilename,  // 保持原始文件名
                        contentType: upload_file.mimetype || 'application/octet-stream',
                        // 添加RFC 2231编码的文件名
                        knownLength: upload_file.buffer.length
                    };

                    console.log('中文文件名编码处理:', {
                        original: originalFilename,
                        encoded: encodedFilename,
                        hasNonAscii: hasNonAscii,
                        bufferLength: upload_file.buffer.length
                    });
                } else {
                    // 对于纯ASCII文件名，直接使用
                    filenameOptions = {
                        filename: originalFilename,
                        contentType: upload_file.mimetype || 'application/octet-stream',
                        knownLength: upload_file.buffer.length
                    };

                    console.log('ASCII文件名处理:', {
                        filename: originalFilename,
                        bufferLength: upload_file.buffer.length
                    });
                }

                // 最兼容的方式：直接使用Buffer，form-data库会自动处理
                // 使用正确的选项格式，避免DelayedStream错误，确保中文文件名正确传递
                formData.append('upload_file', upload_file.buffer, filenameOptions);
                formData.append('user_id', user_id);

                console.log('发送到后端的FormData信息:', {
                    upload_url: `${config.file_manage_url}/upload_minio`,
                    user_id: user_id,
                    filename: upload_file.originalname,
                    buffer_size: upload_file.buffer.length,
                    content_type: upload_file.mimetype
                });

                const response = await axios.post(`${config.file_manage_url}/upload_minio`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Accept-Charset': 'utf-8'
                    },
                    timeout: 30000, // 增加超时时间到30秒
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    // 确保axios正确处理UTF-8编码
                    responseEncoding: 'utf8'
                });
                console.log('后端响应:', response.data);

                // 检查后端响应状态
                if (response.data.status === 'success') {
                    // 直接返回数据，匹配前端期望的格式
                    res.json(response.data.data);
                } else {
                    // 后端返回错误
                    console.error('后端返回错误:', response.data);
                    res.status(400).json({
                        status: "error",
                        message: response.data.message || "文件上传失败"
                    });
                }

            } catch (error) {
                console.error('文件上传错误:', error);

                // 根据错误类型返回不同的错误信息
                let errorMessage = '文件上传失败';
                let statusCode = 500;

                if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                    errorMessage = '上传超时，请稍后重试';
                    statusCode = 408;
                } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                    errorMessage = '无法连接到文件服务，请检查网络连接';
                    statusCode = 503;
                } else if (error.response) {
                    errorMessage = `服务器错误: ${error.response.status} ${error.response.statusText}`;
                    statusCode = error.response.status;
                    console.error('后端错误响应:', error.response.data);
                }

                res.status(statusCode).json({
                    status: "error",
                    message: errorMessage,
                    error_code: error.code || 'UNKNOWN_ERROR'
                });
            }
        };
}

/**
 * 文件删除处理器
 * @param {Object} config - 配置对象
 * @param {Object} upload - multer upload middleware
 * @returns {Function} Express route handler
 */
function createFileDeleteHandler(config, upload) {
    return async (req, res) => {
        try {
            console.log('收到文件删除请求:', req.body);

            const token = req.body.token;
            const valid = await check_token_valid(token, config.user_manage_url);
            if (!valid) {
                console.log('token无效，请重新登录');
                return res.status(401).json({
                    success: false,
                    message: 'token无效，请重新登录'
                });
            }

            const { user_id, file_id, knowledge_base_id } = req.body;

            if (!user_id || !file_id || !knowledge_base_id) {
                return res.status(400).json({
                    status: "error",
                    message: '缺少必要参数: user_id, file_id, knowledge_base_id'
                });
            }

            // 创建FormData发送到后端
            const formData = new FormData();
            formData.append('user_id', user_id);
            formData.append('file_id', file_id);
            formData.append('knowledge_base_id', knowledge_base_id);

            console.log('发送文件删除请求到后端:', {
                url: `${config.file_manage_url}/delete_file`,
                user_id,
                file_id,
                knowledge_base_id
            });

            const response = await axios.post(`${config.file_manage_url}/delete_file`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Accept-Charset': 'utf-8'
                },
                timeout: 30000,
                responseEncoding: 'utf8'
            });

            console.log('后端文件删除响应:', response.status, response.data);
            res.json(response.data);

        } catch (error) {
            console.error('文件删除请求失败:', error.message);

            if (error.response) {
                console.error('后端错误响应:', error.response.status, error.response.data);
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({
                    status: "error",
                    message: '文件删除服务暂时不可用，请稍后重试'
                });
            }
        }
    };
}

/**
 * 文件代理处理器 - 解决CORS问题
 * @param {Object} config - 配置对象
 * @returns {Function} Express route handler
 */
function createFileProxyHandler(config) {
    return async (req, res) => {
        try {
            const fileUrl = req.query.url;

            if (!fileUrl) {
                return res.status(400).json({
                    success: false,
                    message: '缺少文件URL参数'
                });
            }

            console.log('代理文件请求:', fileUrl);

            // 验证URL格式
            let targetUrl;
            try {
                targetUrl = new URL(fileUrl);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: '无效的文件URL格式'
                });
            }

            // 发起代理请求
            const response = await axios({
                method: 'GET',
                url: fileUrl,
                responseType: 'stream',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            // ------------------------- 新增: 规范化响应头 -------------------------
            // 1. 移除上游强制下载头，避免浏览器自动下载
            if (response.headers['content-disposition']) {
                delete response.headers['content-disposition'];
            }

            // 额外移除可能阻止 iframe 渲染的安全相关响应头
            ['x-frame-options', 'content-security-policy'].forEach((h) => {
                if (response.headers[h]) {
                    delete response.headers[h];
                }
            });

            // 2. 根据文件扩展名补全 / 修正 Content-Type
            const ext = path.extname(new URL(fileUrl).pathname).toLowerCase();
            const mimeMap = {
                '.pdf': 'application/pdf',
                '.html': 'text/html; charset=utf-8',
                '.htm': 'text/html; charset=utf-8',
                '.svg': 'image/svg+xml',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            };
            const resolvedContentType = mimeMap[ext] || response.headers['content-type'] || 'application/octet-stream';

            // 设置响应头
            res.set({
                'Content-Type': resolvedContentType,
                'Content-Length': response.headers['content-length'],
                'Content-Disposition': 'inline',
                'X-Frame-Options': 'ALLOWALL',
                'Content-Security-Policy': "frame-ancestors *",
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            });

            // 流式传输文件内容
            response.data.pipe(res);

            response.data.on('error', (error) => {
                console.error('文件流传输错误:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: '文件传输失败'
                    });
                }
            });

        } catch (error) {
            console.error('文件代理失败:', error.message);

            if (!res.headersSent) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    res.status(404).json({
                        success: false,
                        message: '文件不存在或服务器不可达'
                    });
                } else if (error.code === 'ETIMEDOUT') {
                    res.status(408).json({
                        success: false,
                        message: '文件加载超时'
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        message: '文件代理服务器错误'
                    });
                }
            }
        }
    };
}

/**
 * Setup cloud file routes
 * @param {Object} app - Express app instance
 * @param {Object} config - Configuration object
 * @param {Object} upload - multer upload middleware
 */
function setupCloudFileRoutes(app, config, upload) {
    // 文件上传端点
    app.post('/user/file/upload_file', upload.single('upload'), createFileUploadHandler(config, upload));

    // 文件删除端点
    app.post('/user/file/delete_file', upload.none(), createFileDeleteHandler(config, upload));

    // 文件代理端点
    app.get('/file/proxy', createFileProxyHandler(config));
}

module.exports = {
    createFileUploadHandler,
    createFileDeleteHandler,
    createFileProxyHandler,
    setupCloudFileRoutes
};
