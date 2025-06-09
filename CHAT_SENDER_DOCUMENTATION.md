# Chat Sender Functionality Documentation

## Overview

The chat sending functionality has been implemented in the `useUserInputStore` to handle sending chat messages to the LLM backend. This implementation supports both single and multiple model requests with proper error handling and authentication.

## Implementation Details

### Core Function: `sendChat()`

Located in `src/store/user_input.ts`, the `sendChat()` function handles the complete chat sending workflow.

#### Key Features:

1. **Authentication**: Uses `user_id` and `token` from the global user store
2. **Model Conversion**: Converts `model_ids` array to model names for backend compatibility
3. **Multiple Model Support**: Handles asynchronous requests when multiple models are selected
4. **Single Model Support**: Handles normal streaming responses for single model selection
5. **Error Handling**: Comprehensive error handling with detailed error messages

### API Endpoint

**Endpoint**: `POST /user/chat`

**Required Parameters**:
- `token`: Authentication token
- `user_id`: User identifier from global state
- `model_id`: Model identifier for the request
- `user_message_list`: Array of user messages (currently sent as empty array `[]`)
- `extra_request_list`: Additional request parameters from user input store

### Usage Example

```typescript
import { useUserInputStore } from '../store/user_input'

const userInputStore = useUserInputStore()

// Set model IDs you want to use
userInputStore.user_input.model_ids = ['model1', 'model2']

// Send chat (full_input_messages is currently empty array as requested)
try {
  const response = await userInputStore.sendChat()
  
  if (Array.isArray(response)) {
    // Multiple models response
    response.forEach(result => {
      if (result.success) {
        console.log(`Model ${result.model} succeeded:`, result.data)
      } else {
        console.error(`Model ${result.model} failed:`, result.error)
      }
    })
  } else {
    // Single model response
    console.log('Single model response:', response)
  }
} catch (error) {
  console.error('Chat sending failed:', error)
}
```

## Response Formats

### Single Model Response
```typescript
{
  // Backend response data
  data: any
}
```

### Multiple Models Response
```typescript
[
  {
    model: string,
    success: boolean,
    data?: any,      // Present if success is true
    error?: string   // Present if success is false
  },
  // ... more results for each model
]
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Authentication Errors**: Throws error if user is not authenticated or token is missing
2. **Model Selection Errors**: Throws error if no valid models are selected
3. **Network Errors**: Catches and handles HTTP errors with proper error messages
4. **Multiple Model Errors**: Individual model failures don't affect other model requests

## Testing

### Test Component: `ChatSender.vue`

A test component has been created at `src/chat/ChatSender.vue` that demonstrates:

- Model selection interface
- Chat sending with status feedback
- Results display for both single and multiple model scenarios
- Error handling and user feedback

### Test Page: `chat_sender_test.html`

A standalone test page is available that includes:
- Component documentation
- Live testing interface
- Feature explanations

## Integration Points

### Required Stores

The chat sender functionality depends on:

1. **`useUserStore`**: For user authentication (`user_id`, `token`)
2. **`useModelListStore`**: For model information and conversion
3. **`useUserInputStore`**: For storing and managing user input data

### Component Integration

To use the chat sender in your components:

```typescript
// In your Vue component
import { useUserInputStore } from '../store/user_input'

const userInputStore = useUserInputStore()

// Set up your data
userInputStore.user_input.model_ids = ['selected_model_id']
userInputStore.user_input.extra_request_list = [] // Optional

// Send chat
const response = await userInputStore.sendChat()
```

## Current Limitations

1. **`full_input_messages`**: Currently sent as empty array `[]` as requested
2. **Streaming**: Single model requests return JSON response, not streaming (can be enhanced later)
3. **Model Names**: Uses `model_id` as model name for backend compatibility

## Future Enhancements

1. **Message History**: Implement proper `full_input_messages` population
2. **Streaming Support**: Add streaming response handling for single model requests
3. **Retry Logic**: Add automatic retry for failed requests
4. **Progress Tracking**: Add progress indicators for multiple model requests
5. **Response Caching**: Cache responses for identical requests

## Files Modified/Created

1. **Modified**: `src/store/user_input.ts` - Added `sendChat()` functionality
2. **Modified**: `src/chat/main.ts` - Added ChatSender component mounting
3. **Created**: `src/chat/ChatSender.vue` - Test component
4. **Created**: `chat_sender_test.html` - Test page
5. **Created**: `CHAT_SENDER_DOCUMENTATION.md` - This documentation

## Backend Compatibility

The implementation follows the existing backend API pattern:
- Uses FormData format for requests
- Includes token authentication
- Follows the same parameter naming as existing endpoints
- Compatible with the current `/user/chat` endpoint structure
