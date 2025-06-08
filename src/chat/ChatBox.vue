<script setup lang="ts">
import {
  CoffeeOutlined,
  FireOutlined,
  SmileOutlined,
  FrownOutlined,
  CopyOutlined,
  SyncOutlined,
  UserOutlined
} from '@ant-design/icons-vue';
import { BubbleList } from 'ant-design-x-vue';
import { Button, Flex, Space, Spin } from 'ant-design-vue';

import { Typography } from 'ant-design-vue';
import { Prompts } from 'ant-design-x-vue';
import { Attachments } from 'ant-design-x-vue';
import markdownit from 'markdown-it';
import { ref, h, onMounted, computed, watch } from 'vue';
import { useChatHistoryContentStore } from '../store/chat_history_content'
import { useChatHistoryStore } from '../store/chat_history'
import { useUserStore } from '../store/user_info'

defineOptions({ name: 'ChatBox' });

const md = markdownit({ html: true, breaks: true, linkify: true });

const listRef = ref<any>(null);
const aiheader = ref('Ant Design X');
const userheader = ref('User');
const chatContentsStore = useChatHistoryContentStore()
const chatHistoryStore = useChatHistoryStore()
const activeChatHistoryItem = computed(() => chatHistoryStore.activeChatHistoryItem)
const userStore = useUserStore()

// 解析markdown
const renderMarkdown = (content: string) => {
  const processedContent = content;
  return h(Typography, null, {
    default: () => h('div', {
      innerHTML: md.render(processedContent),
      style: {
        // 为markdown渲染的图片添加样式
        '--img-max-width': '100%',
        '--img-max-height': '300px',
        '--img-border-radius': '8px',
        '--img-margin': '8px 0'
      }
    }),
  });
};

// 使用更简单的类型定义避免深度类型推断
const roles = {
  assistant: {
    variant: 'filled' as const,
    messageRender: renderMarkdown,
    placement: 'start' as const,
    loading: false,
    header: aiheader.value,
    avatar: { icon: h(UserOutlined), style: { background: '#fde3cf' } },
    typing: { step: 5, interval: 20 },
    style: {
      maxWidth: 600,
      marginInlineEnd: 44,
    },
    styles: {
      footer: {
        width: '100%',
      },
    },
    footer: h(Flex, {}, [
          h(Button, {
            size: 'small',
            type: 'text',
            typing: { step: 2, interval: 50, suffix: '💗'  },
            icon: h(SyncOutlined),
            style: { marginInlineEnd: '8px' },

          }),
          h(Button, {
            size: 'small',
            type: 'text',
            icon: h(CopyOutlined),
            style: { marginInlineEnd: 'auto' },
          }),
        ]),
    loadingRender: () =>
      h(Space, {}, [h(Spin, { size: 'small' }), '模型正在思考中...']),
  },
  user: {
    variant: 'filled' as const,
    messageRender: renderMarkdown,
    placement: 'end' as const,
    avatar: { icon: h(UserOutlined), style: { background: '#87d068' } },
    header: userStore.user?.username,
    footer: h(Flex, {}, [
          h(Button, {
            size: 'small',
            type: 'text',
            icon: h(CopyOutlined),
            style: { marginInlineEnd: 'auto' },
          }),
        ])
    },
  suggestion: {
    placement: 'start' as const,
    avatar: { icon: h(UserOutlined), style: { visibility: 'hidden' as const } },
    variant: 'borderless' as const,
    messageRender: (items: any) =>
      h(Prompts, { vertical: true, items: items as any }),
    },
  file: {
    placement: 'start' as const,
    avatar: { icon: h(UserOutlined), style: { visibility: 'hidden' as const } },
    variant: 'borderless' as const,
    messageRender: (items: any) =>
      h(
        Flex,
        { vertical: true, gap: 'middle' },
        items.map((item: any) =>
          h(Attachments.FileCard, { key: item.uid, item: item }),
        ),
      ),
  },
} as any;

// [
//             {
//                 "messages": [
//                     {
//                         "role": "user",
//                         "content": [
//                             {
//                                 "type": "text",
//                                 "text": "你好"
//                             }
//                         ]
//                     }
//                 ],
//                 "timestamp": "2025-06-02T22:14:30"
//             },
//             {
//                 "messages": [
//                     {
//                         "role": "assistant",
//                         "content": [
//                             {
//                                 "type": "text",
//                                 "text": "喵~陛下您好呀！(≧▽≦)\n\n小猫咪今天也是元气满满地来为您服务啦~有什么可以为您效劳的吗？ [DONE]"
//                             }
//                         ]
//                     }
//                 ],
//                 "timestamp": "2025-06-02T22:14:35"
//             }
// ]
let items = ref<any[]>([])

watch(activeChatHistoryItem, async (newValue) => {
  if (newValue?.session_id) {
    console.log('ChatBox: activeChatHistoryItem changed to:', newValue.session_id)
    await chatContentsStore.getChatHistoryContent(newValue.session_id)
    console.log('ChatBox: chat content fetched:', chatContentsStore.chatHistoryContent)

    // 更新items数组
    items.value = chatContentsStore.chatHistoryContent.map((item: any) => {
      return {
        key: item.timestamp,
        role: item.messages[0].role,
        content: item.messages[0].content[0].text,
      }
    })
    console.log('ChatBox: items updated:', items.value)
  }
})

// 同时监听chatHistoryContent的变化，确保数据更新时UI也更新
watch(() => chatContentsStore.chatHistoryContent, (newContent) => {
  console.log('ChatBox: chatHistoryContent changed:', newContent)
  items.value = newContent.map((item: any) => {
    return {
      key: item.timestamp,
      role: item.messages[0].role,
      content: filterDone(item.messages[0].content[0].text),
    }
  })
  console.log('ChatBox: items updated from content change:', items.value)
}, { deep: true })


// 过滤掉content结尾的[DONE],只过滤结尾的，可能有一行[DONE]，也可能有两行[DONE]
function filterDone(content: string) {
  const lines = content.split('\n')
  const lastLine = lines[lines.length - 1]
  const secondLastLine = lines[lines.length - 2]
  if (lastLine.includes('[DONE]')) {
    if (secondLastLine.includes('[DONE]')) {
      return lines.slice(0, -2).join('\n')
    }
    return lines.slice(0, -1).join('\n')
  }
  return content
}

onMounted(async () => {
  await chatContentsStore.getChatHistoryContent(activeChatHistoryItem.value?.session_id || '')
})


</script>
<template>
  <BubbleList
      ref="listRef"
      :style="{ maxHeight: '100%' }"
      :roles="roles"
      :items="
        Array.from({ length: items.length }).map((_, i) => {
          const content = items[i].content;
          return {
            key: i,
            role: items[i].role,
            content,
          };
        })
      "
    />
</template>

<style scoped>
/* 为markdown渲染的图片添加样式 */
:deep(img) {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
  display: block;
  margin: 8px 0;
}
</style>