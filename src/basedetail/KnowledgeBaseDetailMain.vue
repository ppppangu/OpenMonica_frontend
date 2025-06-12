<template>
  <div class="knowledge-detail-main">
    <!-- 主内容布局容器 -->
    <div class="container-main-layout">
      <!-- 左侧文件列表容器 -->
      <div class="container-file-list" ref="fileListContainer">
        <DocumentList />
      </div>

      <!-- 拖拽调整手柄 -->
      <div class="resize-handle" ref="resizeHandle"></div>

      <!-- 右侧预览容器 -->
      <div class="container-preview">
        <DocumentPreview />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DocumentList from './DocumentList.vue'
import DocumentPreview from './DocumentPreview.vue'

defineOptions({ name: 'KnowledgeBaseDetailMain' })

// Template refs
const fileListContainer = ref<HTMLElement>()
const resizeHandle = ref<HTMLElement>()

// Resize functionality
let isResizing = false

const handleMouseDown = () => {
  isResizing = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing || !fileListContainer.value) return

  const containerRect = document.querySelector('.container-main-layout')?.getBoundingClientRect()
  if (!containerRect) return

  const newWidth = e.clientX - containerRect.left

  // 限制宽度范围
  if (newWidth >= 320 && newWidth <= 500) {
    fileListContainer.value.style.width = newWidth + 'px'
  }
}

const handleMouseUp = () => {
  if (isResizing) {
    isResizing = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
}

onMounted(() => {
  if (resizeHandle.value) {
    resizeHandle.value.addEventListener('mousedown', handleMouseDown)
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  if (resizeHandle.value) {
    resizeHandle.value.removeEventListener('mousedown', handleMouseDown)
  }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.knowledge-detail-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.container-main-layout {
  flex: 1;
  display: flex;
  height: 100%;
  position: relative;
}

.container-file-list {
  width: 380px;
  min-width: 320px;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background: #fafbfc;
  flex-shrink: 0;
}

.resize-handle {
  width: 4px;
  background: transparent;
  cursor: col-resize;
  position: relative;
  z-index: 10;
  transition: background-color 0.2s ease;
}

.resize-handle:hover {
  background: #7c3aed;
}

.resize-handle::before {
  content: '';
  position: absolute;
  top: 0;
  left: -2px;
  right: -2px;
  bottom: 0;
  background: transparent;
}

.container-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  min-width: 0;
}
</style>
