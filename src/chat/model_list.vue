<script setup lang="ts">
import { theme, message } from 'ant-design-vue';
import { onMounted, computed, ref, onUnmounted } from 'vue';
import { useModelListStore } from '../store/model_list';

defineOptions({ name: 'ModelList' });

const { token } = theme.useToken();
const modelListStore = useModelListStore();

// 控制下拉菜单显示状态
const modelDropdownVisible = ref(false);
// 下拉菜单位置样式
const dropdownStyle = ref({});

// 点击外部区域关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  const dropdown = document.querySelector('.model-dropdown-container');
  if (dropdown && !dropdown.contains(target)) {
    modelDropdownVisible.value = false;
  }
};

// 计算下拉菜单位置
const calculateDropdownPosition = () => {
  const button = document.querySelector('.model-dropdown-container button');
  if (button) {
    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 300; // 估计的下拉菜单高度
    const dropdownWidth = 192; // 12rem = 192px

    // 检查是否有足够空间向上展开
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;

    // 确保下拉菜单不会超出视口右边界
    let leftPosition = rect.left;
    if (leftPosition + dropdownWidth > viewportWidth) {
      leftPosition = viewportWidth - dropdownWidth - 16; // 16px margin from edge
    }

    // 确保下拉菜单不会超出视口左边界
    if (leftPosition < 16) {
      leftPosition = 16; // 16px margin from edge
    }

    if (spaceAbove >= dropdownHeight || spaceAbove > spaceBelow) {
      // 向上展开
      dropdownStyle.value = {
        position: 'fixed',
        left: `${leftPosition}px`,
        bottom: `${viewportHeight - rect.top + 4}px`, // 减少间距从8px到4px
        width: '12rem',
        zIndex: 9999,
        maxHeight: '300px',
        overflowY: 'auto',
        transformOrigin: 'bottom left' // 设置变换原点
      };
    } else {
      // 向下展开
      dropdownStyle.value = {
        position: 'fixed',
        left: `${leftPosition}px`,
        top: `${rect.bottom + 4}px`, // 减少间距从8px到4px
        width: '12rem',
        zIndex: 9999,
        maxHeight: '300px',
        overflowY: 'auto',
        transformOrigin: 'top left' // 设置变换原点
      };
    }
  } else {
    // 如果无法找到按钮，使用默认样式
    dropdownStyle.value = {
      position: 'absolute',
      bottom: '100%',
      left: '0',
      marginBottom: '4px', // 减少间距
      width: '12rem',
      zIndex: 9999,
      maxHeight: '300px',
      overflowY: 'auto',
      transformOrigin: 'bottom left'
    };
  }
};

const handleResize = () => {
  if (modelDropdownVisible.value) {
    calculateDropdownPosition();
  }
};

const handleScroll = () => {
  if (modelDropdownVisible.value) {
    calculateDropdownPosition();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
});

// 组件挂载时获取模型列表
onMounted(async () => {
  console.log('ModelList 组件挂载，开始获取模型列表');
  await modelListStore.get_model_list();
  console.log('模型列表获取完成，当前模型:', modelListStore.current_model);
  console.log('当前模型显示名称:', modelListStore.currentModelName);
});

// 切换下拉菜单显示状态
const toggleModelDropdown = () => {
  if (!modelDropdownVisible.value) {
    // 打开下拉菜单时计算位置
    calculateDropdownPosition();
  }
  modelDropdownVisible.value = !modelDropdownVisible.value;
};

// 选择模型
const selectModel = (modelId: string, modelName: string) => {
  console.log('选择模型:', modelId, modelName);

  const selectedModel = modelListStore.model_list.find(model => model?.model_id === modelId);
  console.log('找到的模型:', selectedModel);

  if (selectedModel) {
    modelListStore.setCurrentModel(selectedModel);
    console.log('模型切换成功:', selectedModel.model_exhibit_name);
  } else {
    console.log('未找到对应的模型，modelId:', modelId);
  }

  // 关闭下拉菜单
  modelDropdownVisible.value = false;
};

