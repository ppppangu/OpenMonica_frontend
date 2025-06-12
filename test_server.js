const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002;

// 解析JSON数据
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(__dirname));

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// 测试流式聊天端点
app.post('/user/chat', (req, res) => {
    console.log('=== 收到聊天请求 ===');
    console.log('请求体:', req.body);
    console.log('=== 开始流式响应 ===');

    // 设置SSE响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 模拟流式响应 - 特别测试换行符处理
    const mockResponse = "你好！我是AI助手，很高兴为您服务。\n\n这是一个模拟的流式响应，用于演示实时聊天功能。\n\n包含多行文本：\n- 第一行\n- 第二行\n- 第三行\n\n测试完成！\n\n这里有更多换行符测试：\n\n双换行符测试\n\n\n三换行符测试\n\n\n\n四换行符测试";

    // 按字符分割，但保持一些完整的词汇作为块来更好地测试
    const chunks = [];
    let currentChunk = '';
    for (let i = 0; i < mockResponse.length; i++) {
        currentChunk += mockResponse[i];
        // 每3-5个字符作为一个块，或者在换行符处分割
        if (currentChunk.length >= 3 && (Math.random() > 0.7 || mockResponse[i] === '\n')) {
            chunks.push(currentChunk);
            currentChunk = '';
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }

    console.log('=== 开始模拟流式响应 ===');
    console.log('总字符数:', chunks.length);
    console.log('原始响应:', JSON.stringify(mockResponse));

    let index = 0;
    const sendChunk = () => {
        if (index < chunks.length) {
            const chunk = chunks[index];
            const sseData = `data: ${chunk}\n\n`;
            
            // 详细日志：记录每个发送的数据块
            console.log(`=== 模拟数据块 ${index + 1}/${chunks.length} ===`);
            console.log('字符:', JSON.stringify(chunk));
            console.log('SSE格式:', JSON.stringify(sseData));
            console.log('发送内容:', sseData);
            console.log('=== 模拟块结束 ===\n');
            
            res.write(sseData);
            index++;
            setTimeout(sendChunk, 100); // 100ms delay between chunks
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
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
const server = app.listen(PORT, () => {
    console.log(`🚀 测试服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 静态文件目录: ${__dirname}`);
    console.log(`🔧 测试页面: http://localhost:${PORT}/test_streaming.html`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 测试服务器正在关闭...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

// 错误处理
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});
