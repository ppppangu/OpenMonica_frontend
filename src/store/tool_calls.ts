import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ToolCallArguments {
  [key: string]: any
}

export interface ToolCallState {
  id: string
  toolName: string
  arguments: ToolCallArguments
  status: 'invoking' | 'done' | 'error'
  result?: string
  error?: string
  timestamp: string
  messageKey: string
  isExpanded: boolean
}

export const useToolCallsStore = defineStore('toolCalls', () => {
  // Tool calls state
  const toolCalls = ref<Map<string, ToolCallState>>(new Map())
  
  // Non-reactive getters to prevent infinite loops
  function getToolCallsByMessageKey(messageKey: string): ToolCallState[] {
    return Array.from(toolCalls.value.values())
      .filter(call => call.messageKey === messageKey)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  function getToolCallById(id: string): ToolCallState | undefined {
    return toolCalls.value.get(id)
  }

  // Keep this as computed since it's used for reactive UI updates
  const hasActiveToolCalls = computed(() => {
    return Array.from(toolCalls.value.values()).some(call => call.status === 'invoking')
  })

  // Actions
  function createToolCall(
    messageKey: string,
    toolName: string,
    arguments_: ToolCallArguments
  ): string {
    const id = `${messageKey}_${toolName}_${Date.now()}`
    const toolCall: ToolCallState = {
      id,
      toolName,
      arguments: arguments_,
      status: 'invoking',
      timestamp: new Date().toISOString(),
      messageKey,
      isExpanded: false
    }

    // Force reactivity by creating a new Map
    const newMap = new Map(toolCalls.value)
    newMap.set(id, toolCall)
    toolCalls.value = newMap

    console.log('✅ Tool call created:', {
      id: toolCall.id,
      toolName: toolCall.toolName,
      messageKey: toolCall.messageKey,
      status: toolCall.status,
      timestamp: toolCall.timestamp
    })
    return id
  }

  function updateToolCallStatus(
    id: string,
    status: 'done' | 'error',
    result?: string,
    error?: string
  ): void {
    const toolCall = toolCalls.value.get(id)
    if (toolCall) {
      const previousStatus = toolCall.status

      // Create a new object to ensure reactivity
      const updatedToolCall: ToolCallState = {
        ...toolCall,
        status,
        result: result !== undefined ? result : toolCall.result,
        error: error !== undefined ? error : toolCall.error
      }

      // Force reactivity by creating a new Map
      const newMap = new Map(toolCalls.value)
      newMap.set(id, updatedToolCall)
      toolCalls.value = newMap

      console.log('🔄 Tool call status updated:', {
        id: updatedToolCall.id,
        toolName: updatedToolCall.toolName,
        previousStatus,
        newStatus: status,
        hasResult: !!result,
        hasError: !!error,
        resultLength: result?.length || 0
      })
    } else {
      console.warn('⚠️ Attempted to update non-existent tool call:', id)
    }
  }

  function toggleToolCallExpansion(id: string): void {
    const toolCall = toolCalls.value.get(id)
    if (toolCall) {
      // Create a new object to ensure reactivity
      const updatedToolCall: ToolCallState = {
        ...toolCall,
        isExpanded: !toolCall.isExpanded
      }

      // Force reactivity by creating a new Map
      const newMap = new Map(toolCalls.value)
      newMap.set(id, updatedToolCall)
      toolCalls.value = newMap

      console.log('🔄 Tool call expansion toggled:', {
        id: updatedToolCall.id,
        toolName: updatedToolCall.toolName,
        isExpanded: updatedToolCall.isExpanded
      })
    }
  }

  function clearToolCallsForMessage(messageKey: string): void {
    const keysToDelete: string[] = []
    for (const [id, toolCall] of toolCalls.value.entries()) {
      if (toolCall.messageKey === messageKey) {
        keysToDelete.push(id)
      }
    }
    keysToDelete.forEach(key => toolCalls.value.delete(key))
    console.log(`Cleared ${keysToDelete.length} tool calls for message: ${messageKey}`)
  }

  function clearAllToolCalls(): void {
    toolCalls.value.clear()
    console.log('All tool calls cleared')
  }

  // Enhanced tool call matching for results
  function findBestMatchingToolCall(
    messageKey: string,
    toolName: string,
    preferInvoking: boolean = true
  ): ToolCallState | null {
    const existingCalls = getToolCallsByMessageKey(messageKey)

    if (existingCalls.length === 0) {
      console.warn('🔍 No tool calls found for message:', messageKey)
      return null
    }

    // First, try to find invoking calls with matching tool name
    if (preferInvoking) {
      const invokingCalls = existingCalls
        .filter(call => call.toolName === toolName && call.status === 'invoking')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      if (invokingCalls.length > 0) {
        console.log('🎯 Found invoking tool call match:', invokingCalls[0].id)
        return invokingCalls[0]
      }
    }

    // Fallback: find any call with matching tool name
    const anyMatchingCalls = existingCalls
      .filter(call => call.toolName === toolName)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    if (anyMatchingCalls.length > 0) {
      console.log('🔄 Found fallback tool call match:', anyMatchingCalls[0].id)
      return anyMatchingCalls[0]
    }

    console.warn('❌ No matching tool call found:', {
      messageKey,
      toolName,
      existingCalls: existingCalls.map(call => ({
        id: call.id,
        toolName: call.toolName,
        status: call.status
      }))
    })
    return null
  }

  // Tool call parsing utilities
  function parseToolCallFromContent(content: string): {
    toolName: string
    arguments: ToolCallArguments
  } | null {
    if (!content || typeof content !== 'string') {
      return null
    }

    try {
      console.log('🔍 Parsing tool call from content:', {
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + '...'
      })

      // Handle your specific format: {"tool": "tool_name", "arguments": {"param1": "value1"}}
      // Support newlines within JSON and more flexible spacing
      const jsonMatch = content.match(/\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{.*?\})\s*\}/s)
      if (jsonMatch) {
        const toolName = jsonMatch[1]
        const argumentsStr = jsonMatch[2]
        const arguments_ = JSON.parse(argumentsStr)

        console.log('✅ Tool call parsed via regex:', {
          toolName,
          arguments: arguments_
        })

        return { toolName, arguments: arguments_ }
      }

      // Fallback: try to parse the entire content as JSON
      const parsed = JSON.parse(content.trim())
      if (parsed.tool && parsed.arguments !== undefined) {
        console.log('✅ Tool call parsed via JSON:', {
          toolName: parsed.tool,
          arguments: parsed.arguments
        })

        return {
          toolName: parsed.tool,
          arguments: parsed.arguments
        }
      }
    } catch (error) {
      // Only log if content looks like it might be a tool call
      if (content.includes('"tool"') || content.includes('"arguments"')) {
        console.warn('⚠️ Failed to parse potential tool call from content:', {
          error: error instanceof Error ? error.message : error,
          contentPreview: content.substring(0, 100) + '...'
        })
      }
    }
    return null
  }

  function parseToolResultFromContent(content: string): {
    toolName: string
    result: string
    isError: boolean
  } | null {
    if (!content || typeof content !== 'string') {
      return null
    }

    try {
      console.log('🔍 Parsing tool result from content:', {
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + '...'
      })

      // Try to parse tool result/completion patterns
      const parsed = JSON.parse(content.trim())

      // Handle your specific backend format:
      // {
      //   "params": {
      //     "tool": "tool_name",
      //     "arguments": {}
      //   },
      //   "tool_response": "actual result content",
      //   "is_error": true/false
      // }
      if (parsed.params && parsed.params.tool && parsed.tool_response !== undefined) {
        console.log('🎯 Tool result detected with backend format:', {
          toolName: parsed.params.tool,
          isError: parsed.is_error === true,
          resultLength: parsed.tool_response?.length || 0
        })

        return {
          toolName: parsed.params.tool,
          result: String(parsed.tool_response), // Ensure string
          isError: parsed.is_error === true
        }
      }

      // Fallback: Legacy format support (if needed)
      if (parsed.tool_response !== undefined) {
        console.log('🔄 Tool result detected with legacy format:', {
          toolName: parsed.tool || 'unknown',
          isError: parsed.is_error === true,
          resultLength: parsed.tool_response?.length || 0
        })

        return {
          toolName: parsed.tool || 'unknown',
          result: String(parsed.tool_response), // Ensure string
          isError: parsed.is_error === true
        }
      }
    } catch (error) {
      // Only log if content looks like it might be a tool result
      if (content.includes('"tool_response"') || content.includes('"params"')) {
        console.warn('⚠️ Failed to parse potential tool result from content:', {
          error: error instanceof Error ? error.message : error,
          contentPreview: content.substring(0, 100) + '...'
        })
      }
    }
    return null
  }

  return {
    // State
    toolCalls,
    
    // Getters
    getToolCallsByMessageKey,
    getToolCallById,
    hasActiveToolCalls,
    
    // Actions
    createToolCall,
    updateToolCallStatus,
    toggleToolCallExpansion,
    clearToolCallsForMessage,
    clearAllToolCalls,
    
    // Utilities
    parseToolCallFromContent,
    parseToolResultFromContent,
    findBestMatchingToolCall
  }
})
