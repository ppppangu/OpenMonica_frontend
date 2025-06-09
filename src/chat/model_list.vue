<script setup lang="ts">
import { RobotOutlined, DownOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { Button, Dropdown, theme, message } from 'ant-design-vue';
import { h, onMounted, computed } from 'vue';
import { useModelListStore } from '../store/model_list';

defineOptions({ name: 'ModelList' });

const { token } = theme.useToken();
const modelListStore = useModelListStore();

// 组件挂载时获取模型列表
onMounted(async () => {
  console.log('ModelList 组件挂载，开始获取模型列表');
  await modelListStore.get_model_list();
  console.log('模型列表获取完成，当前模型:', modelListStore.current_model);
  console.log('当前模型显示名称:', modelListStore.currentModelName);
});

// 处理模型选择
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
  <Dropdown
    placement="topLeft"
    :trigger="['click']"
  >
    <Button
      type="text"
      :style="buttonStyle"
      :loading="modelListStore.loading"
    >
      <template #icon>
        <RobotOutlined v-if="!modelListStore.error" />
        <ExclamationCircleOutlined v-else :style="{ color: '#ff4d4f' }" />
      </template>
      {{ currentDisplayName }}
      <DownOutlined :style="{ fontSize: '12px', marginLeft: '4px' }" />
    </Button>

    <template #overlay>
      <a-menu
        @click="handleModelSelect"
        :selectedKeys="modelListStore.current_model ? [modelListStore.current_model.model_id] : []"
      >
        <!-- 显示错误状态和重试选项 -->
        <a-menu-item v-if="modelListStore.error" key="error-item" disabled>
          <div style="padding: 8px 0; text-align: center;">
            <div style="color: #ff4d4f; margin-bottom: 8px; font-size: 12px;">
              {{ modelListStore.error }}
            </div>
            <div style="font-size: 11px; color: #8c8c8c; margin-bottom: 8px;">
              已重试 {{ modelListStore.retryCount }}/{{ modelListStore.maxRetries }} 次
            </div>
            <Button
              size="small"
              type="primary"
              :loading="modelListStore.loading"
              @click.stop="handleRetry"
              style="font-size: 11px; height: 24px;"
            >
              <template #icon>
                <ReloadOutlined />
              </template>
              重试
            </Button>
          </div>
        </a-menu-item>

        <!-- 分隔线 -->
        <a-menu-divider v-if="modelListStore.error && menuItems.length > 0" />

        <!-- 模型列表 -->
        <a-menu-item
          v-for="item in menuItems"
          :key="item.key"
          :data-model-id="item.key"
          :style="{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minWidth: '200px'
          }"
          @click="() => handleDirectModelSelect(item.key)"
        >
          <span>{{ item.label }}</span>
          <span>{{ item.extra }}</span>
        </a-menu-item>

        <!-- 无模型时的提示 -->
        <a-menu-item v-if="menuItems.length === 0 && !modelListStore.error" key="no-models" disabled>
          <span>暂无可用模型</span>
        </a-menu-item>
      </a-menu>
    </template>
  </Dropdown>
</template>

<style scoped>
/* 确保下拉菜单向上展开 */
:deep(.ant-dropdown) {
  transform-origin: center bottom;
}

/* 菜单项悬停效果 */
:deep(.ant-menu-item:hover) {
  background-color: var(--ant-primary-color-hover);
}

/* 选中的菜单项样式 */
:deep(.ant-menu-item-selected) {
  background-color: var(--ant-primary-color);
  color: white;
}

/* 错误状态菜单项样式 */
:deep(.ant-menu-item.error-item) {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  margin: 4px;
  border-radius: 4px;
}

:deep(.ant-menu-item.error-item:hover) {
  background-color: #fff2f0;
}

/* 重试按钮样式 */
:deep(.retry-button) {
  transition: all 0.3s ease;
}

:deep(.retry-button:hover) {
  transform: scale(1.05);
}
</style>
