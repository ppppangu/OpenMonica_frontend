import React, { useState, useEffect, useRef } from 'react'
import { Button, Drawer, List, Typography, Popconfirm, App } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useChatStore } from '../stores/chatStore'
import { useAuth } from '../hooks/useAuth'
import { useModelList, useChatHistory, useChatHistoryContent, useChatHistoryDeleteMutation } from '../hooks/useApi'
import { parseOpenAISSEChunk, createChatSSEConnection } from '../utils/streamingUtils'
import ChatMessageList from '../components/chat/ChatMessageList'
import ChatInput from '../components/chat/ChatInput'
import { useFileStore } from '../stores/fileStore'

// const { Sider, Content } = Layout
const { Text } = Typography

const ChatPage: React.FC = () => {
  const { message } = App.useApp()
  const { user } = useAuth()
  const {
    currentMessages,
    streamingMessage,
    selectedModelIds,
    currentSessionId,
    isLoading,
    error,
    addUserMessage,
    startStreamingResponse,
    updateStreamingContent,
    finishStreamingResponse,
    setSelectedModels,
    createNewSession,
    loadSessionMessages,
    setLoading,
    setError,
    clearError
  } = useChatStore()

  const { attachments, clearAllFiles } = useFileStore()

  const [isStreaming, setIsStreaming] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastMessage, setLastMessage] = useState<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const sseRef = useRef<EventSource | null>(null)
  // 标记本次 AbortError 是否由用户主动触发
  const userStoppedRef = useRef<boolean>(false)

  // Fetch available models and chat history
  const { data: modelList, isLoading: modelsLoading, error: modelsError } = useModelList(user?.id || '')
  const { data: chatHistory, refetch: refetchHistory, isLoading: historyLoading } = useChatHistory(user?.id || '')
  const { data: sessionContent } = useChatHistoryContent(user?.id || '', currentSessionId || '')
  const deleteChatMutation = useChatHistoryDeleteMutation()

  // 初次进入页面时，如未存在会话，则创建一个隐藏的新会话
  useEffect(() => {
    if (!currentSessionId) {
      createNewSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 当模型列表加载完成且尚未选择模型时，默认选中第一个模型
  useEffect(() => {
    if (modelList && modelList.length > 0 && selectedModelIds.length === 0) {
      setSelectedModels([modelList[0].model_id])
    }
  }, [modelList, selectedModelIds.length, setSelectedModels])

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close()
      }
    }
  }, [])

  const handleSendMessage = async (content: string, isRetry: boolean = false) => {
    const IDLE_TIMEOUT = 20000 // 20s 无数据则认为断网
    let lastChunkAt = Date.now()
    let idleTimer: NodeJS.Timeout | null = null

    if (!user || isStreaming || selectedModelIds.length === 0) return

    // Clear any previous errors
    clearError()

    // Store message for retry
    setLastMessage(content)

    // addUserMessage 调用将在确定最终 content 形式后再执行（支持多模态数组）
    if (!isRetry) {
      setRetryCount(0)
    }

    // 状态初始化
    setIsStreaming(true)
    setLoading(true)

    try {
      // 确保存在 session_id
      let sessionId = currentSessionId
      if (!sessionId) {
        sessionId = createNewSession()
      }

      // 调试日志
      console.log('[Chat] 发送开始: selectedModelIds', selectedModelIds)

      // 判断模型是否支持多模态
      let currentModelId = selectedModelIds[0]
      if (!currentModelId && modelList && modelList.length > 0) {
        currentModelId = modelList[0].model_id
        // 更新到 store，防止后续继续为空
        setSelectedModels([currentModelId])
        message.warning('未检测到已选模型，已自动为您选择默认模型')
      }

      const currentModelInfo = modelList?.find((m: any) => m.model_id === currentModelId)
      const isMultimodal = currentModelInfo?.owned_by?.includes('multimodal') || false

      // 准备请求数据
      const formData = new FormData()
      formData.append('user_id', user.id)
      formData.append('session_id', sessionId)
      formData.append('model_id', currentModelId)

      if (user.token) {
        formData.append('token', user.token)
      }

      // 处理附件
      const imageAttachments = attachments.filter(a => a.category === 'image')
      const documentAttachments = attachments.filter(a => a.category !== 'image')

      let userContentForStore: string | any[] = content

      if (isMultimodal && imageAttachments.length > 0) {
        // 按 OpenAI 多模态格式发送
        const contentArr: any[] = [{ type: 'text', text: content }]
        imageAttachments.forEach(img => {
          contentArr.push({ type: 'image_url', image_url: { url: img.public_url } })
        })

        // 如果同时还有文档类附件，将其以文本形式追加
        if (documentAttachments.length > 0) {
          const dictLines = documentAttachments.map(att => `${att.filename}: ${att.public_url}`)
          contentArr.push({
            type: 'text',
            text: `\n\n[附件列表]\n${dictLines.join('\n')}`
          })
        }
        const messages = JSON.stringify([
          { role: 'user', content: contentArr }
        ])
        formData.append('user_message_list', messages)

        userContentForStore = contentArr
      } else {
        // 非多模态或无图片，拼接附件描述到文本
        let finalText = content
        if (attachments.length > 0) {
          const dictLines = attachments.map(att => `${att.filename}: ${att.public_url}`)
          finalText += `\n\n[附件列表]\n` + dictLines.join('\n')
        }
        formData.append('text', finalText)

        userContentForStore = finalText
      }

      // 发送之前，将用户消息添加到 UI（仅首次发送时）
      if (!isRetry) {
        addUserMessage(userContentForStore)
      }

      // 现在开始初始化 assistant 气泡，保证顺序在用户消息之后
      startStreamingResponse()

      // 文件列表发完后清空
      if (attachments.length > 0) {
        clearAllFiles()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      const response = await fetch('/user/chat', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('Failed to start chat stream')
      }

      // Handle SSE stream directly from response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      const resetIdle = () => {
        lastChunkAt = Date.now()
        if (idleTimer) clearTimeout(idleTimer)
        idleTimer = setTimeout(() => {
          console.warn('Detected idle stream, aborting & retry')
          controller.abort()
        }, IDLE_TIMEOUT)
      }

      resetIdle()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        resetIdle()

        buffer += decoder.decode(value, { stream: true })

        let eventEndIdx
        while ((eventEndIdx = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, eventEndIdx)
          buffer = buffer.slice(eventEndIdx + 2)

          // 合并可能的多行 data
          const dataLines = rawEvent.split('\n').filter(l => l.startsWith('data:'))
          const dataStr = dataLines.map(l => l.slice(5).trimStart()).join('\n')

          if (dataStr === '[DONE]') {
            handleStreamComplete()
            return
          }

          if (!dataStr) continue

          try {
            const parsed = JSON.parse(dataStr)
            handleStreamMessage(parsed)
          } catch (e) {
            console.warn('Failed to parse SSE chunk:', dataStr)
          }
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        if (userStoppedRef.current) {
          // 用户主动停止，不做重试和提示
          console.info('Stream aborted by user.')
          userStoppedRef.current = false // 重置标志位，供下次使用
          return // 直接跳出 catch，进入 finally
        } else {
          console.warn('Fetch aborted due to idle timeout, retrying once')
          if (retryCount < 3) {
            setTimeout(() => handleSendMessage(content, true), 500)
            return
          }
        }
      }

      console.error('Failed to send message:', error)
      const errorMessage = error instanceof Error ? error.message : '发送消息失败'

      setRetryCount(prev => prev + 1)

      // Auto retry up to 2 times for network errors
      if (retryCount < 2 && (
        errorMessage.includes('网络') ||
        errorMessage.includes('连接') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Failed to fetch')
      )) {
        console.log(`Retrying message send (attempt ${retryCount + 1})...`)
        setTimeout(() => {
          handleSendMessage(content, true)
        }, 1000 * (retryCount + 1)) // Exponential backoff
        return
      }

      setError(errorMessage)
      message.error(errorMessage)
      finishStreamingResponse()
      setIsStreaming(false)
      setLoading(false)
    } finally {
      // 最后确保标志位被重置
      userStoppedRef.current = false
      // 流结束后清理 controller 引用
      abortControllerRef.current = null
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
    }
  }

  const handleStreamMessage = (data: any) => {
    // Handle different types of streaming data
    if (data.choices && data.choices.length > 0) {
      // OpenAI-style streaming format
      const choice = data.choices[0]
      const delta = choice.delta

      if (delta.content) {
        updateStreamingContent(delta.content)
      }

      if (delta.reasoning_content) {
        updateStreamingContent(undefined, delta.reasoning_content)
      }

      if (choice.finish_reason === 'stop') {
        handleStreamComplete()
      }
    } else if (data.content) {
      // Simple content format
      updateStreamingContent(data.content)
    } else if (data.params && data.tool_response) {
      // Tool call response format
      console.log('Tool call response:', data)
      // Handle tool calls if needed
    }
  }

  const handleStreamError = (error: Event) => {
    console.error('Stream error:', error)
    message.error('连接中断，请重试')
    handleStreamComplete()
  }

  const handleStreamComplete = () => {
    finishStreamingResponse()
    setIsStreaming(false)
    setLoading(false)
    // 确保请求已终止
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
  }

  const handleStopStreaming = () => {
    // 用户已主动请求停止
    userStoppedRef.current = true
    // 主动中止 fetch 流
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
    handleStreamComplete()
    message.info('已停止生成')
  }

  const handleModelChange = (modelIds: string[]) => {
    setSelectedModels(modelIds)
  }

  const handleNewChat = () => {
    createNewSession()
    setShowHistory(false)
  }

  const handleSelectSession = async (sessionId: string) => {
    if (!user || sessionId === currentSessionId) return

    setLoading(true)
    clearError()

    try {
      const formData = new FormData()
      formData.append('user_id', user.id)
      formData.append('session_id', sessionId)
      formData.append('mode', 'get_specific')
      if (user.token) {
        formData.append('token', user.token)
      }

      const response = await fetch('/user/chat_history', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.status === 'success' && result.data?.chat_history) {
        // Transform backend format to frontend format
        const messages = result.data.chat_history.flatMap((item: any) =>
          item.messages.map((msg: any) => ({
            key: `${msg.role}_${Date.now()}_${Math.random()}`,
            role: msg.role,
            content: msg.content,
            timestamp: item.timestamp,
            streaming: false
          }))
        )

        loadSessionMessages(sessionId, messages)
        setShowHistory(false)
        message.success(`已切换到会话 ${sessionId}`)
      } else {
        throw new Error(result.message || '获取会话内容失败')
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      const errorMessage = error instanceof Error ? error.message : '加载会话失败'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return

    try {
      await deleteChatMutation.mutateAsync({
        user_id: user.id,
        session_id: sessionId
      })
      message.success('会话删除成功')
      refetchHistory()
    } catch (error) {
      console.error('Failed to delete session:', error)
      message.error('删除会话失败')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Text type="danger" className="text-sm">
                  {error}
                </Text>
                {lastMessage && retryCount < 3 && (
                  <div className="mt-2">
                    <Button
                      size="small"
                      type="primary"
                      danger
                      onClick={() => handleSendMessage(lastMessage, true)}
                      disabled={isStreaming}
                      loading={isStreaming}
                    >
                      重试发送
                    </Button>
                  </div>
                )}
              </div>
              <Button
                type="text"
                size="small"
                onClick={clearError}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        <ChatMessageList className="flex-1" />
        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStopStreaming}
          onNewConversation={handleNewChat}
          onShowHistory={() => setShowHistory(true)}
          onModelChange={(value) => handleModelChange([value])}
          modelList={modelList as any}
          selectedModelId={selectedModelIds[0]}
          modelsLoading={modelsLoading}
          modelsError={!!modelsError}
          disabled={selectedModelIds.length === 0}
          isStreaming={isStreaming}
          placeholder={
            selectedModelIds.length === 0
              ? "请先选择AI模型..."
              : isStreaming
                ? "AI正在回复中..."
                : "输入消息..."
          }
        />
      </div>

      {/* Chat History Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span>聊天历史</span>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleNewChat}
            >
              新建对话
            </Button>
          </div>
        }
        placement="left"
        onClose={() => setShowHistory(false)}
        open={showHistory}
        width={350}
      >
        {historyLoading ? (
          <div className="text-center py-8">
            <Text type="secondary">加载聊天历史中...</Text>
          </div>
        ) : chatHistory && chatHistory.length > 0 ? (
          <List
            dataSource={chatHistory}
            loading={isLoading}
            renderItem={(session: any) => {
              const isActive = currentSessionId === session.session_id
              const sessionTitle = `会话 ${session.session_id}`
              const sessionTime = new Date(session.timestamp).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <List.Item
                  className={`cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectSession(session.session_id)}
                  actions={[
                    <Popconfirm
                      title="确定删除这个会话吗？"
                      description="删除后无法恢复"
                      onConfirm={(e) => {
                        e?.stopPropagation()
                        handleDeleteSession(session.session_id)
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                        danger
                        disabled={isActive}
                        title={isActive ? "无法删除当前会话" : "删除会话"}
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div className="flex items-center justify-between">
                        <Text ellipsis className={isActive ? 'font-medium text-blue-600' : ''}>
                          {sessionTitle}
                        </Text>
                        {isActive && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            当前
                          </span>
                        )}
                      </div>
                    }
                    description={
                      <Text type="secondary" className="text-xs">
                        {sessionTime}
                      </Text>
                    }
                  />
                </List.Item>
              )
            }}
          />
        ) : (
          <div className="text-gray-500 text-center py-8">
            <p>暂无聊天历史</p>
            <Button type="primary" onClick={handleNewChat} className="mt-4">
              开始新对话
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default ChatPage
