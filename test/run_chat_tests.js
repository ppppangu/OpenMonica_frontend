/**
 * 聊天功能自动化测试脚本
 * 使用 Node.js 运行基本的 API 测试
 */

const axios = require('axios');
const FormData = require('form-data');

// 测试配置
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3001',
    testUser: {
        email: 'test@example.com',
        password: 'password123'
    },
    timeout: 30000
};

// 测试状态
let testResults = {
    login: false,
    models: false,
    history: false,
    streaming: false,
    errorHandling: false
};

let currentToken = '';
let currentUserId = '';

// 工具函数
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        info: '📝',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试函数
async function testLogin() {
    log('开始登录测试...');
    
    try {
        const formData = new FormData();
        formData.append('email', TEST_CONFIG.testUser.email);
        formData.append('password', TEST_CONFIG.testUser.password);
        formData.append('mode', 'check');

        const response = await axios.post(`${TEST_CONFIG.baseUrl}/user/account`, formData, {
            headers: formData.getHeaders(),
            timeout: TEST_CONFIG.timeout
        });

        if (response.data.status === 'success') {
            currentToken = response.data.data.token;
            currentUserId = response.data.data.user_id;
            testResults.login = true;
            log(`登录成功！User ID: ${currentUserId}`, 'success');
            return true;
        } else {
            throw new Error(response.data.message || '登录失败');
        }
    } catch (error) {
        log(`登录失败: ${error.message}`, 'error');
        return false;
    }
}

async function testModelList() {
    log('开始模型列表测试...');
    
    if (!currentToken) {
        log('需要先登录', 'error');
        return false;
    }

    try {
        const formData = new FormData();
        formData.append('token', currentToken);
        formData.append('user_id', currentUserId);

        const response = await axios.post(`${TEST_CONFIG.baseUrl}/user/model/get_list`, formData, {
            headers: formData.getHeaders(),
            timeout: TEST_CONFIG.timeout
        });

        if (response.data.success && response.data.data) {
            testResults.models = true;
            log(`获取到 ${response.data.data.length} 个模型`, 'success');
            
            // 显示前3个模型信息
            response.data.data.slice(0, 3).forEach((model, index) => {
                log(`  模型 ${index + 1}: ${model.alias || model.id} (${model.owned_by})`);
            });
            
            return true;
        } else {
            throw new Error(response.data.message || '获取模型列表失败');
        }
    } catch (error) {
        log(`模型列表测试失败: ${error.message}`, 'error');
        return false;
    }
}

async function testChatHistory() {
    log('开始聊天历史测试...');
    
    if (!currentToken) {
        log('需要先登录', 'error');
        return false;
    }

    try {
        const formData = new FormData();
        formData.append('token', currentToken);
        formData.append('user_id', currentUserId);
        formData.append('mode', 'get_all_list');

        const response = await axios.post(`${TEST_CONFIG.baseUrl}/user/chat_history`, formData, {
            headers: formData.getHeaders(),
            timeout: TEST_CONFIG.timeout
        });

        if (response.data.status === 'success') {
            testResults.history = true;
            const historyCount = response.data.data ? response.data.data.length : 0;
            log(`获取到 ${historyCount} 个聊天历史记录`, 'success');
            
            if (historyCount > 0) {
                log(`  最新会话: ${response.data.data[0].session_id}`);
            }
            
            return true;
        } else {
            throw new Error(response.data.message || '获取聊天历史失败');
        }
    } catch (error) {
        log(`聊天历史测试失败: ${error.message}`, 'error');
        return false;
    }
}