// 处理模型选择（保留原有逻辑作为备用）
const handleModelSelect = (menuInfo: any) => {
  console.log('点击模型选择，完整事件对象:', menuInfo);
  console.log('menuInfo 的所有属性:', Object.keys(menuInfo));

  // 检查是否是正确的菜单事件对象
  if (menuInfo.key !== undefined) {
    // 这是正确的 Ant Design Vue 菜单事件
    const key = menuInfo.key;
    console.log('从正确的菜单事件获取到 key:', key);

    if (!key) {
      console.log('key 为空，无法选择模型');
      return;
    }

    const selectedModel = modelListStore.model_list.find(model => model?.model_id === key);
    console.log('找到的模型:', selectedModel);

    if (selectedModel) {
      modelListStore.setCurrentModel(selectedModel);
      console.log('模型切换成功:', selectedModel.model_exhibit_name);
    } else {
      console.log('未找到对应的模型，key:', key);
      console.log('可用的模型ID列表:', modelListStore.model_list.map(m => m?.model_id));
    }
  } else {
    // 这是原生DOM事件，需要从DOM元素获取信息
    console.log('收到原生DOM事件，尝试从DOM获取模型ID');

    let target = menuInfo.target;
    let key = null;

    // 向上查找包含 data-model-id 的元素
    while (target && !key) {
      key = target.getAttribute && target.getAttribute('data-model-id');
      if (!key) {
        target = target.parentElement;
      }
    }

    console.log('从 DOM 元素获取到 key:', key);

    if (!key) {
      console.log('key 为空，无法选择模型。尝试的所有方法都失败了。');
      console.log('menuInfo 完整内容:', JSON.stringify(menuInfo, null, 2));
      return;
    }

    const selectedModel = modelListStore.model_list.find(model => model?.model_id === key);
    console.log('找到的模型:', selectedModel);

    if (selectedModel) {
      modelListStore.setCurrentModel(selectedModel);
      console.log('模型切换成功:', selectedModel.model_exhibit_name);
    } else {
      console.log('未找到对应的模型，key:', key);
      console.log('可用的模型ID列表:', modelListStore.model_list.map(m => m?.model_id));
    }
  }
};

// 直接处理模型选择（备用方法）
const handleDirectModelSelect = (modelId: string) => {
  console.log('直接模型选择，modelId:', modelId);
  console.log('当前模型列表:', modelListStore.model_list);

  if (!modelId) {
    console.log('modelId 为空，无法选择模型');
    return;
  }

  const selectedModel = modelListStore.model_list.find(model => model?.model_id === modelId);
  console.log('找到的模型:', selectedModel);

  if (selectedModel) {
    modelListStore.setCurrentModel(selectedModel);
    console.log('模型切换成功:', selectedModel.model_exhibit_name);
  } else {
    console.log('未找到对应的模型，modelId:', modelId);
    console.log('可用的模型ID列表:', modelListStore.model_list.map(m => m?.model_id));
  }
};

// 处理重试
const handleRetry = async () => {
  try {
    await modelListStore.retryGetModelList();
    if (!modelListStore.error) {
      message.success('模型列表获取成功');
    }
  } catch (error) {
    console.error('重试失败:', error);
  }
};

// 图标样式
const iconStyle = {
  fontSize: 18,
  color: token.value.colorText,
};

// 按钮样式
const buttonStyle = computed(() => ({
  ...iconStyle,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  border: 'none',
  boxShadow: 'none',
}));

// 菜单项
const menuItems = computed(() => {
  console.log('正在生成菜单项，原始模型列表:', modelListStore.model_list);

  const items = modelListStore.model_list
    .filter(model => {
      const hasId = model?.model_id;
      console.log('模型过滤检查:', model, '有ID:', hasId);
      return hasId;
    }) // 过滤掉没有 model_id 的项
    .map(model => {
      const item = {
        key: model.model_id,
        label: model.model_exhibit_name || '未知模型',
        extra: model.reasoning_model ? '🧠' : '💬', // 推理模型显示大脑图标，普通模型显示对话图标
      };
      console.log('生成菜单项:', item);
      return item;
    });

  console.log('菜单项已生成，总数:', items.length, '详细:', items);
  return items;
});

// 当前模型显示名称（带调试信息）
const currentDisplayName = computed(() => {
  const name = modelListStore.error ? '模型加载失败' : modelListStore.currentModelName;
  console.log('当前显示名称:', name, '当前模型:', modelListStore.current_model);
  return name;
});
</script>

