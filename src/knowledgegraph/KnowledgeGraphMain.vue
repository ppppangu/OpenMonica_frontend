<template>
  <div class="knowledge-graph-main">
    <!-- 图谱可视化组件 -->
    <div class="graph-container">
      <KnowledgeGraphVisualization 
        :knowledge-base-id="knowledgeBaseId"
        :height="graphHeight"
        :width="graphWidth"
      />
    </div>

    <!-- 侧边面板 -->
    <div class="side-panel" v-if="showSidePanel">
      <div class="panel-header">
        <h3>图谱信息</h3>
        <a-button 
          type="text" 
          size="small" 
          @click="toggleSidePanel"
        >
          <template #icon>
            <span class="material-icons">close</span>
          </template>
        </a-button>
      </div>

      <div class="panel-content">
        <!-- 图谱统计 -->
        <div class="stats-section" v-if="graphStats">
          <h4>统计信息</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ graphStats.totalDocuments }}</div>
              <div class="stat-label">文档</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ graphStats.totalTags }}</div>
              <div class="stat-label">标签</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ graphStats.totalConnections }}</div>
              <div class="stat-label">连接</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ graphStats.averageTagsPerDocument?.toFixed(1) }}</div>
              <div class="stat-label">平均标签/文档</div>
            </div>
          </div>
        </div>

        <!-- 热门标签 -->
        <div class="tags-section" v-if="graphStats?.mostConnectedTags">
          <h4>热门标签</h4>
          <div class="tag-list">
            <div 
              v-for="{ tag, count } in graphStats.mostConnectedTags" 
              :key="tag"
              class="tag-item"
            >
              <a-tag 
                color="green" 
                @click="filterByTag(tag)"
                style="cursor: pointer;"
              >
                {{ tag }}
              </a-tag>
              <span class="tag-count">{{ count }}</span>
            </div>
          </div>
        </div>

        <!-- 图例 -->
        <div class="legend-section">
          <h4>图例</h4>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-color document-color"></div>
              <span>文档节点</span>
            </div>
            <div class="legend-item">
              <div class="legend-color tag-color"></div>
              <span>标签节点</span>
            </div>
            <div class="legend-item">
              <div class="legend-line"></div>
              <span>关联关系</span>
            </div>
          </div>
        </div>

        <!-- 操作说明 -->
        <div class="help-section">
          <h4>操作说明</h4>
          <ul class="help-list">
            <li>拖拽节点可以调整位置</li>
            <li>鼠标悬停查看节点信息</li>
            <li>点击节点查看详细信息</li>
            <li>使用鼠标滚轮缩放视图</li>
            <li>拖拽空白区域平移视图</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 浮动操作按钮 -->
    <div class="floating-actions">
      <a-button 
        v-if="!showSidePanel"
        type="primary" 
        shape="circle" 
        size="large"
        @click="toggleSidePanel"
        class="panel-toggle-btn"
      >
        <template #icon>
          <span class="material-icons">info</span>
        </template>
      </a-button>

      <a-button 
        type="default" 
        shape="circle" 
        size="large"
        @click="resetView"
        class="reset-view-btn"
      >
        <template #icon>
          <span class="material-icons">center_focus_strong</span>
        </template>
      </a-button>

      <a-button 
        type="default" 
        shape="circle" 
        size="large"
        @click="toggleFullscreen"
        class="fullscreen-btn"
      >
        <template #icon>
          <span class="material-icons">{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}</span>
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useKnowledgeBaseStore } from '../store/knowledgebase_list'
import { useKnowledgeGraphStore } from '../store/knowledge_graph'
import KnowledgeGraphVisualization from '../components/KnowledgeGraphVisualization.vue'

defineOptions({ name: 'KnowledgeGraphMain' })

// Stores
const knowledgeBaseStore = useKnowledgeBaseStore()
const graphStore = useKnowledgeGraphStore()

// Refs
const showSidePanel = ref(true)
const isFullscreen = ref(false)
const containerRef = ref<HTMLElement>()

// Computed
const knowledgeBaseId = computed(() => {
  // 从URL参数获取知识库ID，或使用当前激活的知识库
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('id') || knowledgeBaseStore.activeKnowledgeBaseItem?.id
})

const graphStats = computed(() => graphStore.graphStats)

const graphHeight = computed(() => {
  // 根据屏幕大小和侧边面板状态计算图谱高度
  const baseHeight = window.innerHeight - 200 // 减去头部和边距
  return Math.max(400, baseHeight)
})

const graphWidth = computed(() => {
  // 根据屏幕大小和侧边面板状态计算图谱宽度
  const baseWidth = window.innerWidth - (showSidePanel.value ? 400 : 100) // 减去侧边栏和面板
  return Math.max(600, baseWidth)
})

// Methods
function toggleSidePanel() {
  showSidePanel.value = !showSidePanel.value
}

function resetView() {
  // 触发图谱组件的重置视图方法
  const event = new CustomEvent('resetView')
  window.dispatchEvent(event)
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function filterByTag(tag: string) {
  graphStore.addSelectedTag(tag)
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function handleResize() {
  // 触发图谱重新计算大小
  setTimeout(() => {
    const event = new CustomEvent('resize')
    window.dispatchEvent(event)
  }, 100)
}

// Lifecycle
onMounted(() => {
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  window.addEventListener('resize', handleResize)

  // 如果有知识库ID，获取图谱数据
  if (knowledgeBaseId.value) {
    // 设置当前激活的知识库（如果从URL参数获取）
    const urlKnowledgeBaseId = new URLSearchParams(window.location.search).get('id')
    if (urlKnowledgeBaseId) {
      // 这里可能需要先获取知识库信息，然后设置为激活状态
      // 暂时直接获取图谱数据
      graphStore.fetchGraph(urlKnowledgeBaseId)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.knowledge-graph-main {
  height: 100%;
  display: flex;
  position: relative;
  background: #f9fafb;
}

.graph-container {
  flex: 1;
  padding: 16px;
  transition: all 0.3s ease;
}

.side-panel {
  width: 320px;
  background: white;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.stats-section,
.tags-section,
.legend-section,
.help-section {
  margin-bottom: 24px;
}

.stats-section h4,
.tags-section h4,
.legend-section h4,
.help-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-count {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #374151;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.document-color {
  background: #8b5cf6;
}

.tag-color {
  background: #10b981;
}

.legend-line {
  width: 20px;
  height: 2px;
  background: #d1d5db;
}

.help-list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: #6b7280;
}

.help-list li {
  margin-bottom: 4px;
}

.floating-actions {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}

.panel-toggle-btn,
.reset-view-btn,
.fullscreen-btn {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .side-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .knowledge-graph-main {
    flex-direction: column;
  }
  
  .side-panel {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid #e5e7eb;
  }
  
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .floating-actions {
    bottom: 16px;
    right: 16px;
  }
}

/* 全屏模式样式 */
:fullscreen .knowledge-graph-main {
  background: white;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
