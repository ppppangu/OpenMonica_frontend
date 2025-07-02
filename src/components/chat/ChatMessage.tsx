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
        const element = block as HTMLElement
        // 跳过 mermaid 代码块，避免控制台 WARN
        if (element.classList.contains('language-mermaid')) return
        hljs.highlightElement(element)
      })

      // 渲染 mermaid 图（确保唯一 ID，且全局仅初始化一次）
      const mermaidNodes = bubbleRef.current.querySelectorAll('.mermaid')
      if (mermaidNodes.length > 0) {
        mermaidNodes.forEach((node) => {
          if (!(node as HTMLElement).id) {
            ;(node as HTMLElement).id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          }
        })

        try {
          // 只初始化一次
          if (!(mermaid as any)._initialized) {
            mermaid.initialize({ startOnLoad: false })
            ;(mermaid as any)._initialized = true
          }
          mermaid.init(undefined, mermaidNodes as any)
        } catch (e) {
          console.error('Mermaid render error:', e)
        }
      }
    }
  }, [htmlContent])

  /* ----------------------------
   * Safe Iframe 注入与错误处理
   * --------------------------*/
  useEffect(() => {
    if (!bubbleRef.current) return

    const wrappers = bubbleRef.current.querySelectorAll('.safe-iframe-wrapper') as NodeListOf<HTMLElement>

    wrappers.forEach((wrapper) => {
      // 避免重复初始化
      if (wrapper.getAttribute('data-initialized') === 'true') return
      wrapper.setAttribute('data-initialized', 'true')

      const rawSrc = wrapper.getAttribute('data-src') || ''
      let resolvedSrc = rawSrc

      // 处理 https 页面嵌入 http 产生的 Mixed-Content
      if (window.location.protocol === 'https:' && rawSrc.startsWith('http:')) {
        // 通过同源代理避免 Mixed-Content
        resolvedSrc = `/proxy?url=${encodeURIComponent(rawSrc)}`
      }

      // 创建 iframe
      const iframe = document.createElement('iframe')
      iframe.src = resolvedSrc
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
      iframe.setAttribute('referrerpolicy', 'no-referrer')
      iframe.style.width = '100%'
      iframe.style.height = '100%'

      // 在加载前插入，保持 DOM 顺序
      wrapper.appendChild(iframe)

      const loadingEl = wrapper.querySelector('.safe-iframe-loading') as HTMLElement | null

      const showError = (msg: string) => {
        if (loadingEl) {
          loadingEl.remove()
        }

        // 若已存在错误元素则跳过
        if (wrapper.querySelector('.safe-iframe-error')) return

        const err = document.createElement('div')
        err.className = 'safe-iframe-error'
        const encoded = encodeURIComponent(rawSrc)
        err.innerHTML = `${msg}，<a href="${rawSrc}" target="_blank" rel="noopener noreferrer" class="underline">新标签页打开</a> | <a href="/proxy?url=${encoded}" target="_blank" rel="noopener noreferrer" class="underline">代理访问</a>`
        wrapper.appendChild(err)
      }

      // 超时处理：由于部分大型静态 HTML 首次加载较慢，放宽到 45s
      const SAFE_IFRAME_TIMEOUT = 45_000 // 45 秒
      const timeoutId = window.setTimeout(() => {
        showError('加载超时（45s）')
      }, SAFE_IFRAME_TIMEOUT)

      iframe.addEventListener('load', () => {
        clearTimeout(timeoutId)
        if (loadingEl) {
          loadingEl.remove()
        }

        // SAMEORIGIN / DENY 检测
        try {
          // 若跨域访问会抛错，捕获忽略
          const loc = iframe.contentWindow?.location.href
          if (!loc || loc === 'about:blank') {
            showError('站点拒绝内嵌')
          }
        } catch (e) {
          // 无法访问意味着跨域，但不一定错误，忽略即可
        }
      })

      iframe.addEventListener('error', () => {
        clearTimeout(timeoutId)
        showError('加载失败')
      })
    })
  }, [htmlContent])

  // 读取全局配置
  const hideToolName = (typeof window !== 'undefined' && (window as any).__APP_CONFIG?.hide_tool_name === true)

  // 若需要隐藏工具名，则对 htmlContent 进行替换（回退方案，确保渲染结果符合要求）
  const finalHtml = hideToolName ? htmlContent.replace(/🔧 调用工具:[^<]+/g, '🔧 调用工具') : htmlContent

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
              dangerouslySetInnerHTML={{ __html: finalHtml }}
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
