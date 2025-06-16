<template>
  <div
    v-if="visible"
    class="base-popup-overlay"
    :style="overlayStyles"
    @click="handleOverlayClick"
  >
    <div
      :data-popup-id="id"
      class="base-popup-container"
      :class="containerClasses"
      :style="containerStyles"
      @click.stop
    >
      <!-- Header -->
      <div v-if="title || closable" class="base-popup-header">
        <div class="base-popup-title">
          <slot name="title">{{ title }}</slot>
        </div>
        <button
          v-if="closable"
          class="base-popup-close"
          @click="handleClose"
          :disabled="loading"
        >
          <CloseOutlined />
        </button>
      </div>

      <!-- Content -->
      <div class="base-popup-content" :class="{ 'has-header': title || closable }">
        <div v-if="loading" class="base-popup-loading">
          <a-spin size="large" />
          <div class="loading-text">Loading...</div>
        </div>
        <div v-else class="base-popup-body">
          <slot :popup-id="id" :close="handleClose" :cancel="handleCancel" />
        </div>
      </div>

      <!-- Footer -->
      <div v-if="$slots.footer" class="base-popup-footer">
        <slot name="footer" :popup-id="id" :close="handleClose" :cancel="handleCancel" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { CloseOutlined } from '@ant-design/icons-vue'
import { Spin as ASpin } from 'ant-design-vue'

interface Props {
  id: string
  visible: boolean
  title?: string
  width?: number | string
  height?: number | string
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  centered?: boolean
  zIndex?: number
  className?: string
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'cancel'): void
  (e: 'overlay-click'): void
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  maskClosable: true,
  keyboard: true,
  centered: true,
  zIndex: 1000,
  loading: false
})

const emit = defineEmits<Emits>()

// Computed styles
const overlayStyles = computed(() => ({
  zIndex: props.zIndex
}))

const containerStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  return styles
})

const containerClasses = computed(() => {
  const classes = ['base-popup']
  
  if (props.centered) {
    classes.push('base-popup--centered')
  }
  
  if (props.className) {
    classes.push(props.className)
  }
  
  if (props.loading) {
    classes.push('base-popup--loading')
  }
  
  return classes
})

// Event handlers
function handleClose(): void {
  if (!props.loading) {
    emit('close')
  }
}

function handleCancel(): void {
  if (!props.loading) {
    emit('cancel')
  }
}

function handleOverlayClick(): void {
  emit('overlay-click')
  if (props.maskClosable && !props.loading) {
    handleClose()
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (!props.keyboard || !props.visible) return
  
  if (event.key === 'Escape' && props.closable) {
    event.preventDefault()
    handleClose()
  }
}

// Lifecycle
onMounted(() => {
  if (props.keyboard) {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (props.keyboard) {
    document.removeEventListener('keydown', handleKeydown)
  }
})

// Watch for visibility changes to manage body scroll
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })
</script>

<style scoped>
.base-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.base-popup-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s ease;
  position: relative;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.base-popup--centered {
  margin: auto;
}

.base-popup--loading {
  pointer-events: none;
}

.base-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

.base-popup-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.base-popup-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #8c8c8c;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.base-popup-close:hover:not(:disabled) {
  background: #f5f5f5;
  color: #262626;
}

.base-popup-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-popup-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.base-popup-content.has-header {
  border-top: none;
}

.base-popup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  gap: 16px;
}

.loading-text {
  color: #8c8c8c;
  font-size: 14px;
}

.base-popup-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.base-popup-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Purple theme integration */
.base-popup-container {
  border: 2px solid #8b5cf6;
}

.base-popup-header {
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
  border-bottom-color: #ddd6fe;
}

.base-popup-title {
  color: #6d28d9;
}

.base-popup-close:hover:not(:disabled) {
  background: #ddd6fe;
  color: #6d28d9;
}

.base-popup-footer {
  background: #f9fafb;
  border-top-color: #e5e7eb;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .base-popup-container {
    background: #1f1f1f;
    border-color: #8b5cf6;
  }
  
  .base-popup-header {
    background: linear-gradient(135deg, #2d1b69 0%, #1e1b4b 100%);
    border-bottom-color: #4c1d95;
  }
  
  .base-popup-title {
    color: #c4b5fd;
  }
  
  .base-popup-close {
    color: #a1a1aa;
  }
  
  .base-popup-close:hover:not(:disabled) {
    background: #4c1d95;
    color: #c4b5fd;
  }
  
  .base-popup-footer {
    background: #262626;
    border-top-color: #404040;
  }
  
  .loading-text {
    color: #a1a1aa;
  }
}
</style>
