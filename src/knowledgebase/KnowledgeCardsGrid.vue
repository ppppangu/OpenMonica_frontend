<template>
  <div class="knowledge-grid-container">
    <div class="knowledge-grid-header">
      <h2 class="knowledge-grid-title">我的知识库</h2>
      <button class="knowledge-create-btn" @click="handleCreateNew">
        <span class="material-icons">add</span>
        新建知识库
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="knowledge-loading">
      <div class="knowledge-loading-spinner"></div>
      <p class="knowledge-loading-text">正在加载知识库...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="knowledge-error">
      <div class="knowledge-error-icon">
        <span class="material-icons">error_outline</span>
      </div>
      <p class="knowledge-error-text">{{ error }}</p>
      <button class="knowledge-retry-btn" @click="handleRetry">
        <span class="material-icons">refresh</span>
        重试
      </button>
    </div>

    <!-- 知识库卡片网格 -->
    <div v-else class="knowledge-cards-grid">
      <!-- 知识库卡片 -->
      <a 
        v-for="item in knowledgeBaseList" 
        :key="item.id"
        :href="`/src/basedetail/basedetail.html?id=${item.id}`"
        :class="['knowledge-card', `knowledge-card-${item.color_variant}`]"
        @click="handleCardClick(item, $event)"
      >
        <div class="knowledge-card-header">
          <div class="knowledge-card-icon">{{ item.icon }}</div>
          <button 
            class="knowledge-card-menu"
            @click="handleMenuClick(item, $event)"
          >
            <span class="material-icons">more_vert</span>
          </button>
        </div>
        <h3 class="knowledge-card-title">{{ item.name }}</h3>
        <p class="knowledge-card-desc">{{ item.description }}</p>
        <div class="knowledge-card-count">{{ item.document_count }} 个文档</div>
      </a>

      <!-- 新建知识库卡片 -->
      <div class="knowledge-card knowledge-card-create" @click="handleCreateNew">
        <div class="knowledge-card-create-content">
          <div class="knowledge-card-create-icon">
            <span class="material-icons">add_circle_outline</span>
          </div>
          <h3 class="knowledge-card-create-title">新建知识库</h3>
          <p class="knowledge-card-create-desc">点击创建新的知识库</p>
        </div>
      </div>
    </div>

    <!-- 知识库操作区域 -->
    <div v-if="!isLoading && !error" class="knowledge-actions-section">
      <div class="knowledge-actions-content">
        <div class="knowledge-stats">
          共 {{ knowledgeBaseList.length }} 个知识库
        </div>
        <div class="knowledge-actions">
          <button class="knowledge-action-btn" @click="handleImport">
            <span class="material-icons">import_export</span>
            导入知识库
          </button>
          <button class="knowledge-action-btn" @click="handleSettings">
            <span class="material-icons">settings</span>
            管理设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useKnowledgeBaseStore } from '../store/knowledgebase_list'
import { useUserStore } from '../store/user_info'

defineOptions({ name: 'KnowledgeCardsGrid' })

// Stores
const knowledgeBaseStore = useKnowledgeBaseStore()
const userStore = useUserStore()


// Computed properties
const knowledgeBaseList = computed(() => knowledgeBaseStore.knowledgeBaseList)
const isLoading = computed(() => knowledgeBaseStore.isLoading)
const error = computed(() => knowledgeBaseStore.error)

// Event handlers
const handleCardClick = (item: any, event: Event) => {
  console.log('Knowledge base card clicked:', item)
  // 默认行为是跳转到详情页面，由 href 处理
}

const handleMenuClick = (item: any, event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  console.log('Knowledge base menu clicked:', item)
  // TODO: 显示菜单选项（编辑、删除等）
}

const handleCreateNew = () => {
  console.log('Create new knowledge base clicked')
  // 创建知识库
  // knowledgeBaseStore.createKnowledgeBase(userStore.user?.id, '', '', '')
}

const handleImport = () => {
  console.log('Import knowledge base clicked')
  // TODO: 打开导入知识库对话框
}

const handleSettings = () => {
  console.log('Knowledge base settings clicked')
  // TODO: 打开知识库管理设置
}

const handleRetry = () => {
  knowledgeBaseStore.clearError()
  knowledgeBaseStore.fetchKnowledgeBaseList()
}

// Lifecycle
onMounted(async () => {
  // 确保用户已登录
  userStore.initializeFromStorage()
  
  if (userStore.isLoggedIn) {
    await knowledgeBaseStore.fetchKnowledgeBaseList()
  } else {
    console.warn('User not logged in, cannot fetch knowledge base list')
  }
})
</script>

<style scoped>
/* 加载状态样式 */
.knowledge-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.knowledge-loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.knowledge-loading-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

/* 错误状态样式 */
.knowledge-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.knowledge-error-icon {
  color: #ef4444;
  font-size: 3rem;
  margin-bottom: 1rem;
}

.knowledge-error-icon .material-icons {
  font-size: 3rem;
}

.knowledge-error-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
}

.knowledge-retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
}

.knowledge-retry-btn:hover {
  background: #6d28d9;
}

.knowledge-retry-btn .material-icons {
  font-size: 1rem;
}

/* 旋转动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
