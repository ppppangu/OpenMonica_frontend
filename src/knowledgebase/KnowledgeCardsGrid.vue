<template>
  <div class="knowledge-grid-container">
    <!-- Message context holder for notifications -->
    <component :is="contextHolder" />
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
          <Dropdown
            :visible="dropdownVisible[item.id] || false"
            placement="bottomRight"
            :trigger="['click']"
            @visibleChange="(visible) => dropdownVisible[item.id] = visible"
          >
            <button
              class="knowledge-card-menu"
              @click="handleMenuClick(item, $event)"
            >
              <span class="material-icons">more_vert</span>
            </button>
            <template #overlay>
              <Menu @click="(menuInfo) => handleDropdownMenuClick(menuInfo, item)">
                <Menu.Item key="edit">
                  <EditOutlined />
                  编辑知识库
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="delete" style="color: #ff4d4f;">
                  <DeleteOutlined />
                  删除知识库
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
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

    <!-- 新建知识库模态框 -->
    <Modal
      v-model:open="isCreateModalVisible"
      title="新建知识库"
      :confirm-loading="isCreating"
      ok-text="创建"
      cancel-text="取消"
      @ok="handleCreateSubmit"
      @cancel="handleCreateCancel"
      :ok-button-props="{ disabled: !createForm.name.trim() }"
      class="create-knowledge-modal"
    >
      <Form
        :model="createForm"
        layout="vertical"
        class="create-knowledge-form"
      >
        <FormItem
          label="知识库名称"
          name="name"
          :rules="[
            { required: true, message: '请输入知识库名称' },
            { min: 1, max: 50, message: '知识库名称长度应在1-50个字符之间' }
          ]"
        >
          <Input
            v-model:value="createForm.name"
            placeholder="请输入知识库名称"
            :maxlength="50"
            show-count
            @keyup.enter="handleCreateSubmit"
          />
        </FormItem>

        <FormItem
          label="知识库描述"
          name="description"
          :rules="[
            { max: 200, message: '描述长度不能超过200个字符' }
          ]"
        >
          <TextArea
            v-model:value="createForm.description"
            placeholder="请输入知识库描述（可选）"
            :rows="3"
            :maxlength="200"
            show-count
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 编辑知识库模态框 -->
    <Modal
      v-model:open="isEditModalVisible"
      title="编辑知识库"
      :confirm-loading="isEditing"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleEditSubmit"
      @cancel="handleEditCancel"
      :ok-button-props="{ disabled: !editForm.name.trim() }"
      class="edit-knowledge-modal"
    >
      <div style="margin-bottom: 16px; padding: 12px; background: #f6f8fa; border-radius: 6px; border-left: 4px solid #1890ff;">
        <div style="font-size: 14px; color: #1890ff; font-weight: 500; margin-bottom: 4px;">
          💡 提示：优化知识库搜索效果
        </div>
        <div style="font-size: 13px; color: #666; line-height: 1.4;">
          AI模型会根据知识库的<strong>名称</strong>和<strong>描述</strong>来搜索相关内容。建议使用描述性的名称和详细的描述，这样可以显著提高搜索准确性。
        </div>
      </div>

      <Form
        :model="editForm"
        layout="vertical"
        class="edit-knowledge-form"
      >
        <FormItem
          label="知识库名称"
          name="name"
          :rules="[
            { required: true, message: '请输入知识库名称' },
            { min: 1, max: 50, message: '知识库名称长度应在1-50个字符之间' }
          ]"
        >
          <Input
            v-model:value="editForm.name"
            placeholder="请输入知识库名称"
            :maxlength="50"
            show-count
            @keyup.enter="handleEditSubmit"
          />
        </FormItem>

        <FormItem
          label="知识库描述"
          name="description"
          :rules="[
            { max: 200, message: '描述长度不能超过200个字符' }
          ]"
        >
          <TextArea
            v-model:value="editForm.description"
            placeholder="请输入知识库描述（建议详细描述知识库内容，有助于AI更准确地搜索相关信息）"
            :rows="4"
            :maxlength="200"
            show-count
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- Message Context Holder -->
    <component :is="contextHolder" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, reactive, h } from 'vue'
