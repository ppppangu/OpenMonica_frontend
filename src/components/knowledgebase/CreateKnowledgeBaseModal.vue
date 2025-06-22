<template>
  <a-modal
    v-model:open="visible"
    title="创建知识库"
    :confirm-loading="isCreating"
    @ok="handleCreate"
    @cancel="handleCancel"
    ok-text="创建"
    cancel-text="取消"
    width="600px"
    class="create-kb-modal"
  >
    <div class="modal-content">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        class="create-form"
      >
        <a-form-item label="知识库名称" name="name" class="form-item">
          <a-input
            v-model:value="formData.name"
            placeholder="请输入知识库名称"
            size="large"
            :maxlength="50"
            show-count
          />
        </a-form-item>

        <a-form-item label="知识库描述" name="description" class="form-item">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入知识库描述（可选）"
            :rows="4"
            :maxlength="200"
            show-count
          />
        </a-form-item>

        <a-form-item label="图标选择" name="icon" class="form-item">
          <div class="icon-selector">
            <div
              v-for="icon in iconOptions"
              :key="icon.value"
              :class="['icon-option', { 'icon-option-selected': formData.icon === icon.value }]"
              @click="formData.icon = icon.value"
            >
              <span class="material-icons">{{ icon.value }}</span>
              <span class="icon-label">{{ icon.label }}</span>
            </div>
          </div>
        </a-form-item>

        <a-form-item label="颜色主题" name="color_variant" class="form-item">
          <div class="color-selector">
            <div
              v-for="color in colorOptions"
              :key="color.value"
              :class="['color-option', { 'color-option-selected': formData.color_variant === color.value }]"
              @click="formData.color_variant = color.value"
            >
              <div class="color-preview" :class="`color-preview-${color.value}`"></div>
              <span class="color-label">{{ color.label }}</span>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { useKnowledgeBaseStore } from '../../store/knowledgebase_list'

defineOptions({ name: 'CreateKnowledgeBaseModal' })

// Props
const props = defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'knowledge-base-created': []
}>()

// Store
const knowledgeBaseStore = useKnowledgeBaseStore()

// Refs
const formRef = ref<FormInstance>()
const isCreating = ref(false)

// Form data
const formData = reactive({
  name: '',
  description: '',
  icon: 'library_books',
  color_variant: 'purple'
})

// Form rules
const formRules = {
  name: [
    { required: true, message: '请输入知识库名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度应在2-50个字符之间', trigger: 'blur' }
  ]
}

// Icon options
const iconOptions = [
  { value: 'library_books', label: '图书馆' },
  { value: 'school', label: '学校' },
  { value: 'science', label: '科学' },
  { value: 'business', label: '商业' },
  { value: 'psychology', label: '心理学' },
  { value: 'medical_services', label: '医疗' },
  { value: 'engineering', label: '工程' },
  { value: 'language', label: '语言' },
  { value: 'history', label: '历史' },
  { value: 'art_track', label: '艺术' },
  { value: 'sports', label: '体育' },
  { value: 'travel_explore', label: '旅行' }
]

// Color options
const colorOptions = [
  { value: 'purple', label: '紫色' },
  { value: 'blue', label: '蓝色' },
  { value: 'green', label: '绿色' }
]

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const handleCreate = async () => {
  try {
    await formRef.value?.validate()
    
    isCreating.value = true
    
    const createData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      icon: formData.icon,
      color_variant: formData.color_variant
    }
    
    await knowledgeBaseStore.createKnowledgeBase(createData)
    
    message.success('知识库创建成功')
    emit('knowledge-base-created')
    resetForm()
    
  } catch (error) {
    console.error('创建知识库失败:', error)
    if (error.errorFields) {
      // Form validation error
      return
    }
    message.error('创建知识库失败，请稍后重试')
  } finally {
    isCreating.value = false
  }
}

const handleCancel = () => {
  resetForm()
  emit('update:visible', false)
}

const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formData.icon = 'library_books'
  formData.color_variant = 'purple'
  formRef.value?.resetFields()
}

// Watch for modal visibility changes
watch(() => props.visible, (newVisible) => {
  if (!newVisible) {
    resetForm()
  }
})
</script>

<style scoped>
.create-kb-modal :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.create-kb-modal :deep(.ant-modal-title) {
  color: #1e293b;
  font-weight: 600;
}

.modal-content {
  padding: 8px 0;
}

.create-form {
  max-width: 100%;
}

.form-item {
  margin-bottom: 24px;
}

.form-item :deep(.ant-form-item-label) {
  font-weight: 500;
  color: #374151;
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafafa;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 2px solid transparent;
}

.icon-option:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.icon-option-selected {
  background: #ede9fe;
  border-color: #8b5cf6;
}

.icon-option .material-icons {
  font-size: 24px;
  color: #7c3aed;
  margin-bottom: 4px;
}

.icon-label {
  font-size: 12px;
  color: #64748b;
  text-align: center;
}

.color-selector {
  display: flex;
  gap: 16px;
  padding: 8px;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 2px solid transparent;
  min-width: 80px;
}

.color-option:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.color-option-selected {
  background: #f8fafc;
  border-color: #8b5cf6;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-preview-purple {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
}

.color-preview-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.color-preview-green {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.color-label {
  font-size: 14px;
  color: #64748b;
  text-align: center;
}

/* Scrollbar styling for icon selector */
.icon-selector::-webkit-scrollbar {
  width: 6px;
}

.icon-selector::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.icon-selector::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.icon-selector::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
