import React, { useState, useEffect, useRef } from 'react'
import { Layout, Button, Select, message, Drawer } from 'antd'
import { HistoryOutlined, SettingOutlined } from '@ant-design/icons'
import { useChatStore } from '../stores/chatStore'
import { useAuth } from '../hooks/useAuth'
import { useModelList } from '../hooks/useApi'
import { parseOpenAISSEChunk, createChatSSEConnection } from '../utils/streamingUtils'
import ChatMessageList from '../components/chat/ChatMessageList'
import ChatInput from '../components/chat/ChatInput'

const { Sider, Content } = Layout
const { Option } = Select

const ChatPage: React.FC = () => {
  const { user } = useAuth()
  const {
    currentMessages,
    streamingMessage,
    selectedModelIds,
    addUserMessage,
    startStreamingResponse,
    updateStreamingContent,
    finishStreamingResponse,
    setSelectedModels
  } = useChatStore()

  const [isStreaming, setIsStreaming] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const sseRef = useRef<EventSource | null>(null)

  // Fetch available models
  const { data: modelList, isLoading: modelsLoading } = useModelList(user?.id || '')

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close()
      }
    }
  }, [])

  const handleSendMessage = async (content: string) => {
    if (!user || isStreaming) return

    // Add user message
    addUserMessage(content)

    // Start streaming response
    setIsStreaming(true)
    startStreamingResponse()

    try {
      // Create form data for the request
      const formData = new FormData()
      formData.append('user_id', user.id)
      formData.append('text', content)
      formData.append('model_ids', JSON.stringify(selectedModelIds))
      if (user.token) {
        formData.append('token', user.token)
      }

      // Send initial request to start streaming
      const response = await fetch('/user/chat/stream', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to start chat stream')
      }

      const result = await response.json()

      if (result.stream_url) {
        // Connect to SSE stream
        sseRef.current = createChatSSEConnection(
          result.stream_url,
          handleStreamMessage,
          handleStreamError,
          handleStreamComplete
        )
      } else {
        throw new Error('No stream URL received')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      message.error('发送消息失败，请稍后重试')
      finishStreamingResponse()
      setIsStreaming(false)
    }
  }

  const handleStreamMessage = (data: any) => {
    const parsed = parseOpenAISSEChunk(JSON.stringify(data))

    if (parsed.content || parsed.reasoningContent) {
      updateStreamingContent(parsed.content, parsed.reasoningContent)
    }

    if (parsed.isFinished) {
      handleStreamComplete()
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
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
  }

  const handleModelChange = (modelIds: string[]) => {
    setSelectedModels(modelIds)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setShowHistory(true)}
          >
            聊天历史
          </Button>

          <Select
            mode="multiple"
            placeholder="选择AI模型"
            value={selectedModelIds}
            onChange={handleModelChange}
            loading={modelsLoading}
            style={{ minWidth: 200 }}
          >
            {modelList?.map((model: any) => (
              <Option key={model.model_id} value={model.model_id}>
                {model.model_name}
              </Option>
            ))}
          </Select>
        </div>

        <Button
          icon={<SettingOutlined />}
          onClick={() => message.info('设置功能开发中...')}
        >
          设置
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ChatMessageList className="flex-1" />
        <ChatInput
          onSend={handleSendMessage}
          disabled={isStreaming}
          placeholder={isStreaming ? "AI正在回复中..." : "输入消息..."}
        />
      </div>

      {/* Chat History Drawer */}
      <Drawer
        title="聊天历史"
        placement="left"
        onClose={() => setShowHistory(false)}
        open={showHistory}
        width={300}
      >
        <div className="text-gray-500 text-center py-8">
          聊天历史功能开发中...
        </div>
      </Drawer>
    </div>
  )
}

export default ChatPage
