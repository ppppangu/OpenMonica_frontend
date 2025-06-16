<template>
  <div class="test-popup">
    <h2>Popup System Test</h2>
    <p>This is a test popup to verify the popup management system is working correctly.</p>
    
    <div class="test-section">
      <h3>Features Tested:</h3>
      <ul>
        <li>✅ Popup creation and display</li>
        <li>✅ Background click to close (if enabled)</li>
        <li>✅ ESC key to close</li>
        <li>✅ Promise-based communication</li>
        <li>✅ Z-index management</li>
        <li>✅ Keyboard navigation</li>
      </ul>
    </div>

    <div class="test-section">
      <h3>Test Actions:</h3>
      <div class="button-group">
        <a-button @click="showAnotherPopup" type="primary">
          Open Another Popup
        </a-button>
        <a-button @click="showBubbleSettings" type="default">
          Open Bubble Settings
        </a-button>
        <a-button @click="testToolDetail" type="default">
          Test Tool Detail
        </a-button>
      </div>
    </div>

    <div class="test-section">
      <h3>Current State:</h3>
      <pre class="state-display">{{ JSON.stringify(popupState, null, 2) }}</pre>
    </div>

    <div class="test-actions">
      <a-button @click="$emit('cancel')" style="margin-right: 8px;">
        Cancel
      </a-button>
      <a-button @click="$emit('close', 'Test completed successfully')" type="primary">
        Close with Result
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button as AButton } from 'ant-design-vue'
import { usePopupManagerStore } from '../../store/popup_manager'
import { useBubbleSettingsStore } from '../../store/bubble_settings'
import { useToolCallsStore } from '../../store/tool_calls'

interface Props {
  popupId: string
}

interface Emits {
  (e: 'close', result?: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const popupStore = usePopupManagerStore()
const bubbleStore = useBubbleSettingsStore()
const toolStore = useToolCallsStore()

// Computed state for display
const popupState = computed(() => ({
  visiblePopups: popupStore.visiblePopups.length,
  hasKeyboardNav: popupStore.keyboardNavigation,
  bubbleSettings: {
    displayMode: bubbleStore.settings.displayMode,
    theme: bubbleStore.settings.theme,
    animation: bubbleStore.settings.animation
  },
  toolCalls: toolStore.toolCalls.size
}))

// Test functions
async function showAnotherPopup(): Promise<void> {
  try {
    const result = await popupStore.show({
      component: 'div',
      title: 'Nested Test Popup',
      width: 400,
      height: 300,
      props: {
        innerHTML: `
          <div style="padding: 20px; text-align: center;">
            <h3>Nested Popup Test</h3>
            <p>This popup is opened from within another popup.</p>
            <p>Z-index should be higher than the parent popup.</p>
            <button onclick="this.closest('[data-popup-id]').dispatchEvent(new CustomEvent('close'))">
              Close This Popup
            </button>
          </div>
        `
      }
    })
    console.log('Nested popup result:', result)
  } catch (error) {
    console.log('Nested popup cancelled:', error)
  }
}

async function showBubbleSettings(): Promise<void> {
  const { usePopupManagerStore } = await import('../../store/popup_manager')
  const BubbleSettingsPopup = await import('./BubbleSettingsPopup.vue')
  
  const popupStore = usePopupManagerStore()
  
  try {
    const result = await popupStore.show({
      component: BubbleSettingsPopup.default,
      title: 'Bubble Settings from Test',
      width: 600,
      height: 700,
      className: 'bubble-settings-modal'
    })
    console.log('Bubble settings result:', result)
  } catch (error) {
    console.log('Bubble settings cancelled:', error)
  }
}

async function testToolDetail(): Promise<void> {
  // Create a mock tool call for testing
  const mockToolCall = {
    id: 'test_tool_' + Date.now(),
    toolName: 'test_tool',
    arguments: { 
      param1: 'value1', 
      param2: 'value2',
      complexParam: {
        nested: 'data',
        array: [1, 2, 3]
      }
    },
    status: 'done' as const,
    result: '# Test Tool Result\n\nThis is a **markdown** formatted result with:\n\n- List items\n- **Bold text**\n- `code snippets`\n\n```javascript\nconsole.log("Hello, World!");\n```',
    timestamp: new Date().toISOString(),
    messageKey: 'test_message',
    isExpanded: false
  }

  const { usePopupManagerStore } = await import('../../store/popup_manager')
  const ToolDetailPopup = await import('./ToolDetailPopup.vue')
  
  const popupStore = usePopupManagerStore()
  
  try {
    const result = await popupStore.show({
      component: ToolDetailPopup.default,
      title: 'Test Tool Details',
      width: 900,
      height: 700,
      className: 'tool-detail-modal',
      props: { toolCall: mockToolCall }
    })
    console.log('Tool detail result:', result)
  } catch (error) {
    console.log('Tool detail cancelled:', error)
  }
}

// Static methods for popup management
export async function show(): Promise<string> {
  const { usePopupManagerStore } = await import('../../store/popup_manager')
  const popupStore = usePopupManagerStore()
  
  return popupStore.show({
    component: 'TestPopup',
    title: 'Popup System Test',
    width: 700,
    height: 600,
    className: 'test-popup-modal'
  })
}
</script>

<style scoped>
.test-popup {
  padding: 0;
}

.test-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.test-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.test-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.test-section ul {
  margin: 0;
  padding-left: 20px;
}

.test-section li {
  margin-bottom: 4px;
  color: #595959;
}

.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.state-display {
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.4;
  color: #262626;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.test-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

/* Purple theme integration */
:deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-color: #7c3aed;
}

:deep(.ant-btn-primary:hover) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border-color: #6d28d9;
}
</style>
