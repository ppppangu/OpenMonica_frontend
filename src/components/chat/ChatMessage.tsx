import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { ChatMessage as ChatMessageType } from '../../stores/chatStore'
import { parseStreamingContent, renderSegmentsToHtml } from '../../utils/streamingUtils'
import hljs from 'highlight.js'
import mermaid from 'mermaid'
import AttachmentToggle from '../file/AttachmentToggle'
import { parseAttachmentBlock } from '../../utils/parseAttachments'
import ThoughtPanel from './ThoughtPanel'
import type { Segment, ToolDoneSegment } from '../../utils/streamingUtils'

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

  // ---------------------------
  // 提取 deepresearch 思维路径
  // ---------------------------
  const extractThoughts = (segs: Segment[]): string[] => {
    const list: string[] = []

    const appConfig: any = typeof window !== 'undefined' ? (window as any).__APP_CONFIG || {} : {}
    const toolMapping: Record<string, string> = appConfig.tool_mapping || {}
    const hideToolList: string[] = Array.isArray(appConfig.hide_tool_name) ? appConfig.hide_tool_name : []

    const pushLines = (val: string | string[]) => {
      const arr = Array.isArray(val) ? val : val.split(/\n+/)
      arr.forEach(line => {
        const cleaned = line.replace(/^\s*-\s*/, '').trim()
        if (cleaned) list.push(cleaned)
      })
    }

    segs.forEach(seg => {
      if (seg.type === 'toolDone') {
        const td = seg as ToolDoneSegment
        try {
          const obj = JSON.parse(td.json.tool_response)
          if (obj && obj.thought) {
            pushLines(obj.thought)
          }
        } catch { /* ignore parse error */ }
      }

      if (seg.type === 'toolUsing') {
        const tu = seg as any

        // 1. 解析 sequentialthinking 内部思考
        if (tu.json?.tool === 'sequentialthinking' && tu.json.arguments) {
          const thoughtVal = tu.json.arguments.thought
          if (thoughtVal) {
            pushLines(thoughtVal)
          }
        }

        // 2. 添加工具调用提示行
        if (tu.json?.tool) {
          const rawName: string = tu.json.tool
          if (!hideToolList.includes(rawName)) {
            const mappedName = toolMapping[rawName] || rawName
            list.push(`agent调用\`${mappedName}\`工具`)
          }
        }
      }
    })

    return list
  }

  const thoughts = useMemo(() => extractThoughts(segments as Segment[]), [segments])

  // 初始时若存在思维内容则自动展开
  const [showThoughtPanel, setShowThoughtPanel] = useState(thoughts.length > 0)

  // 当新的思维内容出现时自动展开
  useEffect(() => {
    if (thoughts.length > 0) {
      setShowThoughtPanel(true)
    }
  }, [thoughts])

  useEffect(() => {
    if (bubbleRef.current) {
      bubbleRef.current.querySelectorAll('pre code').forEach((block) => {
        const element = block as HTMLElement
        // 跳过 mermaid 代码块，避免控制台 WARN
        if (element.classList.contains('language-mermaid')) return
        hljs.highlightElement(element)
      })

      // -------------------------------
      // 改进的 Mermaid 渲染逻辑：
      // 1. 初始阶段显示占位骨架，防止闪烁
      // 2. 渲染完成后替换占位并展示 svg
      // 3. 点击组件可在"预览模式 (svg)"与"源码模式 (mermaid 语法)"之间切换
      // -------------------------------
      const mermaidNodes = bubbleRef.current.querySelectorAll('.mermaid')
      mermaidNodes.forEach((node) => {
        const srcCode = node.textContent || ''

        // 若已包装过则跳过
        if (node.parentElement?.classList.contains('mermaid-wrapper')) return

        // 创建包裹器
        const wrapper = document.createElement('div')
        wrapper.className = 'mermaid-wrapper my-2 border border-gray-200 rounded-md shadow-sm bg-white overflow-hidden'

        // 占位骨架
        const placeholder = document.createElement('div')
        placeholder.className = 'mermaid-placeholder flex items-center justify-center text-gray-400 h-40 animate-pulse select-none cursor-pointer'
        placeholder.innerText = '图表生成中...'

        // 预览容器（svg 渲染后插入）
        const previewContainer = document.createElement('div')
        previewContainer.className = 'mermaid-preview hidden w-full overflow-x-auto cursor-pointer'

        // 源码容器
        const codeContainer = document.createElement('pre')
        codeContainer.className = 'mermaid-source hidden p-3 text-sm bg-gray-50 overflow-x-auto'
        const codeEl = document.createElement('code')
        codeEl.textContent = srcCode
        codeContainer.appendChild(codeEl)

        // 组装结构
        wrapper.appendChild(placeholder)
        wrapper.appendChild(previewContainer)
        wrapper.appendChild(codeContainer)

        // 替换原始 mermaid 节点为 wrapper
        node.replaceWith(wrapper)
        // 将原节点移入 previewContainer 供 mermaid 处理
        previewContainer.appendChild(node)

        // 生成唯一 ID
        if (!(node as HTMLElement).id) {
          ;(node as HTMLElement).id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        }

        // 初始化 mermaid（全局仅一次）
        try {
          if (!(mermaid as any)._initialized) {
            mermaid.initialize({ startOnLoad: false })
            ;(mermaid as any)._initialized = true
          }

          // 渲染当前节点 —— mermaid.render 返回 svg 字符串（但更简洁，本处直接使用 mermaid.init 通用渲染）
          mermaid.init(undefined, [node as any])

          // 容错：渲染可能是异步的，这里给一个微小延迟再显示
          window.setTimeout(() => {
            placeholder.classList.add('hidden')
            previewContainer.classList.remove('hidden')
          }, 100)
        } catch (e) {
          console.error('Mermaid render error:', e)
          placeholder.innerText = '图表渲染失败'
        }

        // 点击切换视图：preview <-> source
        const toggleView = () => {
          const isPreviewVisible = !previewContainer.classList.contains('hidden')
          if (isPreviewVisible) {
            previewContainer.classList.add('hidden')
            codeContainer.classList.remove('hidden')
          } else {
            codeContainer.classList.add('hidden')
            previewContainer.classList.remove('hidden')
          }
        }

        wrapper.addEventListener('click', toggleView)
      })
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
      // ===== 文件类型白名单判断 =====
      const allowedExt = ['.html', '.htm', '.pdf', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp']
      let ext = ''
      try {
        ext = rawSrc ? new URL(rawSrc).pathname.split('.').pop()?.toLowerCase() || '' : ''
        if (ext) ext = '.' + ext
      } catch { /* ignore */ }

      if (ext && !allowedExt.includes(ext)) {
        // 不允许内嵌，改为提示链接
        wrapper.innerHTML = `<a href="${rawSrc}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">点击打开文件</a>`
        return
      }

      // 若为跨域资源，则走同源代理以修正响应头；同源或以 / 开头的路径保持不变
      let resolvedSrc: string
      try {
        const urlObj = new URL(rawSrc, window.location.href)
        const isSameOrigin = urlObj.origin === window.location.origin
        resolvedSrc = isSameOrigin ? urlObj.href : `/file/proxy?url=${encodeURIComponent(urlObj.href)}`
      } catch {
        // 无法解析 (可能是相对路径)，直接使用原始地址
        resolvedSrc = rawSrc
      }

      // -----------------------------
      // 基础样式 & 宽高比辅助函数 (需在后续使用之前定义)
      // -----------------------------
      wrapper.style.position = 'relative'
      wrapper.style.width = '100%'

      const applyAspectRatio = (w: number, h: number) => {
        if (w > 0 && h > 0) {
          wrapper.style.aspectRatio = `${w} / ${h}`
          wrapper.style.height = 'auto'
          wrapper.style.minHeight = '0'
        }
      }

      // 创建 iframe
      const iframe = document.createElement('iframe')
      iframe.src = resolvedSrc
      iframe.setAttribute('referrerpolicy', 'no-referrer')
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture')
      iframe.style.width = '100%'
      iframe.style.height = '100%'

      // === 新增: 控制按钮(全屏 / 新窗口) ===
      const controls = document.createElement('div')
      controls.className = 'safe-iframe-controls flex gap-1'
      controls.style.position = 'absolute'
      controls.style.top = '4px'
      controls.style.right = '4px'
      controls.style.zIndex = '10'

      // 全屏按钮
      const btnFull = document.createElement('button')
      btnFull.title = '全屏显示'
      btnFull.innerText = '⛶'
      btnFull.className = 'safe-iframe-btn'
      btnFull.addEventListener('click', (e) => {
        e.stopPropagation()
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen().catch(() => {
            window.open(rawSrc, '_blank')
          })
        } else {
          window.open(rawSrc, '_blank')
        }
      })

      // 新窗口按钮
      const btnNew = document.createElement('button')
      btnNew.title = '在新窗口打开'
      btnNew.innerText = '↗'
      btnNew.className = 'safe-iframe-btn'
      btnNew.addEventListener('click', (e) => {
        e.stopPropagation()
        window.open(rawSrc, '_blank')
      })

      controls.appendChild(btnFull)
      controls.appendChild(btnNew)

      // 在加载前插入，保持 DOM 顺序
      wrapper.appendChild(iframe)
      wrapper.appendChild(controls)

      const loadingEl = wrapper.querySelector('.safe-iframe-loading') as HTMLElement | null

      const showError = (msg: string) => {
        if (loadingEl) {
          loadingEl.remove()
        }

        // 若已存在错误元素则跳过
        if (wrapper.querySelector('.safe-iframe-error')) return

        const err = document.createElement('div')
        err.className = 'safe-iframe-error'
        err.innerHTML = `${msg}，<a href="${rawSrc}" target="_blank" rel="noopener noreferrer" class="underline">在新标签页打开</a>`
        wrapper.appendChild(err)
      }

      // 超时处理：由于部分大型静态 HTML 首次加载较慢，放宽到 45s
      const SAFE_IFRAME_TIMEOUT = 45_000 // 45 秒
      const timeoutId = window.setTimeout(() => {
        showError('加载超时（45s）')
      }, SAFE_IFRAME_TIMEOUT)

      // ------ 监听 iframe 加载完成，尝试检测内容尺寸 ------
      const tryDetectAspect = () => {
        try {
          const doc = iframe.contentWindow?.document
          if (doc) {
            const { scrollWidth, scrollHeight } = doc.documentElement
            if (scrollWidth && scrollHeight) {
              applyAspectRatio(scrollWidth, scrollHeight)
              return true
            }
          }
        } catch {
          // 跨域或访问失败
        }
        return false
      }

      iframe.addEventListener('load', () => {
        clearTimeout(timeoutId)
        if (loadingEl) {
          loadingEl.remove()
        }

        // SAMEORIGIN / DENY 检测
        try {
          const loc = iframe.contentWindow?.location.href
          if (!loc || loc === 'about:blank') {
            showError('站点拒绝内嵌')
          }
        } catch {
          /* ignore */
        }

        // 尝试检测宽高比
        const detected = tryDetectAspect()
        if (!detected) {
          // 降级策略：根据文件扩展名设置常见比例
          if (['.ppt', '.pptx', '.pptm'].includes(ext)) {
            applyAspectRatio(16, 9)
          } else if (['.doc', '.docx', '.pdf'].includes(ext)) {
            // 绝大多数简历与 A4 文档使用接近 3:4 的比例
            applyAspectRatio(3, 4)
          } else {
            // 默认回退为方形
            applyAspectRatio(1, 1)
          }
        }
      })

      iframe.addEventListener('error', () => {
        clearTimeout(timeoutId)
        showError('加载失败')
      })
    })
  }, [htmlContent])

  // 渲染后的 HTML 直接使用（工具显示过滤已在 streamingUtils 处理）
  const finalHtml = htmlContent

  return (
    <div className={`flex gap-3 ${isUser ? 'mb-4 flex-row-reverse' : 'mb-2 flex-row'}`}>
      {/* Avatar */}
      <Avatar
        size="default"
        src={isAssistant ? '/icons/logo.svg' : undefined}
        icon={isUser ? <UserOutlined /> : undefined}
        className={isUser ? 'bg-blue-600' : ''}
      />

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message Bubble */}
        <div
          ref={bubbleRef}
          className={`
            chat-bubble
            ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}
            ${!showThoughtPanel ? 'hide-thinking' : ''}
          `}
        >
          {/* 思维路径按钮 */}
          {isAssistant && thoughts.length > 0 && (
            <button
              className="rounded-2xl bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm mb-2 cursor-pointer transition"
              onClick={() => setShowThoughtPanel(prev => !prev)}
            >
              agent思维路径
            </button>
          )}

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

      {/* Thought Panel */}
      {thoughts.length > 0 && (
        <ThoughtPanel
          thoughts={thoughts}
          visible={showThoughtPanel}
          onClose={() => setShowThoughtPanel(false)}
        />
      )}
    </div>
  )
}

export default ChatMessage

