import { escape } from 'lodash-es'

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
  let currentType: "think" | "normal" = "normal"

  segments.forEach((segment) => {
    if (segment.type === "think" || segment.type === "normal") {
      currentType = segment.type
      const className = segment.type === "think" ? "thinking-content" : "normal-content"
      htmlParts.push(`<div class="${className}">${markdownToHtml(segment.content)}</div>`)
    } else if (segment.type === "toolUsing") {
      htmlParts.push(
        `<div class="tool-call-block tool-call-loading">
          <div class="tool-call-header">🔧 调用工具: ${escape((segment as ToolUsingSegment).json.tool)}</div>
          <pre class="tool-call-content">${escape(segment.content)}</pre>
        </div>`
      )
    } else if (segment.type === "toolDone") {
      const toolDone = segment as ToolDoneSegment
      const isError = toolDone.json.is_error === true || toolDone.json.is_error === "true"
      const statusClass = isError ? "tool-call-error" : "tool-call-success"
      const statusIcon = isError ? "❌" : "✅"
      
      htmlParts.push(
        `<div class="tool-call-block ${statusClass}">
          <div class="tool-call-header">${statusIcon} 工具执行${isError ? '失败' : '完成'}</div>
          <div class="tool-call-result">${escape(toolDone.json.tool_response)}</div>
        </div>`
      )
    }
  })

  return htmlParts.join('\n')
}

// Simple markdown to HTML conversion
function markdownToHtml(text: string): string {
  // Basic markdown conversions
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')

  // Handle URLs in <url> tags
  html = html.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, (_, url) => {
    const safeUrl = escape(url)
    return `<iframe src="${safeUrl}" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" style="width:100%;height:300px;"></iframe>`
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