<template>
  <div class="relative model-dropdown-container">
    <button
      @click.stop="toggleModelDropdown"
      class="model-selector-button flex items-center px-2.5 py-1 text-xs bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-all duration-200"
    >
      <span class="material-icons text-xs mr-1">flare</span>
      <span class="truncate max-w-24">{{ currentDisplayName }}</span>
      <span class="material-icons text-xs ml-1">{{ modelDropdownVisible ? 'expand_more' : 'expand_less' }}</span>
    </button>

    <Transition
      name="dropdown"
      appear
    >
      <div
        v-show="modelDropdownVisible"
        @click.stop
        :style="dropdownStyle"
        class="model-dropdown-menu bg-white border border-gray-200 rounded-lg shadow-lg"
      >
      <div class="p-3">
        <div class="text-xs text-gray-600 mb-3 font-medium">选择模型</div>
        <div class="space-y-1">
          <!-- 加载状态 -->
          <div v-if="modelListStore.loading" class="flex items-center justify-center py-4">
            <span class="text-sm text-gray-400">加载中...</span>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="modelListStore.error" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <div class="text-xs text-red-600 mb-2">{{ modelListStore.error }}</div>
            <div class="text-xs text-gray-500 mb-2">
              已重试 {{ modelListStore.retryCount }}/{{ modelListStore.maxRetries }} 次
            </div>
            <button
              @click="handleRetry"
              :disabled="modelListStore.loading"
              class="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              重试
            </button>
          </div>

          <!-- 模型列表 -->
          <div v-else-if="menuItems.length === 0" class="flex items-center justify-center py-4">
            <span class="text-sm text-gray-400">暂无可用模型</span>
          </div>

          <div
            v-else
            v-for="item in menuItems"
            :key="item.key"
            @click="selectModel(item.key, item.label)"
            :class="[
              'px-3 py-2 rounded-md cursor-pointer hover:bg-purple-50 flex items-center justify-between transition-all duration-200',
              modelListStore.current_model?.model_id === item.key ? 'bg-purple-100 border border-purple-200' : 'hover:border hover:border-purple-100'
            ]"
          >
            <span class="text-sm text-gray-700">{{ item.label }}</span>
            <div class="flex items-center space-x-1">
              <span class="text-xs">{{ item.extra }}</span>
              <span
                v-if="modelListStore.current_model?.model_id === item.key"
                class="material-icons text-sm text-gray-400"
              >check</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 模型下拉菜单容器样式 */
.model-dropdown-container {
  position: relative;
  z-index: 1000;
}

/* 模型选择器按钮样式 - 匹配help.html设计 */
.model-selector-button {
  height: 28px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  border: 1px solid rgba(124, 58, 237, 0.2) !important;
  box-shadow: 0 1px 3px rgba(124, 58, 237, 0.1) !important;
  min-width: 120px !important;
  max-width: 160px !important;
  background: #f3e8ff !important;
  color: #7c3aed !important;
  border-radius: 8px !important;
  transition: all 0.2s ease !important;
}

.model-selector-button:hover {
  background: #ede9fe !important;
  border-color: rgba(124, 58, 237, 0.3) !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15) !important;
  transform: translateY(-1px) !important;
}

.model-selector-button:active {
  transform: translateY(0) !important;
  box-shadow: 0 1px 3px rgba(124, 58, 237, 0.2) !important;
}

/* 确保点击外部区域时关闭下拉菜单 */
@media (max-width: 768px) {
  .w-48 {
    width: 12rem;
  }
}

/* 自定义滚动条样式 */
.space-y-1 {
  max-height: 300px;
  overflow-y: auto;
}

.space-y-1::-webkit-scrollbar {
  width: 4px;
}

.space-y-1::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.space-y-1::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.space-y-1::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 下拉菜单样式优化 - 匹配help.html设计 */
.model-dropdown-menu {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid rgba(124, 58, 237, 0.2) !important;
  background: white !important;
  z-index: 9999 !important;
  backdrop-filter: blur(8px);
  border-radius: 12px !important;
}

/* 模型选项样式 - 匹配help.html按钮样式 */
.model-dropdown-menu .space-y-1 > div {
  font-size: 13px !important;
  font-weight: 500 !important;
  color: #374151 !important;
  border-radius: 8px !important;
  transition: all 0.2s ease !important;
  border: 1px solid transparent !important;
}

.model-dropdown-menu .space-y-1 > div:hover {
  background: rgba(124, 58, 237, 0.1) !important;
  color: #7c3aed !important;
  border-color: rgba(124, 58, 237, 0.2) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15) !important;
}

.model-dropdown-menu .space-y-1 > div.bg-purple-100 {
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%) !important;
  border-color: #c4b5fd !important;
  color: #7c3aed !important;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15) !important;
}

/* 下拉菜单过渡动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* 确保 Material Icons 正确显示 */
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}
</style>
