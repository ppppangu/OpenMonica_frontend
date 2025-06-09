<script setup lang="ts">
import { ApiOutlined, LinkOutlined, SearchOutlined, CloudUploadOutlined } from '@ant-design/icons-vue';
import { Button, Divider, Flex, Switch, theme } from 'ant-design-vue';
import { Sender } from 'ant-design-x-vue';
import { ref, watch, h } from 'vue';
import ModelList from './model_list.vue';
import { useUserInputStore } from '../store/user_input'
import { useModelListStore } from '../store/model_list'
import { useUserStore } from '../store/user_info'

defineOptions({ name: 'ChatFrame' });

const { token } = theme.useToken();
const loading = ref<boolean>(false);
const value = ref<string>('');
const userInputStore = useUserInputStore()
const modelListStore = useModelListStore()
const userStore = useUserStore()

const open = ref(false);
const attachmentsRef = ref(null);
const fileRawList = ref([])

const placeholder = (type) =>
  type === 'drop'
    ? {
      title: 'Drop file here',
    }
    : {
      icon: h(CloudUploadOutlined),
      title: 'Upload files',
      description: 'Click or drag files to this area to upload',
    }

const pastFile = (_, files) => {
  console.log("past")
  for (const file of files) {
    attachmentsRef.value?.upload(file);
  }
  open.value = true;
}

const fileChange = ({ fileList }) => fileRawList.value = fileList

const iconStyle = {
  fontSize: 18,
  color: token.value.colorText,
}

// 监听聊天框，用户输入文字时，将文字赋值给userInputStore.user_input.text
watch(value, (newVal) => {
  userInputStore.update_user_input('text', newVal)
  console.log('userInputStore.user_input.text', userInputStore.user_input.text)
})

function handleSendChat() {
  userInputStore.sendChat()
}

function handleCancel() {
  // Reset the text input
  userInputStore.update_user_input('text', '')
  value.value = ''
}

watch(loading, () => {
  if (loading.value) {
    const timer = setTimeout(() => {
      loading.value = false;
      value.value = '';

      console.log('Send message successfully!');
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }
});
</script>
<template>
  <InputApp>
  <Sender
    :value="value"
    :on-change="(v) => {
      value = v;
    }"
    placeholder="Press Enter to send message"
    :on-submit="handleSendChat"
    :on-cancel="handleCancel"
    :actions="false"
  >
    <template #footer="{ info: { components: { SendButton, LoadingButton, SpeechButton } } }">
      <Flex
        justify="space-between"
        align="center"
      >
        <Flex
          gap="small"
          align="center"
        >
          <ModelList :model_list="modelListStore.model_list" :user_id="userStore.user?.id" />
          <Divider type="vertical" />
          Deep Thinking
          <Switch size="small" />
          <Divider type="vertical" />
          <Button :icon="h(SearchOutlined)">
            Global Search
          </Button>
        </Flex>
        <Flex align="center">
          <Button
            :style="iconStyle"
            type="text"
            :icon="h(LinkOutlined)"
            @click="open = !open"
          />
          <Divider type="vertical" />
          <component
            :is="SpeechButton"
            :style="iconStyle"
          />
          <Divider type="vertical" />
          <component
            :is="LoadingButton"
            v-if="loading"
            type="default"
          />
          <component
            :is="SendButton"
            v-else
            type="primary"
            :disabled="false"
          />
        </Flex>
      </Flex>
    </template>
  </Sender>    
  </InputApp>
</template>