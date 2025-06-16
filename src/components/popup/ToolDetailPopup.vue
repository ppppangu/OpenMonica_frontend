<template>
  <div class="tool-detail-popup">
    <div class="tool-header">
      <div class="tool-status-indicator">
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
      <div class="tool-info">
        <h2 class="tool-name">{{ toolCall.toolName }}</h2>
        <span class="tool-status">{{ getStatusText(toolCall.status) }}</span>
      </div>
      <div class="tool-meta">
        <span class="timestamp">{{ formatTimestamp(toolCall.timestamp) }}</span>
      </div>
    </div>

    <div class="tool-content">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <a-tab-pane key="arguments" tab="Arguments">
          <div class="tab-content">
            <div class="json-viewer">
              <pre class="json-display">{{ formatArguments(toolCall.arguments) }}</pre>
            </div>
            <div class="copy-actions">
              <a-button 
                size="small" 
                @click="copyToClipboard(formatArguments(toolCall.arguments))"
              >
                <CopyOutlined /> Copy Arguments
              </a-button>
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="result" tab="Result" v-if="toolCall.result || toolCall.error">
          <div class="tab-content">
            <div v-if="toolCall.status === 'error'" class="error-section">
              <div class="error-message">
                {{ toolCall.error || toolCall.result || 'Unknown error occurred' }}
              </div>
            </div>
            <div v-else class="result-section">
              <div class="result-viewer">
                <div
                  class="result-content"
                  v-html="renderResult(toolCall.result || '')"
                ></div>
              </div>
            </div>
            <div class="copy-actions">
              <a-button 
                size="small" 
                @click="copyToClipboard(toolCall.result || toolCall.error || '')"
              >
                <CopyOutlined /> Copy {{ toolCall.status === 'error' ? 'Error' : 'Result' }}
              </a-button>
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="raw" tab="Raw Data">
          <div class="tab-content">
            <div class="json-viewer">
              <pre class="json-display">{{ JSON.stringify(toolCall, null, 2) }}</pre>
            </div>
            <div class="copy-actions">
              <a-button 
                size="small" 
                @click="copyToClipboard(JSON.stringify(toolCall, null, 2))"
              >
                <CopyOutlined /> Copy Raw Data
              </a-button>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <div class="tool-actions">
      <a-button @click="$emit('close')">
        Close
      </a-button>
      <a-button 
        v-if="toolCall.status === 'invoking'"
        type="primary" 
        danger
        @click="cancelTool"
      >
        Cancel Tool
      </a-button>
      <a-button 
        v-if="toolCall.status === 'error'"
        type="primary"
        @click="retryTool"
      >
        Retry Tool
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  LoadingOutlined,
  CheckOutlined,
  WarningOutlined,
  CopyOutlined
} from '@ant-design/icons-vue'
import {
  Tabs as ATabs,
  TabPane as ATabPane,
  Button as AButton,
  message
} from 'ant-design-vue'
import { useToolCallsStore, type ToolCallState } from '../../store/tool_calls'
import markdownit from 'markdown-it'

interface Props {
  toolCall: ToolCallState
  popupId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toolCallsStore = useToolCallsStore()
const md = markdownit({ html: true, breaks: true, linkify: true })
const activeTab = ref('arguments')

// Methods
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
    return md.render(result)
  } catch (error) {
    return result.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString()
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    message.success('Copied to clipboard')
  } catch (error) {
    message.error('Failed to copy to clipboard')
  }
}

function cancelTool(): void {
  // Implementation would depend on your backend API
  message.info('Tool cancellation not implemented')
}

function retryTool(): void {
  // Implementation would depend on your backend API
  message.info('Tool retry not implemented')
}

// Static methods for popup management
export async function show(toolCall: ToolCallState): Promise<void> {
  const { usePopupManagerStore } = await import('../../store/popup_manager')
  const popupStore = usePopupManagerStore()
  
  return popupStore.show({
    component: 'ToolDetailPopup',
    title: `Tool Details: ${toolCall.toolName}`,
    width: 900,
    height: 700,
    className: 'tool-detail-modal',
    props: { toolCall }
  })
}
</script>

<style scoped>
.tool-detail-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tool-header {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.tool-status-indicator {
  margin-right: 12px;
}

.status-icon {
  font-size: 20px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon.invoking {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.status-icon.done {
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
}

.status-icon.error {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
}

.tool-info {
  flex: 1;
}

.tool-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.tool-status {
  font-size: 14px;
  color: #8c8c8c;
}

.tool-meta {
  text-align: right;
}

.timestamp {
  font-size: 12px;
  color: #8c8c8c;
}

.tool-content {
  flex: 1;
  overflow: hidden;
}

.tab-content {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.json-viewer,
.result-viewer {
  flex: 1;
  overflow: auto;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
}

.json-display {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  color: #262626;
  white-space: pre-wrap;
  word-break: break-word;
}

.result-content {
  font-size: 14px;
  line-height: 1.6;
  color: #262626;
}

.error-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.error-message {
  flex: 1;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  padding: 16px;
  color: #ff4d4f;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 12px;
}

.copy-actions {
  display: flex;
  justify-content: flex-end;
}

.tool-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
}

/* Purple theme integration */
:deep(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #8b5cf6;
}

:deep(.ant-tabs-ink-bar) {
  background: #8b5cf6;
}

:deep(.ant-tabs-tab:hover .ant-tabs-tab-btn) {
  color: #8b5cf6;
}
</style>
