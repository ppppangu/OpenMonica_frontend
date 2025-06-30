import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Empty } from 'antd'
import { useChatStore } from '../../stores/chatStore'
import ChatMessage from './ChatMessage'

interface ChatMessageListProps {
  className?: string
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ className = '' }) => {
  const { currentMessages, streamingMessage } = useChatStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 是否应该自动滚动到底部
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20 // 阈值 20px
    setShouldAutoScroll(isAtBottom)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentMessages, streamingMessage, shouldAutoScroll])

  // 绑定滚动事件
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll)
    return () => {
      el.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

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
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto overflow-x-hidden break-words p-4 ${className}`}
    >
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
