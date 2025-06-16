<template>
  <div class="bubble-settings-popup">
    <div class="settings-section">
      <h3 class="section-title">Display Mode</h3>
      <div class="setting-group">
        <a-radio-group
          v-model:value="localSettings.displayMode"
          @change="updateSetting('displayMode', $event.target.value)"
        >
          <a-radio value="bubble">Bubble Style</a-radio>
          <a-radio value="plain">Plain Style</a-radio>
        </a-radio-group>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">Theme</h3>
      <div class="setting-group">
        <a-radio-group
          v-model:value="localSettings.theme"
          @change="updateSetting('theme', $event.target.value)"
        >
          <a-radio value="purple">Purple</a-radio>
          <a-radio value="default">Default</a-radio>
          <a-radio value="minimal">Minimal</a-radio>
        </a-radio-group>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">Animation</h3>
      <div class="setting-group">
        <a-select
          v-model:value="localSettings.animation"
          @change="updateSetting('animation', $event)"
          style="width: 100%"
        >
          <a-select-option value="none">None</a-select-option>
          <a-select-option value="fade">Fade</a-select-option>
          <a-select-option value="slide">Slide</a-select-option>
          <a-select-option value="bounce">Bounce</a-select-option>
        </a-select>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">Display Options</h3>
      <div class="setting-group">
        <div class="checkbox-item">
          <a-checkbox
            v-model:checked="localSettings.showAvatars"
            @change="updateSetting('showAvatars', $event.target.checked)"
          >
            Show Avatars
          </a-checkbox>
        </div>
        <div class="checkbox-item">
          <a-checkbox
            v-model:checked="localSettings.showTimestamps"
            @change="updateSetting('showTimestamps', $event.target.checked)"
          >
            Show Timestamps
          </a-checkbox>
        </div>
        <div class="checkbox-item">
          <a-checkbox
            v-model:checked="localSettings.compactMode"
            @change="updateSetting('compactMode', $event.target.checked)"
          >
            Compact Mode
          </a-checkbox>
        </div>
        <div class="checkbox-item">
          <a-checkbox
            v-model:checked="localSettings.enableTypingEffect"
            @change="updateSetting('enableTypingEffect', $event.target.checked)"
          >
            Enable Typing Effect
          </a-checkbox>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">Bubble Dimensions</h3>
      <div class="setting-group">
        <div class="slider-item">
          <label>Max Width: {{ localSettings.maxBubbleWidth }}px</label>
          <a-slider
            v-model:value="localSettings.maxBubbleWidth"
            :min="300"
            :max="800"
            @change="updateSetting('maxBubbleWidth', $event)"
          />
        </div>
        <div class="slider-item">
          <label>Border Radius: {{ localSettings.borderRadius }}px</label>
          <a-slider
            v-model:value="localSettings.borderRadius"
            :min="0"
            :max="24"
            @change="updateSetting('borderRadius', $event)"
          />
        </div>
        <div class="slider-item">
          <label>Spacing: {{ localSettings.spacing }}px</label>
          <a-slider
            v-model:value="localSettings.spacing"
            :min="4"
            :max="16"
            @change="updateSetting('spacing', $event)"
          />
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3 class="section-title">Preview</h3>
      <div class="preview-container" :style="bubbleStyles">
        <div class="preview-bubble user-bubble">
          <div class="bubble-content">This is a user message preview</div>
        </div>
        <div class="preview-bubble assistant-bubble">
          <div class="bubble-content">This is an assistant message preview with longer content to show how it wraps</div>
        </div>
      </div>
    </div>

    <div class="settings-actions">
      <a-button @click="resetToDefaults" style="margin-right: 8px;">
        Reset to Defaults
      </a-button>
      <a-button type="primary" @click="handleSave">
        Save Settings
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  RadioGroup as ARadioGroup,
  Radio as ARadio,
  Select as ASelect,
  SelectOption as ASelectOption,
  Checkbox as ACheckbox,
  Slider as ASlider,
  Button as AButton
} from 'ant-design-vue'
import { useBubbleSettingsStore, type BubbleSettings } from '../../store/bubble_settings'

interface Props {
  popupId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'ok', result: BubbleSettings): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bubbleStore = useBubbleSettingsStore()

// Local copy of settings for editing
const localSettings = ref<BubbleSettings>({ ...bubbleStore.settings })

// Computed styles for preview
const bubbleStyles = computed(() => ({
  '--bubble-max-width': `${localSettings.value.maxBubbleWidth}px`,
  '--bubble-border-radius': `${localSettings.value.borderRadius}px`,
  '--bubble-spacing': `${localSettings.value.spacing}px`
}))

// Watch for changes in store settings
watch(() => bubbleStore.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

// Methods
function updateSetting<K extends keyof BubbleSettings>(
  key: K,
  value: BubbleSettings[K]
): void {
  localSettings.value[key] = value
  // Apply changes immediately for preview
  bubbleStore.updateSetting(key, value)
}

function resetToDefaults(): void {
  bubbleStore.resetToDefaults()
  localSettings.value = { ...bubbleStore.settings }
}

function handleSave(): void {
  bubbleStore.updateSettings(localSettings.value)
  emit('ok', localSettings.value)
}

// Static methods for popup management
export async function show(): Promise<BubbleSettings> {
  const { usePopupManagerStore } = await import('../../store/popup_manager')
  const popupStore = usePopupManagerStore()

  return popupStore.show({
    component: 'BubbleSettingsPopup',
    title: 'Bubble Display Settings',
    width: 600,
    height: 700,
    className: 'bubble-settings-modal'
  })
}

export async function hide(popupId?: string): Promise<void> {
  const { usePopupManagerStore } = await import('../../store/popup_manager')
  const popupStore = usePopupManagerStore()

  if (popupId) {
    popupStore.hide(popupId)
  } else {
    // Hide all bubble settings popups
    popupStore.visiblePopups.forEach(popup => {
      if (popup.component === 'BubbleSettingsPopup') {
        popupStore.hide(popup.id)
      }
    })
  }
}
</script>

<style scoped>
.bubble-settings-popup {
  padding: 0;
}

.settings-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 12px 0;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
}

.slider-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-item label {
  font-size: 14px;
  color: #595959;
  font-weight: 500;
}

.preview-container {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: var(--bubble-spacing, 8px);
}

.preview-bubble {
  max-width: var(--bubble-max-width, 600px);
  border-radius: var(--bubble-border-radius, 12px);
  padding: 12px 16px;
  position: relative;
}

.user-bubble {
  background: #8b5cf6;
  color: white;
  align-self: flex-end;
  margin-left: 20%;
}

.assistant-bubble {
  background: white;
  color: #262626;
  border: 1px solid #e8e8e8;
  align-self: flex-start;
  margin-right: 20%;
}

.bubble-content {
  font-size: 14px;
  line-height: 1.5;
}

.settings-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

/* Purple theme styling */
:deep(.ant-radio-checked .ant-radio-inner) {
  border-color: #8b5cf6;
  background-color: #8b5cf6;
}

:deep(.ant-radio:hover .ant-radio-inner) {
  border-color: #8b5cf6;
}

:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  background-color: #8b5cf6;
  border-color: #8b5cf6;
}

:deep(.ant-checkbox:hover .ant-checkbox-inner) {
  border-color: #8b5cf6;
}

:deep(.ant-slider-track) {
  background-color: #8b5cf6;
}

:deep(.ant-slider-handle) {
  border-color: #8b5cf6;
}

:deep(.ant-slider:hover .ant-slider-track) {
  background-color: #7c3aed;
}

:deep(.ant-select-focused .ant-select-selector) {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}
</style>
