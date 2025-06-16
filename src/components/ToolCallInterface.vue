<template>
  <div class="tool-call-interface">
    <div 
      v-for="toolCall in toolCalls" 
      :key="toolCall.id"
      class="tool-call-item"
    >
      <!-- Tool Call Header -->
      <div class="tool-call-header" @click="toggleExpansion(toolCall.id)">
        <div class="tool-call-status">
          <LoadingOutlined 
            v-if="toolCall.status === 'invoking'" 
            class="status-icon invoking"
            spin
          />
          <CheckOutlined 
            v-else-if="toolCall.status === 'done'" 
            class="status-icon done"
          />
          <WarningOutlined 
            v-else-if="toolCall.status === 'error'" 
            class="status-icon error"
          />
        </div>
        
        <div class="tool-call-info">
          <span class="tool-name">{{ toolCall.toolName }}</span>
          <span class="tool-status-text">
            {{ getStatusText(toolCall.status) }}
          </span>
        </div>
        
        <div class="tool-call-actions">
          <a-button
            v-if="toolCall.status === 'done'"
            size="small"
            type="text"
            @click="showDetailPopup(toolCall)"
            class="detail-button"
            title="Show in popup"
          >
            <ExpandOutlined />
          </a-button>
          <DownOutlined
            :class="['expand-icon', { 'expanded': toolCall.isExpanded }]"
          />
        </div>
      </div>

      <!-- Tool Call Content (Collapsible) -->
      <a-collapse 
        v-model:activeKey="activeKeys"
        :bordered="false"
        class="tool-call-collapse"
      >
        <a-collapse-panel 
          v-if="toolCall.isExpanded"
          :key="toolCall.id"
          :showArrow="false"
          class="tool-call-panel"
        >
          <!-- Tool Arguments -->
          <div class="tool-section">
            <h4 class="section-title">Arguments</h4>
            <div class="arguments-content">
              <pre class="json-display">{{ formatArguments(toolCall.arguments) }}</pre>
            </div>
          </div>

          <!-- Tool Result (if available) -->
          <div v-if="toolCall.result || toolCall.error" class="tool-section">
            <h4 class="section-title">
              {{ toolCall.status === 'error' ? 'Error' : 'Result' }}
            </h4>
            <div class="result-content">
              <div
                v-if="toolCall.status === 'error'"
                class="error-message"
              >
                {{ toolCall.error || toolCall.result || 'Unknown error occurred' }}
              </div>
              <div
                v-else
                class="result-message"
                v-html="renderResult(toolCall.result || '')"
              >
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="toolCall.status === 'invoking'" class="tool-section">
            <div class="loading-content">
              <a-spin size="small" />
              <span class="loading-text">Executing tool...</span>
            </div>
          </div>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  LoadingOutlined,
  CheckOutlined,
  WarningOutlined,
  DownOutlined,
  ExpandOutlined
} from '@ant-design/icons-vue'
import {
  Collapse as ACollapse,
  CollapsePanel as ACollapsePanel,
  Spin as ASpin,
  Button as AButton
} from 'ant-design-vue'
import { useToolCallsStore, type ToolCallState } from '../store/tool_calls'
import markdownit from 'markdown-it'

interface Props {
  messageKey: string
}

const props = defineProps<Props>()

const toolCallsStore = useToolCallsStore()
const md = markdownit({ html: true, breaks: true, linkify: true })

// Active collapse keys for Ant Design Collapse component
const activeKeys = ref<string[]>([])

// Get tool calls for this message
const toolCalls = computed(() => {
  const calls = toolCallsStore.getToolCallsByMessageKey(props.messageKey)
  console.log('🔧 ToolCallInterface computed toolCalls:', {
    messageKey: props.messageKey,
    callsCount: calls.length,
    calls: calls.map((call: ToolCallState) => ({
      id: call.id,
      toolName: call.toolName,
      status: call.status,
      isExpanded: call.isExpanded
    }))
  })
  return calls
})

