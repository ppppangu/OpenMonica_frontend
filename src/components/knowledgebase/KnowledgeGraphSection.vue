<template>
  <div class="knowledge-graph-section">
    <!-- Header Section -->
    <div class="graph-header">
      <div class="graph-header-info">
        <h2 class="graph-title">{{ knowledgeBase.name }} - 知识图谱</h2>
        <p class="graph-subtitle">可视化展示文档间的关联关系</p>
      </div>
      <div class="graph-header-actions">
        <a-button 
          type="primary" 
          size="large"
          @click="handleGenerateGraph"
          :loading="isGenerating"
          class="generate-btn"
        >
          <template #icon>
            <span class="material-icons">account_tree</span>
          </template>
          构建知识图谱
        </a-button>
      </div>
    </div>

    <!-- Graph Controls -->
    <div class="graph-controls" v-if="hasGraphData">
      <div class="control-group">
        <label class="control-label">搜索节点:</label>
        <a-input-search
          v-model:value="searchTerm"
          placeholder="搜索文档或标签..."
          size="large"
          style="width: 300px"
          @search="handleSearch"
        >
          <template #prefix>
            <span class="material-icons">search</span>
          </template>
        </a-input-search>
      </div>

      <div class="control-group">
        <label class="control-label">筛选标签:</label>
        <a-select
          v-model:value="selectedTags"
          mode="multiple"
          placeholder="选择标签筛选"
          style="width: 300px"
          size="large"
          :options="tagOptions"
          @change="handleTagFilter"
        />
      </div>

      <div class="control-group">
        <a-button @click="resetFilters" size="large">
          <template #icon>
            <span class="material-icons">refresh</span>
          </template>
          重置筛选
        </a-button>
      </div>
    </div>

    <!-- Graph Content -->
    <div class="graph-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <a-spin size="large" />
        <p class="loading-text">正在加载知识图谱...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">
          <span class="material-icons">error_outline</span>
        </div>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <a-button type="primary" @click="retryLoad">重试</a-button>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasGraphData" class="empty-container">
        <div class="empty-icon">
          <span class="material-icons">account_tree</span>
        </div>
        <h3>暂无知识图谱</h3>
        <p>点击"构建知识图谱"按钮开始分析文档关联关系</p>
        <a-button 
          type="primary" 
          size="large"
          @click="handleGenerateGraph"
          :loading="isGenerating"
        >
          立即构建
        </a-button>
      </div>

      <!-- Graph Visualization -->
      <div v-else class="graph-container">
        <KnowledgeGraphVisualization 
          :knowledge-base-id="knowledgeBase.id"
          :height="graphHeight"
          :width="graphWidth"
          @node-selected="handleNodeSelected"
          @graph-updated="handleGraphUpdated"
        />
      </div>
    </div>

    <!-- Graph Statistics Panel -->
    <div v-if="hasGraphData" class="graph-stats">
      <div class="stats-header">
        <h4>图谱统计</h4>
        <a-button 
          type="text" 
          size="small"
          @click="toggleStatsPanel"
        >
          <span class="material-icons">
            {{ showStatsPanel ? 'expand_less' : 'expand_more' }}
          </span>
        </a-button>
      </div>
      
      <div v-if="showStatsPanel" class="stats-content">
        <div class="stat-item">
          <span class="stat-label">文档节点:</span>
          <span class="stat-value">{{ graphStats.documentCount || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">标签节点:</span>
          <span class="stat-value">{{ graphStats.tagCount || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">连接数:</span>
          <span class="stat-value">{{ graphStats.linkCount || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最后更新:</span>
          <span class="stat-value">{{ formatDate(graphStats.lastUpdated) }}</span>
        </div>
      </div>
    </div>

    <!-- Node Details Panel -->
    <a-drawer
      v-model:open="showNodeDetails"
      title="节点详情"
      placement="right"
      width="400"
      class="node-details-drawer"
    >
      <div v-if="selectedNode" class="node-details">
        <div class="node-header">
          <div class="node-icon" :class="`node-icon-${selectedNode.type}`">
            <span class="material-icons">
              {{ selectedNode.type === 'document' ? 'description' : 'label' }}
            </span>
          </div>
          <div class="node-info">
            <h3 class="node-title">{{ selectedNode.name }}</h3>
            <span class="node-type">{{ selectedNode.type === 'document' ? '文档' : '标签' }}</span>
          </div>
        </div>

        <div class="node-content">
          <div v-if="selectedNode.type === 'document'" class="document-details">
            <div class="detail-item">
              <label>文档大小:</label>
              <span>{{ selectedNode.size || '未知' }}</span>
            </div>
            <div class="detail-item">
              <label>上传时间:</label>
              <span>{{ formatDate(selectedNode.uploadTime) }}</span>
            </div>
            <div class="detail-item">
              <label>关联标签:</label>
              <div class="tag-list">
                <a-tag 
                  v-for="tag in selectedNode.tags" 
                  :key="tag"
                  color="purple"
                >
                  {{ tag }}
                </a-tag>
              </div>
            </div>
          </div>

          <div v-else class="tag-details">
            <div class="detail-item">
              <label>关联文档数:</label>
              <span>{{ selectedNode.documentCount || 0 }}</span>
            </div>
            <div class="detail-item">
              <label>相关文档:</label>
              <div class="document-list">
                <div 
                  v-for="doc in selectedNode.relatedDocuments" 
                  :key="doc.id"
                  class="document-item"
                  @click="handleDocumentClick(doc)"
                >
                  <span class="material-icons">description</span>
                  <span>{{ doc.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="node-actions">
          <a-button 
            v-if="selectedNode.type === 'document'" 
            type="primary" 
            @click="handlePreviewDocument"
          >
            预览文档
          </a-button>
          <a-button @click="handleFocusNode">
            聚焦节点
          </a-button>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { useKnowledgeGraphStore } from '../../store/knowledge_graph'
import KnowledgeGraphVisualization from '../KnowledgeGraphVisualization.vue'

defineOptions({ name: 'KnowledgeGraphSection' })

// Props
const props = defineProps<{
  knowledgeBase: {
    id: string
    name: string
    description?: string
  }
}>()

// Emits
const emit = defineEmits<{
  'generate-graph': []
}>()

// Store
const knowledgeGraphStore = useKnowledgeGraphStore()

// Reactive state
const searchTerm = ref('')
const selectedTags = ref<string[]>([])
const showStatsPanel = ref(true)
const showNodeDetails = ref(false)
const selectedNode = ref(null)
const graphHeight = ref(600)
const graphWidth = ref(800)

// Computed properties
const isLoading = computed(() => knowledgeGraphStore.isLoading)
const isGenerating = computed(() => knowledgeGraphStore.isGenerating)
const error = computed(() => knowledgeGraphStore.error)
const graphData = computed(() => knowledgeGraphStore.graphData)
const graphStats = computed(() => knowledgeGraphStore.graphStats)

const hasGraphData = computed(() => {
  return graphData.value && (graphData.value.nodes.length > 0 || graphData.value.links.length > 0)
})

const tagOptions = computed(() => {
  if (!graphData.value) return []
  
  const tags = new Set<string>()
  graphData.value.nodes.forEach(node => {
    if (node.type === 'tag') {
      tags.add(node.name)
    }
  })
  
  return Array.from(tags).map(tag => ({
    label: tag,
    value: tag
  }))
})

// Event handlers
const handleGenerateGraph = () => {
  emit('generate-graph')
}

const handleSearch = () => {
  knowledgeGraphStore.setSearchTerm(searchTerm.value)
}

const handleTagFilter = () => {
  knowledgeGraphStore.setSelectedTags(selectedTags.value)
}

const resetFilters = () => {
  searchTerm.value = ''
  selectedTags.value = []
  knowledgeGraphStore.setSearchTerm('')
  knowledgeGraphStore.setSelectedTags([])
}

const handleNodeSelected = (node: any) => {
  selectedNode.value = node
  showNodeDetails.value = true
}

const handleGraphUpdated = () => {
  // Handle graph updates if needed
}

const toggleStatsPanel = () => {
  showStatsPanel.value = !showStatsPanel.value
}

const handleDocumentClick = (doc: any) => {
  // Navigate to document or emit event
  console.log('Document clicked:', doc)
}

const handlePreviewDocument = () => {
  if (selectedNode.value && selectedNode.value.type === 'document') {
    // Navigate to document preview
    console.log('Preview document:', selectedNode.value)
  }
}

const handleFocusNode = () => {
  if (selectedNode.value) {
    // Focus on the selected node in the graph
    console.log('Focus node:', selectedNode.value)
  }
}

const retryLoad = () => {
  knowledgeGraphStore.fetchGraph(props.knowledgeBase.id)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '未知'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Resize handling
const updateGraphSize = () => {
  const container = document.querySelector('.graph-container')
  if (container) {
    graphWidth.value = container.clientWidth
    graphHeight.value = container.clientHeight
  }
}

// Lifecycle
onMounted(() => {
  // Load graph data if available
  if (props.knowledgeBase.id) {
    knowledgeGraphStore.fetchGraph(props.knowledgeBase.id)
  }
  
  // Set up resize listener
  window.addEventListener('resize', updateGraphSize)
  updateGraphSize()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateGraphSize)
})
</script>

<style scoped>
.knowledge-graph-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.graph-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.graph-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.generate-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  height: 40px;
  padding: 0 20px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  transition: all 0.3s ease;
}

.generate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

.graph-controls {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #fafafa;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.graph-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.loading-container,
.error-container,
.empty-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #64748b;
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
}

.error-icon,
.empty-icon {
  font-size: 64px;
  color: #94a3b8;
  margin-bottom: 16px;
}

.error-container h3,
.empty-container h3 {
  margin: 0 0 8px 0;
  color: #475569;
  font-size: 20px;
}

.graph-container {
  width: 100%;
  height: 100%;
}

.graph-stats {
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.stats-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.stats-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 24px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.node-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.node-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.node-icon-document {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
}

.node-icon-tag {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.node-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.node-type {
  font-size: 14px;
  color: #64748b;
}

.node-content {
  flex: 1;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.detail-item span {
  font-size: 14px;
  color: #64748b;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8fafc;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.document-item:hover {
  background: #e2e8f0;
}

.document-item .material-icons {
  font-size: 16px;
  color: #7c3aed;
}

.node-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.node-actions .ant-btn {
  flex: 1;
}
</style>
