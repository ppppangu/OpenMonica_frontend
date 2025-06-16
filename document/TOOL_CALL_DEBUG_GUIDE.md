# 🔧 Tool Call Debug Guide

## Problem Summary

Tool calls are stuck in "Executing..." status and never transition to "Done" or "Error" states, even when the backend returns proper tool results.

## Debugging Tools Added

### 1. **Browser Console Functions** (Development Mode)

```javascript
// Test tool call parsing logic
window.testToolCallParsing()

// Comprehensive debug report
window.debugToolCallIssues()

// Clear all tool call states
window.clearAllStates()

// Access stores directly
window.toolCallsStore
window.chatContentsStore
```

### 2. **Debug Test Page**

Open `http://localhost:5174/tool-call-debug.html` to test parsing logic in isolation.

### 3. **Enhanced Logging**

Added detailed console logging for:
- Tool call detection during streaming
- Tool result parsing attempts
- Status update operations
- Message key matching

## Debugging Steps

### Step 1: Check Current State

```javascript
// Run this in browser console
window.debugToolCallIssues()
```

This will show:
- Current tool calls and their statuses
- Current chat messages
- Parsing results for each message
- Stuck tool calls (still "invoking")

### Step 2: Test Parsing Logic

```javascript
// Test with your specific example
window.testToolCallParsing()
```

### Step 3: Monitor Streaming

1. Open browser console
2. Send a message that triggers tool calls
3. Watch for these log messages:
   - `🔧 Tool call detected in streaming content`
   - `✅ Tool result detected in streaming content`
   - `🔄 Updating tool call status`

## Potential Root Causes

### 1. **Message Key Mismatch**

**Problem**: Tool calls and results have different message keys.

**Check**: Look for logs like:
```
❌ No matching tool call found for result
```

**Fix**: Ensure consistent message key generation between:
- Tool call creation (during streaming)
- Tool result processing (during streaming)

### 2. **Timing Issues**

**Problem**: Tool results arrive before tool calls are created.

**Check**: Look for tool results without corresponding tool calls.

**Fix**: Add buffering or retry logic for tool results.

### 3. **Content Format Issues**

**Problem**: Tool results are not in expected JSON format.

**Check**: Look for parsing errors in console.

**Fix**: Update parsing logic to handle different formats.

### 4. **Streaming vs. Historical Processing**

**Problem**: Different processing paths for streaming vs. historical messages.

**Check**: Compare behavior between:
- New streaming messages
- Historical chat messages

## Expected Backend Response Format

```json
{
  "params": {
    "tool": "create_wordcloud_chart",
    "arguments": {"text": "猫咪 狗勾 兔子 仓鼠 宠物 可爱 毛茸茸"}
  },
  "tool_response": "Tool execution result:【create_wordcloud_chart】 http://1.tcp.cpolar.cn:21729/publicfiles/subserver/charts/wordcloud_642510ee-eecb-4d64-9895-1c397d2eb295_artifacts.html",
  "is_error": false
}
```

## Common Issues and Fixes

### Issue 1: Tool Results Not Detected

**Symptoms**: No "Tool result detected" logs

**Possible Causes**:
- Tool results are wrapped in `{"content": "..."}` format
- Tool results are sent as separate SSE events
- JSON parsing fails due to formatting

**Debug**:
```javascript
// Check raw streaming content
window.chatContentsStore.currentChatMessages.forEach(msg => {
  console.log('Message content:', msg.content);
  console.log('Tool result parse:', window.toolCallsStore.parseToolResultFromContent(msg.content));
});
```

### Issue 2: Message Key Mismatch

**Symptoms**: "No matching tool call found" warnings

**Possible Causes**:
- Different message key generation logic
- Tool calls created with one key, results processed with another

**Debug**:
```javascript
// Check message keys
window.debugToolCallIssues()
// Look for mismatched messageKey values
```

### Issue 3: Duplicate Tool Call Creation

**Symptoms**: Multiple tool calls for same tool

**Possible Causes**:
- Tool call detection running multiple times
- Caching not working properly

**Debug**:
```javascript
// Check for duplicates
window.toolCallsStore.toolCalls.forEach((call, id) => {
  console.log(`${id}: ${call.toolName} - ${call.status}`);
});
```

## Quick Fixes to Try

### Fix 1: Force Tool Call Completion

```javascript
// Manually complete stuck tool calls
Array.from(window.toolCallsStore.toolCalls.values())
  .filter(call => call.status === 'invoking')
  .forEach(call => {
    window.toolCallsStore.updateToolCallStatus(
      call.id, 
      'done', 
      'Manual completion for testing'
    );
  });
```

### Fix 2: Test with Mock Data

```javascript
// Create and complete a test tool call
const testKey = 'manual_test_' + Date.now();
const callId = window.toolCallsStore.createToolCall(
  testKey, 
  'create_wordcloud_chart', 
  {text: 'test'}
);

// Complete it
window.toolCallsStore.updateToolCallStatus(
  callId, 
  'done', 
  'Test result'
);

console.log('Test call completed:', window.toolCallsStore.getToolCallById(callId));
```

## Next Steps

1. **Run debugging tools** to identify the specific issue
2. **Check console logs** during tool call execution
3. **Test parsing logic** with actual backend responses
4. **Verify message key consistency** between creation and completion
5. **Monitor streaming behavior** for timing issues

## Files Modified for Debugging

- `src/chat/ChatBox.vue` - Added comprehensive debugging
- `src/chat/ChatFrame.vue` - Enhanced streaming detection
- `tool-call-debug.html` - Standalone test page

## Contact Information

If the issue persists after debugging, provide:
1. Console output from `window.debugToolCallIssues()`
2. Network tab showing actual backend responses
3. Specific tool call that's stuck
4. Browser and environment details