// Watch for expansion changes and sync with collapse component
watch(
  toolCalls,
  (newToolCalls: ToolCallState[]) => {
    const expandedKeys = newToolCalls
      .filter((call: ToolCallState) => call.isExpanded)
      .map((call: ToolCallState) => call.id)
    activeKeys.value = expandedKeys
  },
  { deep: true, immediate: true }
)

// Methods
function toggleExpansion(toolCallId: string): void {
  toolCallsStore.toggleToolCallExpansion(toolCallId)
}

function getStatusText(status: ToolCallState['status']): string {
  switch (status) {
    case 'invoking':
      return 'Executing...'
    case 'done':
      return 'Completed'
    case 'error':
      return 'Failed'
    default:
      return 'Unknown'
  }
}

function formatArguments(args: any): string {
  return JSON.stringify(args, null, 2)
}

function renderResult(result: string): string {
  try {
    // Try to render as markdown first
    return md.render(result)
  } catch (error) {
    // Fallback to plain text with HTML escaping
    return result.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

async function showDetailPopup(toolCall: ToolCallState): Promise<void> {
  const { usePopupManagerStore } = await import('../store/popup_manager');
  const ToolDetailPopup = await import('./popup/ToolDetailPopup.vue');
  const popupStore = usePopupManagerStore();

  try {
    await popupStore.show({
      component: ToolDetailPopup.default,
      title: `Tool Details: ${toolCall.toolName}`,
      width: 900,
      height: 700,
      className: 'tool-detail-modal',
      props: { toolCall }
    });
  } catch (error) {
    console.log('Tool detail popup cancelled:', error);
  }
}
</script>

<style scoped>
.tool-call-interface {
  margin: 8px 0;
}

.tool-call-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fafafa;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.tool-call-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.tool-call-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  border-bottom: 1px solid #e8e8e8;
  transition: all 0.2s ease;
}

.tool-call-header:hover {
  background: linear-gradient(135deg, #f1f3f4 0%, #e9ecef 100%);
}

.tool-call-status {
  margin-right: 12px;
}

.status-icon {
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.status-icon.invoking {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
  animation: pulse 2s infinite;
}

.status-icon.done {
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  animation: checkmark 0.5s ease-in-out;
}

.status-icon.error {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
  animation: shake 0.5s ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes checkmark {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.tool-call-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tool-name {
  font-weight: 600;
  font-size: 14px;
  color: #262626;
}

.tool-status-text {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.tool-call-actions {
  margin-left: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-button {
  color: #8b5cf6 !important;
  border-color: #8b5cf6 !important;
  transition: all 0.2s ease;
}

.detail-button:hover {
  background: #f3e8ff !important;
  border-color: #7c3aed !important;
  color: #7c3aed !important;
}

.expand-icon {
  font-size: 12px;
  color: #8c8c8c;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.tool-call-collapse {
  background: transparent;
}

.tool-call-collapse :deep(.ant-collapse-item) {
  border: none;
}

.tool-call-collapse :deep(.ant-collapse-content) {
  background: transparent;
  border: none;
}

.tool-call-panel {
  padding: 0;
}

.tool-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.tool-section:last-child {
  border-bottom: none;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #595959;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.arguments-content,
.result-content {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
}

.json-display {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #262626;
  white-space: pre-wrap;
  word-break: break-word;
}

.result-message {
  font-size: 13px;
  line-height: 1.5;
  color: #262626;
}

.error-message {
  font-size: 13px;
  line-height: 1.5;
  color: #ff4d4f;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.loading-text {
  font-size: 13px;
  color: #8c8c8c;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .tool-call-item {
    border-color: #434343;
    background: #1f1f1f;
  }
  
  .tool-call-header {
    background: #262626;
    border-bottom-color: #434343;
  }
  
  .tool-call-header:hover {
    background: #303030;
  }
  
  .tool-name {
    color: #ffffff;
  }
  
  .arguments-content,
  .result-content {
    background: #141414;
    border-color: #434343;
  }
  
  .json-display,
  .result-message {
    color: #ffffff;
  }
  
  .tool-section {
    border-bottom-color: #303030;
  }
}
</style>
