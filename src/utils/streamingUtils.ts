import { escape } from 'lodash-es'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

// Types for streaming content
export type SegmentType = "think" | "normal" | "toolUsing" | "toolDone"

export interface BaseSegment {
  type: SegmentType
  content: string
}

export interface ToolUsingSegment extends BaseSegment {
  type: "toolUsing"
  json: {
    tool: string
    arguments: any
  }
}

export interface ToolDoneSegment extends BaseSegment {
  type: "toolDone"
  json: {
    params: string
    tool_response: string
    is_error: string | boolean
  }
  parsedParams?: {
    tool: string
    arguments: any
  }
}

export type Segment = BaseSegment | ToolUsingSegment | ToolDoneSegment

// ----------------------------
// 自定义 Markdown 渲染，支持：
// 1. 在代码块顶部显示语言标签
// 2. 对于 highlight.js 不支持的语言（如 mermaid），依旧保留 language-* class
// ----------------------------

const md = new MarkdownIt({
  html: true,
  linkify: true,
  highlight: (str: string, lang: string) => {
    // 标准化语言名（去除空白并转为小写）
    const safeLang = (lang || '').trim().toLowerCase()

    // 渲染核心函数：去除语言标签，保持简洁结构
    const renderPlain = (codeHtml: string) => {
      return `
        <pre class="hljs"><code class="language-${escape(safeLang || 'text')}">${codeHtml}</code></pre>
      `
    }

    try {
      // highlight.js 原生支持
      if (safeLang && hljs.getLanguage(safeLang)) {
        const highlighted = hljs.highlight(str, { language: safeLang, ignoreIllegals: true }).value
        return renderPlain(highlighted)
      }

      // 对于不支持的语言，保持原内容，并确保 language-* class 存在
      return renderPlain(escape(str))
    } catch {
      return renderPlain(escape(str))
    }
  },
})

// OpenAI SSE response format
export interface OpenAISSEChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      content?: string
      reasoning_content?: string
      role?: string
    }
    finish_reason: string | null
  }>
  system_fingerprint: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Tool call result format
export interface ToolCallResult {
  params: string
  tool_response: string
  is_error: string
}

// Parse streaming content into segments
export function parseStreamingContent(content: string): Segment[] {
  const segments: Segment[] = []
  const codeRe = /```json[\s\S]*?```/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = codeRe.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIdx) {
      segments.push(...splitThinkNormal(content.slice(lastIdx, match.index)))
    }

    const codeBlock = match[0]
    const inner = codeBlock.replace(/^```json\s*/i, "").replace(/```$/, "")
    let obj: any
    
    try {
      obj = JSON.parse(inner)
    } catch {
      // Invalid JSON, treat as normal text
      segments.push({ type: "normal", content: codeBlock })
      lastIdx = codeRe.lastIndex
      continue
    }

    const keys = Object.keys(obj)
    if (keys.length === 2 && keys.includes("tool") && keys.includes("arguments")) {
      segments.push({
        type: "toolUsing",
        content: codeBlock,
        json: obj,
      } as ToolUsingSegment)
    } else if (
      keys.length === 3 &&
      keys.includes("params") &&
      keys.includes("tool_response") &&
      keys.includes("is_error")
    ) {
      let parsedParams: any
      try {
        parsedParams = JSON.parse(obj.params)
      } catch {
        parsedParams = undefined
      }
      segments.push({
        type: "toolDone",
        content: codeBlock,
        json: obj,
        parsedParams,
      } as ToolDoneSegment)
    } else {
      // Other JSON, treat as normal text
      segments.push({ type: "normal", content: codeBlock })
    }

    lastIdx = codeRe.lastIndex
  }

  // Add remaining text
  if (lastIdx < content.length) {
    segments.push(...splitThinkNormal(content.slice(lastIdx)))
  }

  return segments
}

// Split text by <think> tags
function splitThinkNormal(text: string): Segment[] {
  const list: Segment[] = []
  const tagRe = /<\/??think>/g
  let last = 0
  let inThink = false
  let m: RegExpExecArray | null

  while ((m = tagRe.exec(text)) !== null) {
    if (m.index > last) {
      list.push({ type: inThink ? "think" : "normal", content: text.slice(last, m.index) })
    }
    inThink = m[0] === "<think>"
    last = tagRe.lastIndex
  }
  
  if (last < text.length) {
    list.push({ type: inThink ? "think" : "normal", content: text.slice(last) })
  }
  
  return list
}

// Render segments to HTML
export function renderSegmentsToHtml(segments: Segment[]): string {
  const htmlParts: string[] = []

  // 收集已完成的工具调用，用于隐藏对应调用块
  const completedSet = new Set<string>()
  segments.forEach((seg) => {
    if (seg.type === 'toolDone' && (seg as ToolDoneSegment).parsedParams) {
      completedSet.add(JSON.stringify((seg as ToolDoneSegment).parsedParams))
    }
  })

  // 读取全局隐藏配置（由 ChatInput/页面加载时注入 window）
  const hideToolName = (typeof window !== 'undefined' && (window as any).__APP_CONFIG?.hide_tool_name === true)

  segments.forEach((segment) => {
    if (segment.type === 'think' || segment.type === 'normal') {
      // 过滤空文本，避免渲染空占位块
      if (!segment.content || segment.content.trim() === '') return
      const className = segment.type === 'think' ? 'thinking-content' : 'normal-content'
      htmlParts.push(`<div class="${className}">${markdownToHtml(segment.content)}</div>`)
    } else if (segment.type === 'toolUsing') {
      // 若已完成，跳过渲染调用块
      const key = JSON.stringify((segment as ToolUsingSegment).json)
      if (completedSet.has(key)) return

      htmlParts.push(
        `<details class="tool-call-block tool-call-loading">
           <summary class="tool-call-header cursor-pointer select-none">🔧 调用工具${hideToolName ? '' : ': ' + escape((segment as ToolUsingSegment).json.tool)}</summary>
           <pre class="tool-call-content">${escape(segment.content)}</pre>
         </details>`
      )
    } else if (segment.type === 'toolDone') {
      const toolDone = segment as ToolDoneSegment
      const isError = toolDone.json.is_error === true || toolDone.json.is_error === 'true'
      const statusClass = isError ? 'tool-call-error' : 'tool-call-success'
      const statusIcon = isError ? '❌' : '✅'

      htmlParts.push(
        `<details class="tool-call-block ${statusClass}">
           <summary class="tool-call-header cursor-pointer select-none">${statusIcon} 工具执行${isError ? '失败' : '完成'}</summary>
           <div class="tool-call-result">${escape(toolDone.json.tool_response)}</div>
         </details>`
      )
    }
  })

  return htmlParts.join('\n')
}

function markdownToHtml(text: string): string {
  // 新增：在 Markdown 渲染之前，先检测 <http://...> 或 <https://...> 形式的 URL 并替换为 iframe
  // 这样可以确保 iframe 渲染的优先级高于 Markdown 的 linkify 处理
  const urlRe = /<(https?:\/\/[^>]+)>/g
  const preProcessed = text.replace(urlRe, (_: string, url: string) => {
    const safeUrl = escape(url)
    return `<iframe src="${safeUrl}" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" style="width:100%;height:300px;"></iframe>`
  })

  // 使用 markdown-it 对剩余文本进行渲染
  let html = md.render(preProcessed)

  html = html.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, (_: string, url: string) => {
    const safeUrl = escape(url)
    return `<iframe src="${safeUrl}" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" style="width:100%;height:300px;"></iframe>`
  })

  // Mermaid 代码块 → 保留源码，交由 mermaid.js 解析
  // 兼容前方新增的 figure.wrap
  html = html.replace(/<pre[^>]*><code[^>]*class="[^"]*language-mermaid[^"]*"[^>]*>([\s\S]*?)<\/code><\/pre>/g, (_m, code) => {
    return `<div class="mermaid">${code}</div>`
  })

  // 将 cpolar 临时隧道 http 链接升级为 https，避免 Mixed-Content 警告
  html = html.replace(/(href|src)="http:\/\/([\w.-]+\.cpolar\.cn[^"]*)"/g, (_: string, attr: string, rest: string) => {
    return `${attr}="https://${rest}"`
  })

  // 为所有图片标签添加 referrerpolicy 与 crossorigin，放宽 CSP 并减小跨源限制
  html = html.replace(/<img ([^>]*?)(?:\/)?>/g, (_: string, attrs: string) => {
    // 若已有相关属性则不重复添加
    const hasReferrer = /referrerpolicy=/i.test(attrs)
    const hasCross = /crossorigin=/i.test(attrs)
    const extra = `${hasReferrer ? '' : ' referrerpolicy="no-referrer"'}${hasCross ? '' : ' crossorigin="anonymous"'} loading="lazy"`.trim()
    return `<img ${attrs}${extra ? ' ' + extra : ''}/>`
  })

  return html
}

// Parse OpenAI SSE chunk
export function parseOpenAISSEChunk(chunkData: string): {
  chatId?: string
  content?: string
  reasoningContent?: string
  isToolCall?: boolean
  toolResult?: ToolCallResult
  isFinished?: boolean
} {
  try {
    const parsed: OpenAISSEChunk = JSON.parse(chunkData)
    const chatId = parsed.id

    if (parsed.choices && parsed.choices.length > 0) {
      const choice = parsed.choices[0]
      const delta = choice.delta
      const isFinished = choice.finish_reason === 'stop'

      return {
        chatId,
        content: delta.content,
        reasoningContent: delta.reasoning_content,
        isFinished
      }
    }

    return { isFinished: false }
  } catch (error) {
    console.error('Failed to parse OpenAI SSE chunk:', error)
    return { isFinished: false }
  }
}

// Create SSE connection for chat streaming
export function createChatSSEConnection(
  url: string,
  onMessage: (data: any) => void,
  onError: (error: Event) => void,
  onComplete: () => void
): EventSource {
  const eventSource = new EventSource(url)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (error) {
      console.error('Error parsing SSE message:', error)
    }
  }

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error)
    onError(error)
    eventSource.close()
  }

  eventSource.addEventListener('complete', () => {
    onComplete()
    eventSource.close()
  })

  return eventSource
}
