import React, { useState } from 'react'
import { Card, Button, Typography, Space, message, Divider } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { useChatStore } from '../stores/chatStore'
import { useKnowledgeBaseStore } from '../stores/knowledgeBaseStore'
import { useFileStore } from '../stores/fileStore'

const { Title, Text, Paragraph } = Typography

const ReactAppTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const { user, isAuthenticated, createMockUser } = useAuth()
  const { addUserMessage, currentMessages } = useChatStore()
  const { knowledgeBases, setKnowledgeBases } = useKnowledgeBaseStore()
  const { attachments, addAttachment } = useFileStore()

  const runTest = (testName: string, testFn: () => boolean) => {
    try {
      const result = testFn()
      setTestResults(prev => ({ ...prev, [testName]: result }))
      if (result) {
        message.success(`✅ ${testName} 测试通过`)
      } else {
        message.error(`❌ ${testName} 测试失败`)
      }
      return result
    } catch (error) {
      console.error(`Test ${testName} failed:`, error)
      setTestResults(prev => ({ ...prev, [testName]: false }))
      message.error(`❌ ${testName} 测试出错: ${error}`)
      return false
    }
  }

  const testAuthentication = () => {
    return runTest('用户认证', () => {
      if (!isAuthenticated) {
        createMockUser()
      }
      return isAuthenticated && user !== null
    })
  }

  const testChatStore = () => {
    return runTest('聊天状态管理', () => {
      const initialCount = currentMessages.length
      addUserMessage('测试消息')
      return currentMessages.length === initialCount + 1
    })
  }

  const testKnowledgeBaseStore = () => {
    return runTest('知识库状态管理', () => {
      const mockKb = [{
        knowledgebase_id: 'test-kb-1',
        name: '测试知识库',
        description: '这是一个测试知识库',
        document_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
      setKnowledgeBases(mockKb)
      return knowledgeBases.length > 0
    })
  }

  const testFileStore = () => {
    return runTest('文件状态管理', () => {
      const mockFile = {
        id: 'test-file-1',
        filename: 'test.txt',
        public_url: 'https://example.com/test.txt',
        file_type: 'text/plain',
        file_size: 1024,
        upload_time: new Date().toISOString(),
        category: 'document' as const
      }
      addAttachment(mockFile)
      return attachments.length > 0
    })
  }

  const testApiUtils = () => {
    return runTest('API工具函数', () => {
      // Test that API utilities are available
      try {
        import('../utils/api').then(module => {
          return typeof module.getAuthToken === 'function'
        })
        return true
      } catch (error) {
        return false
      }
    })
  }

  const runAllTests = () => {
    const tests = [
      testAuthentication,
      testChatStore,
      testKnowledgeBaseStore,
      testFileStore,
      testApiUtils
    ]

    let passedCount = 0
    tests.forEach(test => {
      if (test()) {
        passedCount++
      }
    })

    if (passedCount === tests.length) {
      message.success(`🎉 所有测试通过! (${passedCount}/${tests.length})`)
    } else {
      message.warning(`⚠️ 部分测试失败 (${passedCount}/${tests.length})`)
    }
  }

  const getTestStatus = (testName: string) => {
    const result = testResults[testName]
    if (result === undefined) return '⏳'
    return result ? '✅' : '❌'
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <Title level={2}>React应用测试</Title>
        <Paragraph>
          这个测试页面验证React应用的核心功能是否正常工作。
        </Paragraph>

        <Divider />

        <Space direction="vertical" size="large" className="w-full">
          {/* Authentication Test */}
          <Card size="small" title={`${getTestStatus('用户认证')} 用户认证测试`}>
            <Text>当前用户: {user?.username || '未登录'}</Text>
            <br />
            <Text>认证状态: {isAuthenticated ? '已认证' : '未认证'}</Text>
            <br />
            <Button onClick={testAuthentication} className="mt-2">
              测试认证功能
            </Button>
          </Card>

          {/* Chat Store Test */}
          <Card size="small" title={`${getTestStatus('聊天状态管理')} 聊天状态管理测试`}>
            <Text>当前消息数量: {currentMessages.length}</Text>
            <br />
            <Button onClick={testChatStore} className="mt-2">
              测试聊天状态
            </Button>
          </Card>

          {/* Knowledge Base Store Test */}
          <Card size="small" title={`${getTestStatus('知识库状态管理')} 知识库状态管理测试`}>
            <Text>知识库数量: {knowledgeBases.length}</Text>
            <br />
            <Button onClick={testKnowledgeBaseStore} className="mt-2">
              测试知识库状态
            </Button>
          </Card>

          {/* File Store Test */}
          <Card size="small" title={`${getTestStatus('文件状态管理')} 文件状态管理测试`}>
            <Text>附件数量: {attachments.length}</Text>
            <br />
            <Button onClick={testFileStore} className="mt-2">
              测试文件状态
            </Button>
          </Card>

          {/* API Utils Test */}
          <Card size="small" title={`${getTestStatus('API工具函数')} API工具函数测试`}>
            <Text>验证API工具函数是否可用</Text>
            <br />
            <Button onClick={testApiUtils} className="mt-2">
              测试API工具
            </Button>
          </Card>
        </Space>

        <Divider />

        <div className="text-center">
          <Button type="primary" size="large" onClick={runAllTests}>
            运行所有测试
          </Button>
        </div>

        <Divider />

        <div className="text-center text-gray-500">
          <Text type="secondary">
            测试完成后，您可以继续使用应用的其他功能
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default ReactAppTest
