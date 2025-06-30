import React, { useState, useEffect } from 'react'
import { Button, Card, Typography, Space, message, Input, Form, Divider, Alert, Spin, Tag } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { useModelList, useChatHistory } from '../hooks/useApi'

const { Title, Text } = Typography

interface TestResult {
  timestamp: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

const LoginAndChatVerification: React.FC = () => {
  const { user, isAuthenticated, login, logout, isLoading, checkAuth } = useAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  // API hooks for testing post-login functionality
  const { data: modelList, isLoading: modelsLoading, error: modelsError } = useModelList(user?.id || '')
  const { data: chatHistory, isLoading: historyLoading, error: historyError } = useChatHistory(user?.id || '')

  const addTestResult = (type: TestResult['type'], message: string) => {
    const result: TestResult = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    }
    setTestResults(prev => [...prev, result])
  }

  const getResultIcon = (type: TestResult['type']) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '•'
    }
  }

  const testBasicFunctionality = () => {
    addTestResult('info', '开始基本功能测试...')
    addTestResult('success', 'React应用基本功能正常')
    addTestResult('info', `认证状态: ${isAuthenticated ? '已登录' : '未登录'}`)
    
    if (user) {
      addTestResult('success', `用户信息: ${user.username} (${user.email})`)
      addTestResult('info', `用户ID: ${user.id}`)
      addTestResult('info', `Token: ${user.token ? user.token.substring(0, 20) + '...' : '无'}`)
    } else {
      addTestResult('warning', '未找到用户信息')
    }
  }

  const testBackendConnectivity = async () => {
    addTestResult('info', '开始测试后端连接性...')
    
    try {
      // Test health endpoint
      const healthResponse = await fetch('/health')
      if (healthResponse.ok) {
        addTestResult('success', '健康检查端点连接正常')
      } else {
        addTestResult('error', `健康检查失败: ${healthResponse.status}`)
      }
    } catch (error) {
      addTestResult('error', `健康检查连接失败: ${error}`)
    }

    try {
      // Test user management endpoint
      const userResponse = await fetch('/user/account', {
        method: 'POST',
        body: new FormData()
      })
      addTestResult('info', `用户管理端点响应: ${userResponse.status}`)
    } catch (error) {
      addTestResult('error', `用户管理端点连接失败: ${error}`)
    }
  }

  const testLogin = async (values: { email: string; password: string }) => {
    try {
      addTestResult('info', '开始测试登录功能...')
      addTestResult('info', `尝试登录邮箱: ${values.email}`)
      
      const result = await login(values)
      
      if (result.success) {
        addTestResult('success', '登录测试成功')
        addTestResult('info', '正在验证登录后状态...')
        
        // Wait a moment for state to update
        setTimeout(() => {
          if (user) {
            addTestResult('success', '登录后用户状态正常')
            addTestResult('info', `登录用户: ${user.username}`)
          } else {
            addTestResult('warning', '登录成功但用户状态未更新')
          }
        }, 1000)
        
        message.success('登录成功！')
      } else {
        addTestResult('error', `登录测试失败: ${result.error}`)
        message.error(result.error || '登录失败')
      }
    } catch (error) {
      addTestResult('error', `登录测试异常: ${error}`)
      message.error('登录测试异常')
    }
  }

  const testTokenValidation = async () => {
    if (!user?.token) {
      addTestResult('warning', '无token可测试')
      return
    }

    addTestResult('info', '开始测试token验证...')
    
    try {
      const isValid = await checkAuth()
      if (isValid) {
        addTestResult('success', 'Token验证成功')
      } else {
        addTestResult('error', 'Token验证失败')
      }
    } catch (error) {
      addTestResult('error', `Token验证异常: ${error}`)
    }
  }

  const testPostLoginAPIs = async () => {
    if (!isAuthenticated || !user) {
      addTestResult('warning', '需要先登录才能测试API')
      return
    }

    addTestResult('info', '开始测试登录后API功能...')

    // Test model list API
    addTestResult('info', '测试模型列表API...')
    if (modelsError) {
      addTestResult('error', `模型列表API失败: ${modelsError}`)
    } else if (modelList) {
      addTestResult('success', `模型列表API成功，获取到 ${modelList.length} 个模型`)
    } else if (modelsLoading) {
      addTestResult('info', '模型列表API加载中...')
    }

    // Test chat history API
    addTestResult('info', '测试聊天历史API...')
    if (historyError) {
      addTestResult('error', `聊天历史API失败: ${historyError}`)
    } else if (chatHistory) {
      addTestResult('success', `聊天历史API成功，获取到 ${chatHistory.length} 条记录`)
    } else if (historyLoading) {
      addTestResult('info', '聊天历史API加载中...')
    }
  }

  const testLogout = () => {
    try {
      addTestResult('info', '开始测试登出功能...')
      logout()
      addTestResult('success', '登出测试成功')
      message.success('登出成功！')
    } catch (error) {
      addTestResult('error', `登出测试失败: ${error}`)
      message.error('登出测试失败')
    }
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    clearResults()
    
    addTestResult('info', '开始运行完整测试套件...')
    
    // Basic functionality
    testBasicFunctionality()
    
    // Backend connectivity
    await testBackendConnectivity()
    
    // Token validation (if logged in)
    if (isAuthenticated) {
      await testTokenValidation()
      await testPostLoginAPIs()
    }
    
    addTestResult('info', '测试套件运行完成')
    setIsRunningTests(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Auto-test post-login APIs when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      setTimeout(() => {
        testPostLoginAPIs()
      }, 2000) // Wait 2 seconds for APIs to be ready
    }
  }, [isAuthenticated, user])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title level={2}>登录页面和聊天页面功能验证</Title>
      
      <Alert
        message="测试说明"
        description="此测试页面用于验证登录功能和登录后的聊天页面API是否正常工作。请按照以下步骤进行测试：1) 运行完整测试套件 2) 使用真实账户登录 3) 验证登录后功能"
        type="info"
        showIcon
        className="mb-6"
      />
      
      <Space direction="vertical" size="large" className="w-full">
        {/* 快速测试 */}
        <Card title="快速测试">
          <Space>
            <Button 
              type="primary" 
              onClick={runAllTests}
              loading={isRunningTests}
            >
              运行完整测试套件
            </Button>
            <Button onClick={testBasicFunctionality}>
              测试基本功能
            </Button>
            <Button onClick={testBackendConnectivity}>
              测试后端连接
            </Button>
            <Button onClick={clearResults}>
              清空结果
            </Button>
          </Space>
        </Card>

        {/* 认证测试 */}
        <Card title="认证功能测试">
          {!isAuthenticated ? (
            <div>
              <Alert
                message="请使用真实的后端账户进行测试"
                description="根据Postman文档，请使用已注册的邮箱和密码进行登录测试"
                type="warning"
                showIcon
                className="mb-4"
              />
              <Form onFinish={testLogin} layout="vertical">
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
                >
                  <Input placeholder="请输入注册邮箱" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password placeholder="请输入密码" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={isLoading}>
                    测试登录
                  </Button>
                </Form.Item>
              </Form>
            </div>
          ) : (
            <div>
              <Alert
                message="登录成功"
                description={`当前用户: ${user?.username} (${user?.email})`}
                type="success"
                showIcon
                className="mb-4"
              />
              <Space>
                <Button onClick={testTokenValidation}>
                  验证Token
                </Button>
                <Button onClick={testPostLoginAPIs}>
                  测试API功能
                </Button>
                <Button onClick={testLogout} danger>
                  测试登出
                </Button>
              </Space>
            </div>
          )}
        </Card>

        {/* API状态显示 */}
        {isAuthenticated && (
          <Card title="API状态监控">
            <Space direction="vertical" className="w-full">
              <div className="flex items-center gap-2">
                <Text strong>模型列表API:</Text>
                {modelsLoading ? (
                  <Spin size="small" />
                ) : modelsError ? (
                  <Tag color="red">失败</Tag>
                ) : modelList ? (
                  <Tag color="green">成功 ({modelList.length} 个模型)</Tag>
                ) : (
                  <Tag color="default">未调用</Tag>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Text strong>聊天历史API:</Text>
                {historyLoading ? (
                  <Spin size="small" />
                ) : historyError ? (
                  <Tag color="red">失败</Tag>
                ) : chatHistory ? (
                  <Tag color="green">成功 ({chatHistory.length} 条记录)</Tag>
                ) : (
                  <Tag color="default">未调用</Tag>
                )}
              </div>

              {modelList && modelList.length > 0 && (
                <div>
                  <Text strong>可用模型:</Text>
                  <div className="mt-2">
                    {modelList.slice(0, 5).map((model: any, index: number) => (
                      <Tag key={index} className="mb-1">
                        {model.model_name || model.alias || model.id}
                      </Tag>
                    ))}
                    {modelList.length > 5 && (
                      <Tag>... 还有 {modelList.length - 5} 个</Tag>
                    )}
                  </div>
                </div>
              )}
            </Space>
          </Card>
        )}

        {/* 测试结果 */}
        <Card title="测试结果" extra={
          <Text type="secondary">
            共 {testResults.length} 条记录
          </Text>
        }>
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <Text type="secondary">暂无测试结果</Text>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-2 flex items-start gap-2">
                  <span className="text-xs text-gray-500 min-w-[60px]">
                    {result.timestamp}
                  </span>
                  <span className="text-lg leading-none">
                    {getResultIcon(result.type)}
                  </span>
                  <span className={`flex-1 text-sm ${
                    result.type === 'error' ? 'text-red-600' :
                    result.type === 'success' ? 'text-green-600' :
                    result.type === 'warning' ? 'text-orange-600' :
                    'text-gray-700'
                  }`}>
                    {result.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 后端配置信息 */}
        <Card title="后端配置信息">
          <Space direction="vertical" className="w-full">
            <div>
              <Text strong>用户管理服务:</Text>
              <Text code className="ml-2">http://120.46.208.202:8006</Text>
            </div>
            <div>
              <Text strong>模型聊天服务:</Text>
              <Text code className="ml-2">http://120.46.208.202:8030</Text>
            </div>
            <div>
              <Text strong>文件管理服务:</Text>
              <Text code className="ml-2">http://120.46.208.202:8087</Text>
            </div>
            <Divider />
            <Alert
              message="测试建议"
              description={
                <ul className="mt-2 space-y-1">
                  <li>• 首先运行完整测试套件检查基础连接</li>
                  <li>• 使用真实的注册邮箱和密码进行登录测试</li>
                  <li>• 登录成功后会自动测试相关API功能</li>
                  <li>• 观察API状态监控区域的实时状态</li>
                  <li>• 如果遇到问题，查看测试结果中的详细错误信息</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default LoginAndChatVerification