async function testChatStreaming() {
    log('开始流式聊天测试...');
    
    if (!currentToken) {
        log('需要先登录', 'error');
        return false;
    }

    try {
        const formData = new FormData();
        formData.append('token', currentToken);
        formData.append('user_id', currentUserId);
        formData.append('text', '你好，请简单介绍一下你自己');
        formData.append('model', 'Pro/deepseek-ai/DeepSeek-V3'); // 使用默认模型

        log('发送聊天请求...');
        
        const response = await axios.post(`${TEST_CONFIG.baseUrl}/user/chat`, formData, {
            headers: formData.getHeaders(),
            timeout: TEST_CONFIG.timeout,
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            let receivedData = false;
            let responseContent = '';
            
            response.data.on('data', (chunk) => {
                const chunkStr = chunk.toString();
                
                if (chunkStr.includes('data:')) {
                    receivedData = true;
                    
                    // 简单解析SSE数据
                    const lines = chunkStr.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                testResults.streaming = true;
                                log(`流式聊天测试成功，接收到内容长度: ${responseContent.length}`, 'success');
                                resolve(true);
                                return;
                            }
                            
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                    responseContent += parsed.choices[0].delta.content;
                                } else if (parsed.content) {
                                    responseContent += parsed.content;
                                }
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    }
                }
            });

            response.data.on('end', () => {
                if (receivedData) {
                    testResults.streaming = true;
                    log(`流式聊天测试完成，接收到内容长度: ${responseContent.length}`, 'success');
                    resolve(true);
                } else {
                    log('未接收到流式数据', 'error');
                    resolve(false);
                }
            });

            response.data.on('error', (error) => {
                log(`流式聊天错误: ${error.message}`, 'error');
                reject(error);
            });

            // 设置超时
            setTimeout(() => {
                if (!receivedData) {
                    log('流式聊天超时', 'error');
                    resolve(false);
                }
            }, 15000);
        });
    } catch (error) {
        log(`流式聊天测试失败: ${error.message}`, 'error');
        return false;
    }
}

async function testErrorHandling() {
    log('开始错误处理测试...');
    
    try {
        // 测试无效token
        const formData = new FormData();
        formData.append('token', 'invalid-token');
        formData.append('user_id', 'invalid-user');

        const response = await axios.post(`${TEST_CONFIG.baseUrl}/user/model/get_list`, formData, {
            headers: formData.getHeaders(),
            timeout: 5000
        });

        if (response.status === 401 || response.data.message?.includes('token')) {
            testResults.errorHandling = true;
            log('错误处理测试通过：无效token正确处理', 'success');
            return true;
        } else {
            log('错误处理测试失败：无效token未正确处理', 'warning');
            return false;
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            testResults.errorHandling = true;
            log('错误处理测试通过：无效token正确处理', 'success');
            return true;
        } else {
            log(`错误处理测试异常: ${error.message}`, 'error');
            return false;
        }
    }
}

// 主测试函数
async function runAllTests() {
    log('🚀 开始聊天功能完整测试套件');
    log('='.repeat(50));
    
    const tests = [
        { name: '用户登录', func: testLogin },
        { name: '模型列表', func: testModelList },
        { name: '聊天历史', func: testChatHistory },
        { name: '流式聊天', func: testChatStreaming },
        { name: '错误处理', func: testErrorHandling }
    ];

    let passedTests = 0;
    
    for (const test of tests) {
        log(`\n📋 测试项目: ${test.name}`);
        log('-'.repeat(30));
        
        try {
            const result = await test.func();
            if (result) {
                passedTests++;
                log(`✅ ${test.name} 测试通过\n`);
            } else {
                log(`❌ ${test.name} 测试失败\n`);
            }
        } catch (error) {
            log(`❌ ${test.name} 测试异常: ${error.message}\n`);
        }
        
        // 测试间隔
        await delay(1000);
    }
    
    // 测试总结
    log('='.repeat(50));
    log('📊 测试总结');
    log('='.repeat(50));
    
    Object.entries(testResults).forEach(([test, passed]) => {
        const status = passed ? '✅ 通过' : '❌ 失败';
        log(`${test.padEnd(15)}: ${status}`);
    });
    
    log(`\n🎯 总体结果: ${passedTests}/${tests.length} 项测试通过`);
    
    if (passedTests === tests.length) {
        log('🎉 所有测试通过！聊天功能正常工作', 'success');
        process.exit(0);
    } else {
        log('⚠️ 部分测试失败，请检查相关功能', 'warning');
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    runAllTests().catch(error => {
        log(`测试运行异常: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testLogin,
    testModelList,
    testChatHistory,
    testChatStreaming,
    testErrorHandling
};
