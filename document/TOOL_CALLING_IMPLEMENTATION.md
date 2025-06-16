# 🍒 Cherry Studio Style Tool Calling Implementation

## Overview

This document describes the complete rewrite of the chatbox component to implement tool calling functionality similar to Cherry Studio, adapted for Vue 3 + Ant Design Vue + Pinia architecture.

## 🎯 Implementation Goals

✅ **Backend Integration**: Maintain existing backend calling approach and data storage methods
✅ **UI State Management**: Implement tool calling interface with `invoking`, `done`, `error` states
✅ **Collapsible Interface**: Use Ant Design Vue's Collapse component for expandable sections
✅ **Status Indicators**: Display tool name and status with appropriate icons
✅ **Cherry Studio Compatibility**: Same user experience with Vue 3 adaptation

## 📁 Files Modified/Created

### New Files

#### `src/store/tool_calls.ts`

- **Purpose**: Pinia store for tool call state management
- **Key Features**:
  - Tool call state interface with `invoking`, `done`, `error` statuses
  - Parsing utilities for your specific JSON format: `{"tool": "tool_name", "arguments": {...}}`
  - Support for newline characters within JSON
  - Message-based tool call grouping
  - Expansion state management

#### `src/components/ToolCallInterface.vue`

- **Purpose**: Main tool calling UI component
- **Key Features**:
  - Ant Design Vue Collapse component integration
  - Status indicators with LoadingOutlined, CheckOutlined, WarningOutlined
  - Collapsible tool response sections
  - JSON argument display with syntax highlighting
  - Markdown rendering for tool results
  - Cherry Studio-inspired styling

### Modified Files

#### `src/chat/ChatBox.vue`

- **Changes**:
  - Integrated new tool calling interface
  - Enhanced message renderer with tool call detection
  - Removed old tool execution logic
  - Added tool calls store integration
  - Updated message processing to use new system

#### `src/chat/ChatFrame.vue`

- **Changes**:
  - Enhanced SSE parsing for tool call detection
  - Real-time tool call state updates during streaming
  - Integration with tool calls store
  - Proper handling of tool call initiation and completion

## 🔧 Technical Architecture

### Tool Call State Flow

```
1. User sends message → Backend processes → Streaming response begins
2. SSE parsing detects tool call JSON → Creates tool call with 'invoking' status
3. Tool execution completes → Updates status to 'done' or 'error'
4. UI automatically updates with collapsible interface
```

### Data Structure

```typescript
interface ToolCallState {
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
```

### JSON Format Support

Your specific tool call format is fully supported:

```json
{"tool": "tool_name", "arguments": {"param1": "value1"}}
```

The parser handles:

- Newline characters within JSON
- Streaming JSON across multiple SSE chunks
- Tool result detection and status updates

## 🎨 UI Components

### Status Indicators

- **Invoking**: 🔄 LoadingOutlined (blue, spinning)
- **Done**: ✅ CheckOutlined (green)
- **Error**: ⚠️ WarningOutlined (red)

### Collapsible Sections

- **Header**: Tool name, status, expand/collapse button
- **Arguments**: JSON display with syntax highlighting
- **Result**: Markdown-rendered tool output or error message

### Styling

- Cherry Studio-inspired color scheme
- Purple theme (#7c3aed, #8b5cf6, #6d28d9)
- Modern rounded corners and subtle shadows
- Smooth transitions and hover effects

## 🚀 Usage

### For Users

1. Send a message that triggers tool calls
2. Watch for collapsible tool call interfaces to appear
3. Click headers to expand/collapse tool details
4. View real-time status updates: invoking → done/error

### For Developers

```typescript
// Access tool calls store
const toolCallsStore = useToolCallsStore()

// Get tool calls for a message
const toolCalls = toolCallsStore.getToolCallsByMessageKey(messageKey)

// Create a tool call
const id = toolCallsStore.createToolCall(messageKey, toolName, arguments)

// Update tool call status
toolCallsStore.updateToolCallStatus(id, 'done', result)
```

## 🔍 Testing

### Development Server

```bash
npm run dev
# Navigate to http://localhost:5174/tool-call-test.html
```

### Debug Functions (Development Only)

```javascript
// Clear all tool calls
window.clearToolCalls()

// Access tool calls store
window.toolCallsStore
```

## 🎯 Key Benefits

1. **Seamless Integration**: Works with existing backend API structure
2. **Real-time Updates**: Tool calls update during streaming responses
3. **User-friendly**: Collapsible interface reduces visual clutter
4. **Maintainable**: Modular architecture with clear separation of concerns
5. **Extensible**: Easy to add new tool call features or modify styling

## 🔄 Migration from Old System

The old tool execution system has been completely replaced:

- ❌ Old: Separate tool execution bubbles with custom rendering
- ✅ New: Integrated tool call interface within message bubbles
- ❌ Old: Manual tool execution detection patterns
- ✅ New: Centralized parsing utilities in Pinia store
- ❌ Old: Hard-coded tool execution UI
- ✅ New: Flexible, component-based tool call interface

## 🚀 Enhanced Implementation (Latest Update)

### Backend Response Format Support

The tool calling system now properly handles your specific backend response format:

```json
{
  "params": {
    "tool": "tool_name",
    "arguments": {}
  },
  "tool_response": "actual result content",
  "is_error": true/false
}
```

### Key Enhancements Made

#### 1. **Enhanced Response Parsing** (`src/store/tool_calls.ts`)

- Updated `parseToolResultFromContent` to handle nested `params` structure
- Extracts tool name from `params.tool` instead of root level
- Proper handling of `tool_response` field
- Comprehensive logging for debugging

#### 2. **Smart Tool Call Matching**

- New `findBestMatchingToolCall` function for robust tool identification
- Prioritizes invoking tool calls when matching results
- Fallback mechanisms for edge cases
- Better error handling and logging

#### 3. **Enhanced Visual Effects** (`src/components/ToolCallInterface.vue`)

- Cherry Studio-style animations and transitions
- Status-specific animations: pulse (invoking), checkmark (done), shake (error)
- Enhanced styling with gradients and shadows
- Improved hover effects and visual feedback

#### 4. **Improved SSE Integration** (`src/chat/ChatFrame.vue`)

- Better tool call matching during streaming
- Enhanced error handling and logging
- Proper status transition management
- Robust handling of multiple tool calls

### Visual State Progression

```
1. Tool Call Detected → "invoking" status (blue, spinning animation)
2. Backend Response → Parse nested JSON format
3. Status Update → "done" (green checkmark) or "error" (red warning)
4. UI Transition → Smooth animation with visual feedback
```

### Debug Features

Development mode includes enhanced debugging:

- Comprehensive console logging
- Global debug functions: `window.clearToolCalls()`, `window.toolCallsStore`
- Detailed status transition tracking
- Error condition monitoring

## 📋 Future Enhancements

Potential improvements for future versions:

- [ ] Tool call retry functionality
- [ ] Tool call history and analytics
- [ ] Custom tool call templates
- [ ] Tool call performance metrics
- [ ] Advanced error handling and recovery
- [ ] Tool call caching and optimization

## 🎉 Conclusion

This enhanced implementation successfully provides Cherry Studio-style tool calling functionality with proper support for your backend's response format. The system now handles the complete tool call lifecycle from detection through completion with smooth visual transitions and robust error handling. The modular design ensures easy maintenance and future enhancements.
