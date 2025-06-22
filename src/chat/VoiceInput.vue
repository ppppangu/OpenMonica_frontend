<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Button, message, Tooltip } from 'ant-design-vue'
import { AudioOutlined, AudioMutedOutlined, LoadingOutlined } from '@ant-design/icons-vue'

defineOptions({ name: 'VoiceInput' })

// Props
interface Props {
  onTranscript?: (text: string) => void
  language?: string
  continuous?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  language: 'zh-CN',
  continuous: false
})

// Emits
const emit = defineEmits<{
  transcript: [text: string]
  start: []
  stop: []
  error: [error: string]
}>()

// State
const isRecording = ref(false)
const isSupported = ref(false)
const transcript = ref('')
const interimTranscript = ref('')
const recognition = ref<SpeechRecognition | null>(null)

// Computed
const buttonIcon = computed(() => {
  if (isRecording.value) {
    return LoadingOutlined
  }
  return isSupported.value ? AudioOutlined : AudioMutedOutlined
})

const buttonType = computed(() => {
  return isRecording.value ? 'primary' : 'text'
})

const buttonTitle = computed(() => {
  if (!isSupported.value) {
    return 'Speech recognition not supported in this browser'
  }
  return isRecording.value ? 'Stop recording' : 'Start voice input'
})

// Initialize speech recognition
const initSpeechRecognition = () => {
  // Check for browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported in this browser')
    isSupported.value = false
    return
  }

  isSupported.value = true
  recognition.value = new SpeechRecognition()

  // Configure recognition
  recognition.value.continuous = props.continuous
  recognition.value.interimResults = true
  recognition.value.lang = props.language
  recognition.value.maxAlternatives = 1

  // Event handlers
  recognition.value.onstart = () => {
    console.log('🎤 Speech recognition started')
    isRecording.value = true
    transcript.value = ''
    interimTranscript.value = ''
    emit('start')
  }

  recognition.value.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = ''
    let interim = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const transcriptText = result[0].transcript

      if (result.isFinal) {
        finalTranscript += transcriptText
      } else {
        interim += transcriptText
      }
    }

    if (finalTranscript) {
      transcript.value = finalTranscript
      console.log('🎤 Final transcript:', finalTranscript)
      
      // Emit transcript
      emit('transcript', finalTranscript)
      props.onTranscript?.(finalTranscript)
      
      // Show success message
      message.success(`Voice input: "${finalTranscript}"`)
    }

    interimTranscript.value = interim
    console.log('🎤 Interim transcript:', interim)
  }

  recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('🎤 Speech recognition error:', event.error)
    isRecording.value = false
    
    let errorMessage = 'Speech recognition error'
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected. Please try again.'
        break
      case 'audio-capture':
        errorMessage = 'Microphone not accessible. Please check permissions.'
        break
      case 'not-allowed':
        errorMessage = 'Microphone permission denied. Please allow microphone access.'
        break
      case 'network':
        errorMessage = 'Network error occurred during speech recognition.'
        break
      case 'aborted':
        errorMessage = 'Speech recognition was aborted.'
        break
      default:
        errorMessage = `Speech recognition error: ${event.error}`
    }
    
    message.error(errorMessage)
    emit('error', errorMessage)
  }

  recognition.value.onend = () => {
    console.log('🎤 Speech recognition ended')
    isRecording.value = false
    emit('stop')
  }
}

// Start recording
const startRecording = () => {
  if (!recognition.value || isRecording.value) return

  try {
    recognition.value.start()
  } catch (error) {
    console.error('Failed to start speech recognition:', error)
    message.error('Failed to start voice input')
  }
}

// Stop recording
const stopRecording = () => {
  if (!recognition.value || !isRecording.value) return

  try {
    recognition.value.stop()
  } catch (error) {
    console.error('Failed to stop speech recognition:', error)
  }
}

// Toggle recording
const toggleRecording = () => {
  if (!isSupported.value) {
    message.warning('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
    return
  }

  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// Lifecycle
onMounted(() => {
  initSpeechRecognition()
})

onUnmounted(() => {
  if (recognition.value && isRecording.value) {
    recognition.value.stop()
  }
})

// Expose methods for parent component
defineExpose({
  startRecording,
  stopRecording,
  toggleRecording,
  isRecording: readonly(isRecording),
  isSupported: readonly(isSupported),
  transcript: readonly(transcript)
})
</script>

<template>
  <div class="voice-input-container">
    <Tooltip :title="buttonTitle">
      <Button
        :type="buttonType"
        size="small"
        :icon="buttonIcon"
        @click="toggleRecording"
        :disabled="!isSupported"
        :loading="isRecording"
        class="voice-input-button"
        :class="{
          'recording': isRecording,
          'unsupported': !isSupported
        }"
      />
    </Tooltip>

    <!-- Interim transcript display (optional) -->
    <div v-if="isRecording && interimTranscript" class="interim-transcript">
      <small>{{ interimTranscript }}</small>
    </div>
  </div>
</template>

<style scoped>
.voice-input-container {
  position: relative;
}

.voice-input-button {
  transition: all 0.3s ease !important;
}

.voice-input-button.recording {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  border-color: #dc2626 !important;
  color: white !important;
  animation: pulse 1.5s infinite;
}

.voice-input-button.unsupported {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.voice-input-button:not(.recording):not(.unsupported):hover {
  background: rgba(124, 58, 237, 0.1) !important;
  border-color: rgba(124, 58, 237, 0.3) !important;
  color: #7c3aed !important;
}

.interim-transcript {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 1000;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .interim-transcript {
    max-width: 150px;
    font-size: 10px;
  }
}
</style>
