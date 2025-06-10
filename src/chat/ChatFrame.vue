<script setup lang="ts">
import { ApiOutlined, SearchOutlined, CloudUploadOutlined, PaperClipOutlined } from '@ant-design/icons-vue';
import { Button, Divider, Flex, Switch, theme, message } from 'ant-design-vue';
import { Sender, Attachments } from 'ant-design-x-vue';
import { ref, watch, h, computed } from 'vue';
import ModelList from './model_list.vue';
import { useUserInputStore } from '../store/user_input'
import { useModelListStore } from '../store/model_list'
import { useUserStore } from '../store/user_info'
import { useFileAttachmentsStore } from '../store/file_attachments'

defineOptions({ name: 'ChatFrame' });

const { token } = theme.useToken();
const loading = ref<boolean>(false);
const value = ref<string>('');
const userInputStore = useUserInputStore()
const modelListStore = useModelListStore()
const userStore = useUserStore()
const fileAttachmentsStore = useFileAttachmentsStore()

const open = ref(false);
const attachmentsRef = ref(null);

// Convert file attachments to Ant Design X format
const attachmentItems = computed(() => {
  return fileAttachmentsStore.attachments.map(attachment => ({
    uid: attachment.file_id,
    name: attachment.filename,
    status: attachment.upload_status,
    size: attachment.file_size,
    url: attachment.public_url,
    thumbUrl: attachment.file_type === 'image' ? attachment.public_url : undefined,
    percent: attachment.upload_progress,
    response: attachment.error_message
  }))
})

const placeholder = (type: 'inline' | 'drop') =>
  type === 'drop'
    ? {
      title: 'Drop file here',
    }
    : {
      icon: h(CloudUploadOutlined),
      title: 'Click or drag files to upload',
      description: 'Support file type: image, video, audio, document, etc.',
    }

// Handle custom request for Ant Design Upload
const handleCustomRequest = async (options: any) => {
  try {
    await fileAttachmentsStore.uploadFile(options.file)
    message.success(`${options.file.name} uploaded successfully`)
    options.onSuccess?.(options.file)
  } catch (error) {
    console.error('File upload error:', error)
    message.error(`Failed to upload ${options.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    options.onError?.(error)
  }
}

// Handle file removal
const handleFileRemove = (file: any) => {
  fileAttachmentsStore.removeFileFromStore(file.uid)
  message.success(`${file.name} removed`)
  return false // Prevent default removal behavior
}

// Handle file change events
const handleFileChange = ({ fileList }: { fileList: any[] }) => {
  // This is handled by our custom upload logic
  console.log('File list changed:', fileList)
}

const iconStyle = {
  fontSize: 18,
  color: token.value.colorText,
}

// 监听聊天框，用户输入文字时，将文字赋值给userInputStore.user_input.text
watch(value, (newVal) => {
  userInputStore.update_user_input('text', newVal)
  console.log('userInputStore.user_input.text', userInputStore.user_input.text)
})

// 监听文件附件变化，同步到用户输入store
watch(() => fileAttachmentsStore.images_url, (newImages) => {
  userInputStore.update_user_input('images', newImages)
}, { deep: true })

watch(() => fileAttachmentsStore.files_url, (newFiles) => {
  userInputStore.update_user_input('file_list', [...fileAttachmentsStore.documents_url, ...newFiles])
}, { deep: true })

watch(() => fileAttachmentsStore.documents_url, (newDocs) => {
  userInputStore.update_user_input('file_list', [...newDocs, ...fileAttachmentsStore.files_url])
}, { deep: true })

function handleSendChat() {
  userInputStore.sendChat()
  // Clear attachments after sending
  fileAttachmentsStore.clearAllAttachments()
  // Close attachments panel
  open.value = false
}

function handleCancel() {
  // Reset the text input
  userInputStore.update_user_input('text', '')
  value.value = ''
  // Clear attachments
  fileAttachmentsStore.clearAllAttachments()
  // Close attachments panel
  open.value = false
}

const rewrite = () => {
  console.log('rewrite')
};

const dataAnalysis = () => {
  console.log('dataAnalysis')
};

const translate = () => {
  console.log('translate')
};

const mindMap = () => {
  console.log('mindMap')
};

const email = () => {
  // 调用邮箱接口
  userInputStore.update_user_input('email', true)
  console.log('email')
};

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
  <div>
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
    <template #header>
      <Flex wrap="wrap" :gap="30" align="center">
      <Button @click="translate" type="text" size="small">
      翻译
      </Button>
      <Button @click="mindMap" type="text">
      思维导图
      </Button>
      <Button @click="dataAnalysis" type="text">
      数据分析
      </Button>
      <Button @click="rewrite" type="text">
      改写
      </Button>
      <Button @click="email" type="text">
      邮件
      </Button>
      </Flex>
    </template>
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
            :icon="h(PaperClipOutlined)"
            @click="open = !open"
            title="Attach files"
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

  <!-- File Attachments Component -->
  <Attachments
    v-if="open"
    ref="attachmentsRef"
    :items="attachmentItems"
    :placeholder="placeholder"
    :beforeUpload="() => false"
    :customRequest="handleCustomRequest"
    :onRemove="handleFileRemove"
    :onChange="handleFileChange"
    style="margin-top: 8px; border-radius: 8px; background: #fafafa;"
  />
  </div>
</template>