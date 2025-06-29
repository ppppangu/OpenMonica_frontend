import React from 'react'
import { Avatar, Typography } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { ChatMessage as ChatMessageType } from '../../stores/chatStore'
import { parseStreamingContent, renderSegmentsToHtml } from '../../utils/streamingUtils'

const { Text } = Typography

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // Parse content for tool calls and thinking
  const segments = parseStreamingContent(message.content)
  const htmlContent = renderSegmentsToHtml(segments)

  // Handle reasoning content (thinking)
  const hasReasoning = message.reasoning_content && message.reasoning_content.length > 0
  const reasoningSegments = hasReasoning ? parseStreamingContent(message.reasoning_content) : []
  const reasoningHtml = hasReasoning ? renderSegmentsToHtml(reasoningSegments) : ''

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <Avatar
        size="default"
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        className={isUser ? 'bg-primary-600' : 'bg-gray-500'}
      />

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message Bubble */}
        <div
          className={`
            chat-bubble
            ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}
            ${isStreaming ? 'animate-pulse' : ''}
          `}
        >
          {/* Reasoning Content (if exists) */}
          {hasReasoning && (
            <div className="thinking-content mb-3">
              <div className="text-sm text-gray-500 mb-1">💭 思考过程:</div>
              <div 
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: reasoningHtml }}
              />
            </div>
          )}

          {/* Main Content */}
          {message.content ? (
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : isStreaming ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full"></div>
              <span>正在思考...</span>
            </div>
          ) : null}

          {/* Streaming indicator */}
          {isStreaming && message.content && (
            <span className="inline-block w-2 h-4 bg-primary-600 animate-pulse ml-1"></span>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
