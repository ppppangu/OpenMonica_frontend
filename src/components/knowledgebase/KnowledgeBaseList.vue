<template>
  <div class="knowledge-base-list">
    <!-- Search and Filter Section -->
    <div class="list-header">
      <div class="search-section">
        <a-input-search
          v-model:value="searchQuery"
          placeholder="搜索知识库..."
          size="large"
          class="search-input"
          @search="handleSearch"
        >
          <template #prefix>
            <span class="material-icons">search</span>
          </template>
        </a-input-search>
      </div>
      
      <div class="filter-section">
        <a-select
          v-model:value="sortBy"
          size="large"
          style="width: 200px"
          @change="handleSortChange"
        >
          <a-select-option value="updated_at">最近更新</a-select-option>
          <a-select-option value="created_at">创建时间</a-select-option>
          <a-select-option value="name">名称</a-select-option>
          <a-select-option value="document_count">文档数量</a-select-option>
        </a-select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <a-spin size="large" />
      <p class="loading-text">正在加载知识库...</p>
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
    <div v-else-if="filteredKnowledgeBases.length === 0" class="empty-container">
      <div class="empty-icon">
        <span class="material-icons">library_books</span>
      </div>
      <h3>暂无知识库</h3>
      <p>创建您的第一个知识库开始管理文档</p>
    </div>

    <!-- Knowledge Base Grid -->
    <div v-else class="kb-grid">
      <div
        v-for="kb in filteredKnowledgeBases"
        :key="kb.id"
        class="kb-card"
        @click="handleKnowledgeBaseClick(kb)"
      >
        <div class="kb-card-header">
          <div class="kb-icon" :class="`kb-icon-${kb.color_variant || 'purple'}`">
            <span class="material-icons">{{ kb.icon || 'library_books' }}</span>
          </div>
          <div class="kb-actions">
            <a-dropdown :trigger="['click']" placement="bottomRight">
              <a-button type="text" size="small" @click.stop>
                <span class="material-icons">more_vert</span>
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleEdit(kb)">
                    <span class="material-icons menu-icon">edit</span>
                    编辑
                  </a-menu-item>
                  <a-menu-item @click="handleDelete(kb)" class="delete-item">
                    <span class="material-icons menu-icon">delete</span>
                    删除
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>

        <div class="kb-card-content">
          <h3 class="kb-name">{{ kb.name }}</h3>
          <p class="kb-description">{{ kb.description || '暂无描述' }}</p>
          
          <div class="kb-stats">
            <div class="stat-item">
              <span class="material-icons">description</span>
              <span>{{ kb.document_count || 0 }} 个文档</span>
            </div>
            <div class="stat-item">
              <span class="material-icons">schedule</span>
              <span>{{ formatDate(kb.updated_at) }}</span>
            </div>
          </div>
        </div>

        <div class="kb-card-footer">
          <a-button type="primary" size="small" @click.stop="handleKnowledgeBaseClick(kb)">
            管理文档
          </a-button>
          <a-button type="default" size="small" @click.stop="handleViewGraph(kb)">
            查看图谱
          </a-button>
        </div>
      </div>
    </div>

    <!-- Edit Knowledge Base Modal -->
    <EditKnowledgeBaseModal
      v-model:visible="showEditModal"
      :knowledge-base="editingKnowledgeBase"
      @knowledge-base-updated="handleKnowledgeBaseUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <a-modal
      v-model:open="showDeleteModal"
      title="删除知识库"
      :confirm-loading="isDeleting"
      @ok="confirmDelete"
      @cancel="showDeleteModal = false"
      ok-text="确认删除"
      cancel-text="取消"
      ok-type="danger"
    >
      <div class="delete-modal-content">
        <div class="warning-icon">
          <span class="material-icons">warning</span>
        </div>
        <div class="warning-text">
          <p>确定要删除知识库 <strong>{{ deletingKnowledgeBase?.name }}</strong> 吗？</p>
          <p class="warning-note">此操作不可撤销，将删除所有相关文档和数据。</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useKnowledgeBaseStore } from '../../store/knowledgebase_list'
import EditKnowledgeBaseModal from './EditKnowledgeBaseModal.vue'

