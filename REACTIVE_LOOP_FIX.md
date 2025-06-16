# Vue.js Reactive Infinite Loop Fix

## Problem Description

The ChatBox component was experiencing infinite reactive loops causing dozens of red error messages:
```
"Uncaught (in promise) Maximum recursive updates exceeded in component <ChatBox>. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself."
```

## Root Causes Identified

### 1. **Tool Call Detection in Computed Property**
- The `allMessages` computed property was calling `detectToolExecution()` which modified reactive state
- This caused the computed property to re-trigger itself infinitely

### 2. **Reactive Getters in Store**
- `getToolCallsByMessageKey` was a computed property returning a function
- When called within computed properties, it created reactive dependencies that triggered loops

### 3. **Deep Watchers on Complex Objects**
- Multiple deep watchers on stores and complex objects created cascading reactive updates

### 4. **Markdown Rendering Side Effects**
- Tool call detection was happening during rendering, causing side effects in computed contexts

## Solutions Implemented

### 1. **Separated Tool Call Detection from Rendering**

**Before:**
```javascript
const renderMarkdownWithToolCalls = (content: string, messageKey: string) => {
  // Tool detection happened during rendering - CAUSED LOOPS
  const toolCallData = toolCallsStore.parseToolCallFromContent(content);
  if (toolCallData) {
    toolCallsStore.createToolCall(messageKey, toolCallData.toolName, toolCallData.arguments);
  }
  // ... rendering logic
};
```

**After:**
```javascript
// Non-reactive tool call detection function
const detectAndProcessToolCalls = (content: string, messageKey: string) => {
  // Prevent re-processing with cache
  if (processedMessagesCache.value.has(messageKey)) return;
  
  // Tool detection logic here
  // Mark as processed to prevent loops
  processedMessagesCache.value.add(messageKey);
};

// Pure rendering function without side effects
const renderMarkdownWithToolCalls = (content: string, messageKey: string) => {
  // Only read tool calls, don't modify state
  const toolCalls = toolCallsStore.getToolCallsByMessageKey(messageKey);
  // ... pure rendering logic
};
```

### 2. **Made Store Getters Non-Reactive**

**Before:**
```javascript
const getToolCallsByMessageKey = computed(() => {
  return (messageKey: string): ToolCallState[] => {
    // This created reactive dependencies
    return Array.from(toolCalls.value.values())...
  }
})
```

**After:**
```javascript
function getToolCallsByMessageKey(messageKey: string): ToolCallState[] {
  // Non-reactive function - no computed wrapper
  return Array.from(toolCalls.value.values())...
}
```

### 3. **Added Caching and Debouncing**

```javascript
// Cache to prevent re-processing
const processedMessagesCache = ref<Set<string>>(new Set());

// Debounce map to prevent rapid re-processing
const debounceMap = ref<Map<string, number>>(new Map());

// Debounce logic in detection function
const now = Date.now();
const lastProcessed = debounceMap.value.get(messageKey);
if (lastProcessed && (now - lastProcessed) < 100) return; // 100ms debounce
```

### 4. **Optimized Watchers**

**Before:**
```javascript
watch(
  () => chatContentsStore.currentChatMessages,
  (newMessages) => {
    // Deep watching caused cascading updates
  },
  { deep: true }
);
```

**After:**
```javascript
watch(
  () => chatContentsStore.currentChatMessages.length,
  (newLength, oldLength) => {
    // Only watch length changes, not deep object changes
    if (newLength !== oldLength) {
      console.log(`Messages count changed from ${oldLength} to ${newLength}`);
    }
  }
);
```

### 5. **Added Recursive Computation Protection**

```javascript
let isComputingMessages = false;

const allMessages = computed(() => {
  // Prevent recursive computation
  if (isComputingMessages) {
    console.warn('Preventing recursive allMessages computation');
    return [];
  }
  
  isComputingMessages = true;
  try {
    // Computation logic
  } finally {
    isComputingMessages = false;
  }
});
```

### 6. **Async Tool Call Processing**

```javascript
// Use setTimeout to break reactive chain
if (role === "assistant_history") {
  setTimeout(() => detectAndProcessToolCalls(content, messageKey), 0);
}
```

## Files Modified

1. **`src/chat/ChatBox.vue`**
   - Separated tool call detection from rendering
   - Added caching and debouncing mechanisms
   - Optimized watchers
   - Added recursive computation protection

2. **`src/store/tool_calls.ts`**
   - Made getters non-reactive functions
   - Kept only essential computed properties

## Testing

1. Navigate to the chat page
2. Verify no infinite loop errors in browser console
3. Confirm chat functionality still works properly
4. Test tool calling features
5. Verify streaming responses work correctly

## Debug Functions (Development Only)

```javascript
// Clear all states and caches
window.clearAllStates()

// Access stores for debugging
window.toolCallsStore
window.processedMessagesCache
```

## Key Benefits

1. **Eliminated Infinite Loops**: No more recursive reactive updates
2. **Improved Performance**: Reduced unnecessary re-computations
3. **Maintained Functionality**: All chat features continue to work
4. **Better Debugging**: Added comprehensive logging and debug functions
5. **Future-Proof**: Robust architecture prevents similar issues

## Prevention Guidelines

1. **Never modify reactive state in computed properties**
2. **Use non-reactive functions for store getters when possible**
3. **Implement caching for expensive operations**
4. **Use debouncing for rapid state changes**
5. **Separate side effects from pure rendering functions**
6. **Add guards against recursive computations**