import { Modal, Form, FormItem, Input, message, Dropdown, Menu } from 'ant-design-vue'
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
const { TextArea } = Input
import { useKnowledgeBaseStore } from '../store/knowledgebase_list'
import { useKnowledgeBaseDetailStore } from '../store/knowledgebase_detail'
import { useUserStore } from '../store/user_info'

defineOptions({ name: 'KnowledgeCardsGrid' })

// Stores
const knowledgeBaseStore = useKnowledgeBaseStore()
const knowledgeBaseDetailStore = useKnowledgeBaseDetailStore()
const userStore = useUserStore()

// Message API
const [messageApi, contextHolder] = message.useMessage()

// Modal state
const isCreateModalVisible = ref(false)
const isCreating = ref(false)
const isEditModalVisible = ref(false)
const isEditing = ref(false)
const isDeleting = ref(false)

// Dropdown state
const dropdownVisible = ref<{[key: string]: boolean}>({})

// Form data
const createForm = reactive({
  name: '',
  description: ''
})

const editForm = reactive({
  id: '',
  name: '',
  description: ''
})

// Computed properties
const knowledgeBaseList = computed(() => knowledgeBaseStore.knowledgeBaseList)
const isLoading = computed(() => knowledgeBaseStore.isLoading)
const error = computed(() => knowledgeBaseStore.error)

// Event handlers
const handleCardClick = async (item: any, _event: Event) => {
  console.log('Knowledge base card clicked:', item)

  // 设置当前激活的知识库
  knowledgeBaseStore.setActiveKnowledgeBaseItem(item)

  // 获取知识库详情并存储到 Pinia
  try {
    await knowledgeBaseDetailStore.fetchKnowledgeBaseDetail(item.id)
    console.log('Knowledge base detail fetched and stored:', knowledgeBaseDetailStore.documentDetailList)
  } catch (error) {
    console.error('Failed to fetch knowledge base detail:', error)
  }

  // 默认行为是跳转到详情页面，由 href 处理
}

const handleMenuClick = (item: any, event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  console.log('Knowledge base menu clicked:', item)

  // 切换下拉菜单显示状态
  const itemId = item.id
  dropdownVisible.value = {
    ...dropdownVisible.value,
    [itemId]: !dropdownVisible.value[itemId]
  }
}

// 处理下拉菜单项点击
const handleDropdownMenuClick = (menuInfo: any, item: any) => {
  console.log('Dropdown menu clicked:', menuInfo.key, item)

  // 关闭下拉菜单
  dropdownVisible.value[item.id] = false

  switch (menuInfo.key) {
    case 'edit':
      handleEditKnowledgeBase(item)
      break
    case 'delete':
      handleDeleteKnowledgeBase(item)
      break
  }
}

// 处理编辑知识库
const handleEditKnowledgeBase = (item: any) => {
  console.log('Edit knowledge base:', item)

  // 预填充表单数据
  editForm.id = item.id
  editForm.name = item.name
  editForm.description = item.description

  // 显示编辑模态框
  isEditModalVisible.value = true
}

// 处理删除知识库
const handleDeleteKnowledgeBase = (item: any) => {
  console.log('Delete knowledge base:', item)

  Modal.confirm({
    title: '确认删除知识库',
    icon: h(ExclamationCircleOutlined, { style: { color: '#ff4d4f' } }),
    content: h('div', [
      h('p', `确定要删除知识库 "${item.name}" 吗？`),
      h('p', { style: { color: '#ff4d4f', fontSize: '14px', marginTop: '8px' } },
        '⚠️ 此操作将永久删除该知识库及其所有文档，无法恢复！')
    ]),
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        isDeleting.value = true
        knowledgeBaseStore.clearError()

        await knowledgeBaseStore.deleteKnowledgeBase(item.id)

        messageApi.success('知识库删除成功')
      } catch (error: any) {
        console.error('Failed to delete knowledge base:', error)
        const errorMessage = knowledgeBaseStore.error || error.message || '删除知识库失败，请稍后重试'
        messageApi.error(errorMessage)
      } finally {
        isDeleting.value = false
      }
    }
  })
}

