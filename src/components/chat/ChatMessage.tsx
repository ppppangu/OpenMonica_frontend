import React from 'react'
import { Avatar } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { ChatMessage as ChatMessageType } from '../../stores/chatStore'
import { parseStreamingContent, renderSegmentsToHtml } from '../../utils/streamingUtils'
import hljs from 'highlight.js'
import mermaid from 'mermaid'
import { useEffect, useRef } from 'react'
import AttachmentToggle from '../file/AttachmentToggle'
import { parseAttachmentBlock } from '../../utils/parseAttachments'

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // 处理 content: 可能是字符串，也可能是多模态数组
  let textContent = ''
  const imageUrls: string[] = []
  const fileLinks: { filename: string; url: string }[] = []

  if (Array.isArray(message.content)) {
    (message.content as any[]).forEach((part) => {
      if (part.type === 'image_url' && part.image_url?.url) {
        imageUrls.push(part.image_url.url)
      } else if (part.type === 'text' || part.text) {
        const txt = typeof part.text === 'string' ? part.text : part.text?.content || part.content || ''
        textContent += txt
      } else if (part.type === 'file' && part.file_url) {
        fileLinks.push({ filename: part.filename || '附件', url: part.file_url })
      }
    })
  } else {
    textContent = message.content as string
  }

  // 解析附件块
  const { attachments: parsedAttachments, stripped } = parseAttachmentBlock(textContent)
  textContent = stripped

  // 将旧 fileLinks 转换为统一附件结构
  const legacyAttachments = fileLinks.map(f => ({ name: f.filename, url: f.url }))

  const attachments = parsedAttachments

  // Parse content for tool calls and thinking
  const segments = parseStreamingContent(textContent)
  const htmlContent = renderSegmentsToHtml(segments)

  // ref for message bubble to apply syntax highlighting after render
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bubbleRef.current) {
      bubbleRef.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement)
      })

      // 渲染 mermaid 图
      if (bubbleRef.current.querySelector('.mermaid')) {
        try {
          mermaid.initialize({ startOnLoad: false })
          mermaid.init(undefined, bubbleRef.current.querySelectorAll('.mermaid'))
        } catch (e) {
          console.error('Mermaid render error:', e)
        }
      }
    }
  }, [htmlContent])

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <Avatar
        size="default"
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        className={isUser ? 'bg-blue-600' : 'bg-gray-500'}
      />

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message Bubble */}
        <div
          ref={bubbleRef}
          className={`
            chat-bubble
            ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}
          `}
        >
          {/* Main Content */}
          {textContent ? (
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : isStreaming ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              <span>正在思考...</span>
            </div>
          ) : null}

          {/* 图片预览 */}
          {imageUrls.length > 0 && (
            <div className={`mt-3 flex flex-wrap gap-2 ${isUser ? 'justify-end' : ''}`}>
              {imageUrls.map((url, idx) => (
                <a href={url} target="_blank" rel="noopener noreferrer" key={idx}>
                  <img
                    src={url}
                    alt={`图片${idx + 1}`}
                    className="w-40 h-28 object-cover rounded border hover:opacity-90"
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 附件列表：显示在气泡下方，靠右/左对齐 */}
        {attachments.concat(legacyAttachments).length > 0 && (
          <div className={`mt-1 ${isUser ? 'flex justify-end' : 'flex justify-start'}`}>
            <AttachmentToggle attachments={attachments.concat(legacyAttachments)} />
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
