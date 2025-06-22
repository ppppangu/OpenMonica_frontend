<template>
  <div class="unified-knowledge-base">
    <!-- Header Section -->
    <div class="kb-header">
      <div class="kb-header-content">
        <h1 class="kb-title">知识库管理</h1>
        <div class="kb-header-actions">
          <a-button 
            type="primary" 
            size="large"
            @click="showCreateModal = true"
            class="create-kb-btn"
          >
            <template #icon>
              <span class="material-icons">add</span>
            </template>
            创建知识库
          </a-button>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="kb-navigation">
      <a-tabs 
        v-model:activeKey="activeTab" 
        size="large"
        class="kb-tabs"
        @change="handleTabChange"
      >
        <a-tab-pane key="list" tab="知识库列表">
          <template #tab>
            <span class="material-icons tab-icon">library_books</span>
            知识库列表
          </template>
        </a-tab-pane>
        
        <a-tab-pane key="documents" tab="文档管理" :disabled="!activeKnowledgeBase">
          <template #tab>
            <span class="material-icons tab-icon">description</span>
            文档管理
          </template>
        </a-tab-pane>
        
        <a-tab-pane key="graph" tab="知识图谱" :disabled="!activeKnowledgeBase">
          <template #tab>
            <span class="material-icons tab-icon">account_tree</span>
            知识图谱
          </template>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- Content Area -->
    <div class="kb-content">
      <!-- Knowledge Base List Tab -->
      <div v-if="activeTab === 'list'" class="tab-content">
        <KnowledgeBaseList 
          @knowledge-base-selected="handleKnowledgeBaseSelected"
          @knowledge-base-deleted="handleKnowledgeBaseDeleted"
        />
      </div>

      <!-- Document Management Tab -->
      <div v-if="activeTab === 'documents'" class="tab-content">
        <DocumentManagement 
          v-if="activeKnowledgeBase"
          :knowledge-base="activeKnowledgeBase"
        />
      </div>

      <!-- Knowledge Graph Tab -->
      <div v-if="activeTab === 'graph'" class="tab-content">
        <KnowledgeGraphSection 
          v-if="activeKnowledgeBase"
          :knowledge-base="activeKnowledgeBase"
          @generate-graph="handleGenerateGraph"
        />
      </div>
    </div>

    <!-- Create Knowledge Base Modal -->
    <CreateKnowledgeBaseModal 
      v-model:visible="showCreateModal"
      @knowledge-base-created="handleKnowledgeBaseCreated"
    />

    <!-- Generate Graph Confirmation Modal -->
    <a-modal
      v-model:open="showGenerateGraphModal"
      title="构建知识图谱"
      :confirm-loading="isGeneratingGraph"
      @ok="confirmGenerateGraph"
      @cancel="showGenerateGraphModal = false"
      ok-text="确认构建"
      cancel-text="取消"
      class="generate-graph-modal"
    >
      <div class="modal-content">
        <div class="warning-icon">
          <span class="material-icons">warning</span>
        </div>
        <div class="warning-text">
          <h3>确认构建知识图谱</h3>
          <p>此操作将重新构建知识图谱，<strong>覆盖现有的图谱数据</strong>。</p>
          <p>构建过程可能需要几分钟时间，请确认是否继续？</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useKnowledgeBaseStore } from '../../store/knowledgebase_list'
import { useKnowledgeGraphStore } from '../../store/knowledge_graph'
import KnowledgeBaseList from './KnowledgeBaseList.vue'
import DocumentManagement from './DocumentManagement.vue'
import KnowledgeGraphSection from './KnowledgeGraphSection.vue'
import CreateKnowledgeBaseModal from './CreateKnowledgeBaseModal.vue'

defineOptions({ name: 'UnifiedKnowledgeBase' })

// Stores
const knowledgeBaseStore = useKnowledgeBaseStore()
const knowledgeGraphStore = useKnowledgeGraphStore()

// Reactive state
const activeTab = ref('list')
const showCreateModal = ref(false)
const showGenerateGraphModal = ref(false)
const isGeneratingGraph = ref(false)

// Computed properties
const activeKnowledgeBase = computed(() => knowledgeBaseStore.activeKnowledgeBaseItem)

// Event handlers
const handleTabChange = (key: string) => {
  activeTab.value = key
  
  // If switching to graph tab, fetch graph data
  if (key === 'graph' && activeKnowledgeBase.value) {
    knowledgeGraphStore.fetchGraph(activeKnowledgeBase.value.id)
  }
}

const handleKnowledgeBaseSelected = (knowledgeBase: any) => {
  console.log('Knowledge base selected:', knowledgeBase)
  knowledgeBaseStore.setActiveKnowledgeBaseItem(knowledgeBase)
  
  // Switch to documents tab when a knowledge base is selected
  activeTab.value = 'documents'
}

const handleKnowledgeBaseDeleted = () => {
  // Reset to list tab when knowledge base is deleted
  activeTab.value = 'list'
  knowledgeBaseStore.setActiveKnowledgeBaseItem(null)
}

const handleKnowledgeBaseCreated = () => {
  showCreateModal.value = false
  // Refresh knowledge base list
  knowledgeBaseStore.fetchKnowledgeBaseList()
}

const handleGenerateGraph = () => {
  showGenerateGraphModal.value = true
}

const confirmGenerateGraph = async () => {
  if (!activeKnowledgeBase.value) {
    message.error('请先选择知识库')
    return
  }

  isGeneratingGraph.value = true
  
  try {
    const success = await knowledgeGraphStore.generateGraph(activeKnowledgeBase.value.id)
    
    if (success) {
      message.success('知识图谱构建成功')
      showGenerateGraphModal.value = false
      
      // Refresh graph data
      await knowledgeGraphStore.fetchGraph(activeKnowledgeBase.value.id)
    } else {
      message.error('知识图谱构建失败')
    }
  } catch (error) {
    console.error('构建知识图谱失败:', error)
    message.error('构建知识图谱失败，请稍后重试')
  } finally {
    isGeneratingGraph.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Load knowledge base list on component mount
  knowledgeBaseStore.fetchKnowledgeBaseList()
})
</script>

<style scoped>
.unified-knowledge-base {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.kb-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.kb-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.kb-title {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.create-kb-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  height: 40px;
  padding: 0 20px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  transition: all 0.3s ease;
}

.create-kb-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

.kb-navigation {
  background: white;
  padding: 0 32px;
  border-bottom: 1px solid #e2e8f0;
}

.kb-tabs {
  max-width: 1400px;
  margin: 0 auto;
}

.kb-tabs :deep(.ant-tabs-tab) {
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 500;
}

.kb-tabs :deep(.ant-tabs-tab-active) {
  color: #7c3aed;
}

.kb-tabs :deep(.ant-tabs-ink-bar) {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  height: 3px;
}

.tab-icon {
  margin-right: 8px;
  font-size: 18px;
  vertical-align: middle;
}

.kb-content {
  flex: 1;
  overflow: hidden;
  padding: 24px 32px;
}

.tab-content {
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.generate-graph-modal .modal-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0;
}

.warning-icon {
  color: #f59e0b;
  font-size: 24px;
  margin-top: 4px;
}

.warning-text h3 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.warning-text p {
  margin: 0 0 8px 0;
  color: #64748b;
  line-height: 1.6;
}

.warning-text strong {
  color: #dc2626;
  font-weight: 600;
}
</style>
