<template>
  <div class="knowledge-graph-header">
    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <a href="/src/knowledgebase/knowledgebase.html">知识库</a>
      <span class="breadcrumb-separator">/</span>
      <a href="/src/basedetail/basedetail.html" v-if="activeKnowledgeBase">
        {{ activeKnowledgeBase.name }}
      </a>
      <span class="breadcrumb-separator">/</span>
      <span>知识图谱</span>
    </div>

    <!-- 标题和操作 -->
    <div class="header-content">
      <div class="header-left">
        <h1 class="graph-title">
          <span class="material-icons">account_tree</span>
          知识图谱
        </h1>
        <p class="graph-subtitle" v-if="activeKnowledgeBase">
          {{ activeKnowledgeBase.name }} - 文档关系可视化
        </p>
      </div>

      <div class="header-right">
        <a-space>
          <!-- 返回按钮 -->
          <a-button @click="goBack">
            <template #icon>
              <span class="material-icons">arrow_back</span>
            </template>
            返回
          </a-button>

          <!-- 生成图谱按钮 -->
          <a-button 
            type="primary" 
            @click="generateGraph"
            :loading="isGenerating"
            :disabled="!activeKnowledgeBase"
          >
            <template #icon>
              <span class="material-icons">auto_graph</span>
            </template>
            {{ isGenerating ? '生成中...' : '生成图谱' }}
          </a-button>

          <!-- 刷新按钮 -->
          <a-button @click="refreshGraph" :loading="isLoading">
            <template #icon>
              <span class="material-icons">refresh</span>
            </template>
          </a-button>

          <!-- 导出按钮 -->
          <a-dropdown>
            <a-button>
              <template #icon>
                <span class="material-icons">download</span>
              </template>
              导出
              <template #suffix>
                <span class="material-icons">expand_more</span>
              </template>
            </a-button>
            <template #overlay>
              <a-menu @click="handleExport">
                <a-menu-item key="png">
                  <span class="material-icons">image</span>
                  导出为 PNG
                </a-menu-item>
                <a-menu-item key="svg">
                  <span class="material-icons">code</span>
                  导出为 SVG
                </a-menu-item>
                <a-menu-item key="json">
                  <span class="material-icons">data_object</span>
                  导出数据 (JSON)
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </div>
    </div>

    <!-- 状态信息 -->
    <div class="status-bar" v-if="graphStats || error">
      <div class="status-left">
        <a-space v-if="graphStats">
          <a-tag color="blue">
            <span class="material-icons">description</span>
            {{ graphStats.totalDocuments }} 个文档
          </a-tag>
          <a-tag color="green">
            <span class="material-icons">label</span>
            {{ graphStats.totalTags }} 个标签
          </a-tag>
          <a-tag color="purple">
            <span class="material-icons">link</span>
            {{ graphStats.totalConnections }} 个连接
          </a-tag>
        </a-space>
      </div>

      <div class="status-right">
        <a-alert 
          v-if="error" 
          :message="error" 
          type="error" 
          show-icon 
          closable
          @close="clearError"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { message } from 'ant-design-vue'
import { useKnowledgeBaseStore } from '../store/knowledgebase_list'
import { useKnowledgeGraphStore } from '../store/knowledge_graph'

defineOptions({ name: 'KnowledgeGraphHeader' })

// Stores
const knowledgeBaseStore = useKnowledgeBaseStore()
const graphStore = useKnowledgeGraphStore()

// Computed
const activeKnowledgeBase = computed(() => knowledgeBaseStore.activeKnowledgeBaseItem)
const isLoading = computed(() => graphStore.isLoading)
const isGenerating = computed(() => graphStore.isGenerating)
const graphStats = computed(() => graphStore.graphStats)
const error = computed(() => graphStore.error)

// Methods
function goBack() {
  // 返回到知识库详情页面
  const knowledgeBaseId = activeKnowledgeBase.value?.id
  if (knowledgeBaseId) {
    window.location.href = `/src/basedetail/basedetail.html?id=${knowledgeBaseId}`
  } else {
    window.location.href = '/src/knowledgebase/knowledgebase.html'
  }
}

async function generateGraph() {
  try {
    const success = await graphStore.generateGraph()
    if (success) {
      message.success('知识图谱生成成功')
    } else {
      message.error('知识图谱生成失败')
    }
  } catch (error) {
    console.error('生成图谱失败:', error)
    message.error('生成图谱失败，请稍后重试')
  }
}

async function refreshGraph() {
  try {
    const success = await graphStore.fetchGraph()
    if (success) {
      message.success('图谱数据已刷新')
    } else {
      message.warning('使用本地模拟数据')
    }
  } catch (error) {
    console.error('刷新图谱失败:', error)
    message.error('刷新图谱失败，请稍后重试')
  }
}

function handleExport({ key }: { key: string }) {
  switch (key) {
    case 'png':
      exportAsPNG()
      break
    case 'svg':
      exportAsSVG()
      break
    case 'json':
      exportAsJSON()
      break
  }
}

function exportAsPNG() {
  // 实现PNG导出
  const svg = document.querySelector('.graph-svg-container svg') as SVGElement
  if (!svg) {
    message.error('未找到图谱数据')
    return
  }

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const data = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      
      const link = document.createElement('a')
      link.download = `knowledge-graph-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      message.success('PNG 导出成功')
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)))
  } catch (error) {
    console.error('PNG导出失败:', error)
    message.error('PNG 导出失败')
  }
}

function exportAsSVG() {
  // 实现SVG导出
  const svg = document.querySelector('.graph-svg-container svg') as SVGElement
  if (!svg) {
    message.error('未找到图谱数据')
    return
  }

  try {
    const data = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([data], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = `knowledge-graph-${Date.now()}.svg`
    link.href = url
    link.click()
    
    URL.revokeObjectURL(url)
    message.success('SVG 导出成功')
  } catch (error) {
    console.error('SVG导出失败:', error)
    message.error('SVG 导出失败')
  }
}

function exportAsJSON() {
  // 实现JSON导出
  const graphData = graphStore.graphData
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    message.error('未找到图谱数据')
    return
  }

  try {
    const data = JSON.stringify(graphData, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = `knowledge-graph-data-${Date.now()}.json`
    link.href = url
    link.click()
    
    URL.revokeObjectURL(url)
    message.success('JSON 数据导出成功')
  } catch (error) {
    console.error('JSON导出失败:', error)
    message.error('JSON 数据导出失败')
  }
}

function clearError() {
  graphStore.clearError()
}
</script>

<style scoped>
.knowledge-graph-header {
  width: 100%;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #6b7280;
}

.breadcrumb a {
  color: #7c3aed;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #d1d5db;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-left {
  flex: 1;
}

.graph-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.graph-title .material-icons {
  font-size: 28px;
  color: #7c3aed;
}

.graph-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-right {
  flex-shrink: 0;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
}

.status-left {
  flex: 1;
}

.status-right {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .status-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .graph-title {
    font-size: 20px;
  }
}

/* 按钮图标样式 */
:deep(.ant-btn .material-icons) {
  font-size: 16px;
  margin-right: 4px;
}

/* 标签图标样式 */
:deep(.ant-tag .material-icons) {
  font-size: 14px;
  margin-right: 4px;
}

/* 菜单图标样式 */
:deep(.ant-menu-item .material-icons) {
  font-size: 16px;
  margin-right: 8px;
}
</style>