const handleCreateNew = () => {
  console.log('Create new knowledge base clicked')
  // 重置表单
  createForm.name = ''
  createForm.description = ''
  // 显示模态框
  isCreateModalVisible.value = true
}

// 处理创建提交
const handleCreateSubmit = async () => {
  // 验证表单
  if (!createForm.name.trim()) {
    messageApi.error('请输入知识库名称')
    return
  }

  if (createForm.name.trim().length > 50) {
    messageApi.error('知识库名称长度不能超过50个字符')
    return
  }

  if (createForm.description.length > 200) {
    messageApi.error('描述长度不能超过200个字符')
    return
  }

  isCreating.value = true

  try {
    // 清除之前的错误状态
    knowledgeBaseStore.clearError()

    // 调用store方法创建知识库
    await knowledgeBaseStore.createKnowledgeBase(
      createForm.name.trim(),
      createForm.description.trim()
    )

    // 如果没有抛出异常，说明创建成功
    messageApi.success('知识库创建成功')
    isCreateModalVisible.value = false
    // 重置表单
    createForm.name = ''
    createForm.description = ''

  } catch (error: any) {
    console.error('Failed to create knowledge base:', error)

    // 优先使用store中的错误信息，其次使用异常信息
    const errorMessage = knowledgeBaseStore.error || error.message || '创建知识库失败，请稍后重试'
    messageApi.error(errorMessage)
  } finally {
    isCreating.value = false
  }
}

// 处理取消
const handleCreateCancel = () => {
  isCreateModalVisible.value = false
  // 重置表单
  createForm.name = ''
  createForm.description = ''
}

// 处理编辑提交
const handleEditSubmit = async () => {
  // 验证表单
  if (!editForm.name.trim()) {
    messageApi.error('请输入知识库名称')
    return
  }

  if (editForm.name.trim().length > 50) {
    messageApi.error('知识库名称长度不能超过50个字符')
    return
  }

  if (editForm.description.length > 200) {
    messageApi.error('描述长度不能超过200个字符')
    return
  }

  isEditing.value = true

  try {
    // 清除之前的错误状态
    knowledgeBaseStore.clearError()

    // 调用store方法更新知识库
    await knowledgeBaseStore.updateKnowledgeBase(
      editForm.id,
      editForm.name.trim(),
      editForm.description.trim()
    )

    // 如果没有抛出异常，说明更新成功
    messageApi.success('知识库更新成功')
    isEditModalVisible.value = false
    // 重置表单
    editForm.id = ''
    editForm.name = ''
    editForm.description = ''

  } catch (error: any) {
    console.error('Failed to update knowledge base:', error)

    // 优先使用store中的错误信息，其次使用异常信息
    const errorMessage = knowledgeBaseStore.error || error.message || '更新知识库失败，请稍后重试'
    messageApi.error(errorMessage)
  } finally {
    isEditing.value = false
  }
}

// 处理编辑取消
const handleEditCancel = () => {
  isEditModalVisible.value = false
  // 重置表单
  editForm.id = ''
  editForm.name = ''
  editForm.description = ''
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

/* 新建知识库模态框样式 */
:deep(.create-knowledge-modal .ant-modal-header) {
  background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
  border-bottom: 1px solid #e9d5ff;
  border-radius: 8px 8px 0 0;
}

:deep(.create-knowledge-modal .ant-modal-title) {
  color: #7c3aed;
  font-weight: 600;
  font-size: 1.125rem;
}

:deep(.create-knowledge-modal .ant-modal-body) {
  padding: 1.5rem;
  background: #fefefe;
}

:deep(.create-knowledge-modal .ant-modal-footer) {
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-radius: 0 0 8px 8px;
  padding: 1rem 1.5rem;
}

:deep(.create-knowledge-modal .ant-btn-primary) {
  background: #8b5cf6;
  border-color: #8b5cf6;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
  transition: all 0.2s ease;
}

:deep(.create-knowledge-modal .ant-btn-primary:hover) {
  background: #7c3aed;
  border-color: #7c3aed;
  box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);
  transform: translateY(-1px);
}