defineOptions({ name: 'KnowledgeBaseList' })

// Emits
const emit = defineEmits<{
  'knowledge-base-selected': [knowledgeBase: any]
  'knowledge-base-deleted': []
}>()

// Store
const knowledgeBaseStore = useKnowledgeBaseStore()

// Reactive state
const searchQuery = ref('')
const sortBy = ref('updated_at')
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingKnowledgeBase = ref(null)
const deletingKnowledgeBase = ref(null)
const isDeleting = ref(false)

// Computed properties
const knowledgeBaseList = computed(() => knowledgeBaseStore.knowledgeBaseList)
const isLoading = computed(() => knowledgeBaseStore.isLoading)
const error = computed(() => knowledgeBaseStore.error)

const filteredKnowledgeBases = computed(() => {
  let filtered = [...knowledgeBaseList.value]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(kb => 
      kb.name.toLowerCase().includes(query) || 
      (kb.description && kb.description.toLowerCase().includes(query))
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'document_count':
        return (b.document_count || 0) - (a.document_count || 0)
      case 'created_at':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case 'updated_at':
      default:
        return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
    }
  })

  return filtered
})

// Event handlers
const handleSearch = () => {
  // Search is reactive, no additional action needed
}

const handleSortChange = () => {
  // Sorting is reactive, no additional action needed
}

const handleKnowledgeBaseClick = (kb: any) => {
  emit('knowledge-base-selected', kb)
}

const handleViewGraph = (kb: any) => {
  emit('knowledge-base-selected', kb)
  // This will be handled by parent to switch to graph tab
}

const handleEdit = (kb: any) => {
  editingKnowledgeBase.value = kb
  showEditModal.value = true
}

const handleDelete = (kb: any) => {
  deletingKnowledgeBase.value = kb
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!deletingKnowledgeBase.value) return

  isDeleting.value = true
  
  try {
    await knowledgeBaseStore.deleteKnowledgeBase(deletingKnowledgeBase.value.id)
    message.success('知识库删除成功')
    showDeleteModal.value = false
    emit('knowledge-base-deleted')
  } catch (error) {
    console.error('删除知识库失败:', error)
    message.error('删除知识库失败，请稍后重试')
  } finally {
    isDeleting.value = false
  }
}

const handleKnowledgeBaseUpdated = () => {
  showEditModal.value = false
  knowledgeBaseStore.fetchKnowledgeBaseList()
}

const retryLoad = () => {
  knowledgeBaseStore.fetchKnowledgeBaseList()
}

const formatDate = (dateString: string) => {
  if (!dateString) return '未知'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
  return `${Math.floor(diffDays / 365)}年前`
}

// Lifecycle
onMounted(() => {
  if (knowledgeBaseList.value.length === 0) {
    knowledgeBaseStore.fetchKnowledgeBaseList()
  }
})
</script>

<style scoped>
.knowledge-base-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.search-section {
  flex: 1;
  max-width: 400px;
}

.search-input {
  border-radius: 8px;
}

.search-input :deep(.ant-input) {
  border-radius: 8px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-container,
.error-container,
.empty-container {
  flex: 1;
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

.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
}

.kb-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.kb-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.15);
  border-color: #8b5cf6;
}

.kb-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.kb-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.kb-icon-purple {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
}

.kb-icon-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.kb-icon-green {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.kb-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.kb-description {
  margin: 0 0 16px 0;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kb-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;
}

.stat-item .material-icons {
  font-size: 16px;
}

.kb-card-footer {
  display: flex;
  gap: 8px;
}

.kb-card-footer .ant-btn {
  flex: 1;
  border-radius: 6px;
}

.menu-icon {
  font-size: 16px;
  margin-right: 8px;
  vertical-align: middle;
}

.delete-item {
  color: #dc2626;
}

.delete-modal-content {
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

.warning-text p {
  margin: 0 0 8px 0;
  color: #64748b;
  line-height: 1.6;
}

.warning-text strong {
  color: #1e293b;
  font-weight: 600;
}

.warning-note {
  color: #dc2626;
  font-size: 14px;
}
</style>
