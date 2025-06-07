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
import { Button, Flex, Space, Spin, Avatar, theme, Switch } from 'ant-design-vue';
import type { Bubble, BubbleListProps, BubbleProps } from 'ant-design-x-vue';
import type { SwitchProps } from 'ant-design-vue';
import { Typography } from 'ant-design-vue';
import { Prompts } from 'ant-design-x-vue';
import { Attachments } from 'ant-design-x-vue';
import markdownit from 'markdown-it';
import type { computed, CSSProperties } from 'vue';
import { onWatcherCleanup, ref, watchEffect, h } from 'vue';
import { ThoughtChain, XStream } from 'ant-design-x-vue';

defineOptions({ name: 'ChatBox' });

const { token } = theme.useToken();
const md = markdownit({ html: true, breaks: true });
const listRef = ref<InstanceType<typeof BubbleList>>(null);
const aiheader = ref('Ant Design X');
const userheader = ref('User');


// // 解析markdown
const renderMarkdown: BubbleProps['messageRender'] = (content) =>
  h(Typography, null, {
    default: () => h('div', { innerHTML: md.render(content) }),
  });

// const text = `
// > Render as markdown content to show rich text!

// Link: [Ant Design X](https://x.ant.design)
// `.trim();

const roles: BubbleListProps['roles'] = {
  ai: {
    placement: 'start',
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
    placement: 'end',
    avatar: { icon: h(UserOutlined), style: { background: '#87d068' } },
    header: userheader.value,
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
    placement: 'start',
    avatar: { icon: h(UserOutlined), style: { visibility: 'hidden' } },
    variant: 'borderless',
    messageRender: (items) =>
      h(Prompts, { vertical: true, items: items as any }),
    },
  file: {
    placement: 'start',
    avatar: { icon: h(UserOutlined), style: { visibility: 'hidden' } },
    variant: 'borderless',
    messageRender: (items: any) =>
      h(
        Flex,
        { vertical: true, gap: 'middle' },
        items.map((item: any) =>
          h(Attachments.FileCard, { key: item.uid, item: item }),
        ),
      ),
  },
};



const fooAvatar: CSSProperties = {
  color: '#f56a00',
  backgroundColor: '#fde3cf',
};

const barAvatar: CSSProperties = {
  color: '#fff',
  backgroundColor: '#87d068',
};

</script>

<template>
  <BubbleList
    ref="listRef"
    :style="{ maxHeight: '300px' }"
    :roles="roles"
    :items="[
      {
        variant: 'filled',
        key: '8',
        role: 'ai',
        content: '- Mock welcome content.\n '.repeat(10),
        messageRender: renderMarkdown,
        placement: 'start',
        loading: false,
        header: aiheader,
        avatar: { style: barAvatar }
      },
      {
        key: 'ask',
        role: 'user',
        content: 'Mock user content.',
        avatar: { style: fooAvatar },
      },
      {
        key: 'ai',
        role: 'ai',
        loading: true,
        avatar: { style: barAvatar },
    },
      // Role: suggestion
      {
        key: 2,
        role: 'suggestion',
        content: [
          {
            key: '6',
            icon: h(CoffeeOutlined, { style: { color: '#964B00' } }),
            description: 'How to rest effectively after long hours of work?',
          },
          {
            key: '7',
            icon: h(SmileOutlined, { style: { color: '#FAAD14' } }),
            description:
              'What are the secrets to maintaining a positive mindset?',
          },
          {
            key: '8',
            icon: h(FireOutlined, { style: { color: '#FF4D4F' } }),
            description: 'How to stay calm under immense pressure?',
          },
        ],
      },
      // Role: file
      {
        key: 3,
        role: 'file',
        content: [
          {
            uid: '1',
            name: 'excel-file.xlsx',
            size: 111111,
            description: 'Checking the data',
          },
          {
            uid: '2',
            name: 'word-file.docx',
            size: 222222,
            status: 'uploading',
            percent: 23,
          },
        ],
      },
    ]"
  />
</template>