:deep(.create-knowledge-modal .ant-btn-primary:disabled) {
  background: #d1d5db;
  border-color: #d1d5db;
  box-shadow: none;
  transform: none;
}

.create-knowledge-form {
  margin-top: 0.5rem;
}

:deep(.create-knowledge-form .ant-form-item-label > label) {
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

:deep(.create-knowledge-form .ant-input) {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  transition: all 0.2s ease;
}

:deep(.create-knowledge-form .ant-input:focus) {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
}

:deep(.create-knowledge-form .ant-input-data-count) {
  color: #6b7280;
  font-size: 0.75rem;
}

:deep(.create-knowledge-form .ant-form-item-explain-error) {
  color: #ef4444;
  font-size: 0.75rem;
}

/* 编辑知识库模态框样式 */
:deep(.edit-knowledge-modal .ant-modal-header) {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border-bottom: 1px solid #91d5ff;
  border-radius: 8px 8px 0 0;
}

:deep(.edit-knowledge-modal .ant-modal-title) {
  color: #1890ff;
  font-weight: 600;
  font-size: 1.125rem;
}

:deep(.edit-knowledge-modal .ant-modal-body) {
  padding: 1.5rem;
  background: #fefefe;
}

:deep(.edit-knowledge-modal .ant-modal-footer) {
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-radius: 0 0 8px 8px;
  padding: 1rem 1.5rem;
}

:deep(.edit-knowledge-modal .ant-btn-primary) {
  background: #1890ff;
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
  transition: all 0.2s ease;
}

:deep(.edit-knowledge-modal .ant-btn-primary:hover) {
  background: #40a9ff;
  border-color: #40a9ff;
  box-shadow: 0 4px 8px rgba(64, 169, 255, 0.3);
  transform: translateY(-1px);
}

:deep(.edit-knowledge-modal .ant-btn-primary:disabled) {
  background: #d1d5db;
  border-color: #d1d5db;
  box-shadow: none;
  transform: none;
}

.edit-knowledge-form {
  margin-top: 0.5rem;
}

:deep(.edit-knowledge-form .ant-form-item-label > label) {
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

:deep(.edit-knowledge-form .ant-input) {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  transition: all 0.2s ease;
}

:deep(.edit-knowledge-form .ant-input:focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

:deep(.edit-knowledge-form .ant-input-data-count) {
  color: #6b7280;
  font-size: 0.75rem;
}

:deep(.edit-knowledge-form .ant-form-item-explain-error) {
  color: #ef4444;
  font-size: 0.75rem;
}

/* 下拉菜单样式 */
:deep(.ant-dropdown-menu) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #f0f0f0;
}

:deep(.ant-dropdown-menu-item) {
  padding: 8px 12px;
  font-size: 14px;
  transition: all 0.2s ease;
}

:deep(.ant-dropdown-menu-item:hover) {
  background: #f5f5f5;
}

:deep(.ant-dropdown-menu-item .anticon) {
  margin-right: 8px;
  font-size: 14px;
}

:deep(.ant-dropdown-menu-item[style*="color: #ff4d4f"]:hover) {
  background: #fff2f0;
  color: #ff4d4f !important;
}

/* 知识库卡片菜单按钮样式优化 */
.knowledge-card-menu {
  position: relative;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.knowledge-card-menu:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(0, 0, 0, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.knowledge-card-menu .material-icons {
  font-size: 16px;
  color: #666;
  transition: color 0.2s ease;
}

.knowledge-card-menu:hover .material-icons {
  color: #333;
}
</style>
