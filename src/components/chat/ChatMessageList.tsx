import React, { useEffect, useRef } from 'react'
import { Empty } from 'antd'
import { useChatStore } from '../../stores/chatStore'
import ChatMessage from './ChatMessage'

interface ChatMessageListProps {
  className?: string
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ className = '' }) => {
  const { currentMessages, streamingMessage } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages, streamingMessage])

  if (currentMessages.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Empty
          description="开始新的对话"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )
  }

  return (
    <div className={`flex-1 overflow-y-auto overflow-x-hidden break-words p-4 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {currentMessages.map((message) => (
          <ChatMessage
            key={message.key}
            message={message}
            isStreaming={message.streaming && message.key === streamingMessage?.key}
          />
        ))}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatMessageList
