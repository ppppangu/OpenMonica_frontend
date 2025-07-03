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
    const renderPlain = (codeHtml: string) =>
      `<pre class="hljs"><code class="language-${escape(safeLang || 'text')}">${codeHtml}</code></pre>`

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
  // === 新增: 收集已完成的工具调用 (type-4) ===
  const doneKeySet = new Set<string>()
  const stableStringify = (obj: any): string => {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
    const sortedKeys = Object.keys(obj).sort()
    const ordered: Record<string, any> = {}
    sortedKeys.forEach((k) => {
      ordered[k] = obj[k]
    })
    return JSON.stringify(ordered)
  }

  segments.forEach((seg) => {
    if (seg.type === 'toolDone') {
      const td = seg as ToolDoneSegment
      if (td.parsedParams && td.parsedParams.tool) {
        const key = `${td.parsedParams.tool}:${stableStringify(td.parsedParams.arguments)}`
        doneKeySet.add(key)
      }
    }
  })

  const htmlParts: string[] = []

  // 读取全局隐藏工具列表
  const hideToolList: string[] =
    typeof window !== 'undefined' && Array.isArray((window as any).__APP_CONFIG?.hide_tool_name)
      ? (window as any).__APP_CONFIG.hide_tool_name
      : []
  // 读取工具名称映射表
  const toolMapping: Record<string, string> =
    typeof window !== 'undefined' && (window as any).__APP_CONFIG?.tool_mapping
      ? (window as any).__APP_CONFIG.tool_mapping
      : {}

  // 第二遍渲染
  segments.forEach((segment) => {
    if (segment.type === 'think' || segment.type === 'normal') {
      if (!segment.content || segment.content.trim() === '') return
      const className = segment.type === 'think' ? 'thinking-content' : 'normal-content'
      htmlParts.push(`<div class="${className}">${markdownToHtml(segment.content)}</div>`)
    } else if (segment.type === 'toolUsing') {
      const tu = segment as ToolUsingSegment
      const toolName = tu.json.tool
      // 隐藏列表跳过
      if (hideToolList.includes(toolName)) return

      // 若已存在对应结果，隐藏调用块
      const key = `${toolName}:${stableStringify(tu.json.arguments)}`
      if (doneKeySet.has(key)) return

      const displayName = toolMapping[toolName] || toolName
      htmlParts.push(
        `<details class="tool-call-block tool-call-loading">
           <summary class="tool-call-header cursor-pointer select-none">🔧 调用工具: ${escape(displayName)}</summary>
           <pre class="tool-call-content">${escape(segment.content)}</pre>
         </details>`
      )
    } else if (segment.type === 'toolDone') {
      const toolDone = segment as ToolDoneSegment
      const toolNameForCheck = toolDone.parsedParams?.tool
      if (toolNameForCheck && hideToolList.includes(toolNameForCheck)) return

      const isError = toolDone.json.is_error === true || toolDone.json.is_error === 'true'
      const statusClass = isError ? 'tool-call-error' : 'tool-call-success'
      const statusIcon = isError ? '❌' : '✅'
      // 解析工具名称并做映射，若无法解析则回退为"工具"
      const rawToolName = toolDone.parsedParams?.tool || ''
      const displayToolName = rawToolName ? (toolMapping[rawToolName] || rawToolName) : '工具'

      htmlParts.push(
        `<details class="tool-call-block ${statusClass}">
           <summary class="tool-call-header cursor-pointer select-none">${statusIcon} ${escape(displayToolName)}工具执行${isError ? '失败' : '完成'}</summary>
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
    return `<div class="safe-iframe-wrapper" data-src="${safeUrl}"><div class="safe-iframe-loading">加载中...</div></div>`
  })

  // 使用 markdown-it 对剩余文本进行渲染
  let html = md.render(preProcessed)

  html = html.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, (_: string, url: string) => {
    const safeUrl = escape(url)
    return `<div class="safe-iframe-wrapper" data-src="${safeUrl}"><div class="safe-iframe-loading">加载中...</div></div>`
  })

  // Mermaid 代码块 → 保留源码，交由 mermaid.js 解析
  // 兼容前方新增的 figure.wrap
  html = html.replace(/<pre[^>]*><code[^>]*class="[^"]*language-mermaid[^"]*"[^>]*>([\s\S]*?)<\/code><\/pre>/g, (_m, code) => {
    return `<div class="mermaid">${code}</div>`
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
