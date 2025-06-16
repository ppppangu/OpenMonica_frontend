import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type BubbleDisplayMode = 'plain' | 'bubble'
export type BubbleTheme = 'default' | 'purple' | 'minimal'
export type BubbleAnimation = 'none' | 'fade' | 'slide' | 'bounce'

export interface BubbleSettings {
  displayMode: BubbleDisplayMode
  theme: BubbleTheme
  animation: BubbleAnimation
  showAvatars: boolean
  showTimestamps: boolean
  compactMode: boolean
  enableTypingEffect: boolean
  maxBubbleWidth: number
  borderRadius: number
  spacing: number
}

export const useBubbleSettingsStore = defineStore('bubbleSettings', () => {
  // Default settings
  const settings = ref<BubbleSettings>({
    displayMode: 'bubble',
    theme: 'purple',
    animation: 'fade',
    showAvatars: true,
    showTimestamps: false,
    compactMode: false,
    enableTypingEffect: false,
    maxBubbleWidth: 600,
    borderRadius: 12,
    spacing: 8
  })

  // Computed properties for CSS variables
  const bubbleStyles = computed(() => ({
    '--bubble-max-width': `${settings.value.maxBubbleWidth}px`,
    '--bubble-border-radius': `${settings.value.borderRadius}px`,
    '--bubble-spacing': `${settings.value.spacing}px`,
    '--bubble-animation-duration': settings.value.animation === 'none' ? '0s' : '0.3s'
  }))

  // Theme-specific color schemes
  const themeColors = computed(() => {
    switch (settings.value.theme) {
      case 'purple':
        return {
          primary: '#8b5cf6',
          primaryHover: '#7c3aed',
          secondary: '#6d28d9',
          background: '#f8f9fa',
          userBubble: '#8b5cf6',
          assistantBubble: '#f1f3f4',
          border: '#e8e8e8',
          text: '#262626',
          textSecondary: '#8c8c8c'
        }
      case 'minimal':
        return {
          primary: '#6b7280',
          primaryHover: '#4b5563',
          secondary: '#9ca3af',
          background: '#ffffff',
          userBubble: '#f3f4f6',
          assistantBubble: '#ffffff',
          border: '#e5e7eb',
          text: '#111827',
          textSecondary: '#6b7280'
        }
      default:
        return {
          primary: '#1890ff',
          primaryHover: '#40a9ff',
          secondary: '#69c0ff',
          background: '#f0f2f5',
          userBubble: '#1890ff',
          assistantBubble: '#ffffff',
          border: '#d9d9d9',
          text: '#000000',
          textSecondary: '#8c8c8c'
        }
    }
  })

  // CSS classes for different display modes
  const bubbleClasses = computed(() => {
    const baseClasses = ['chat-bubble']
    
    if (settings.value.displayMode === 'plain') {
      baseClasses.push('chat-bubble--plain')
    } else {
      baseClasses.push('chat-bubble--bubble')
    }
    
    baseClasses.push(`chat-bubble--${settings.value.theme}`)
    baseClasses.push(`chat-bubble--${settings.value.animation}`)
    
    if (settings.value.compactMode) {
      baseClasses.push('chat-bubble--compact')
    }
    
    return baseClasses
  })

  // Actions
  function updateSetting<K extends keyof BubbleSettings>(
    key: K,
    value: BubbleSettings[K]
  ): void {
    settings.value[key] = value
    saveToLocalStorage()
  }

  function updateSettings(newSettings: Partial<BubbleSettings>): void {
    Object.assign(settings.value, newSettings)
    saveToLocalStorage()
  }

  function resetToDefaults(): void {
    settings.value = {
      displayMode: 'bubble',
      theme: 'purple',
      animation: 'fade',
      showAvatars: true,
      showTimestamps: false,
      compactMode: false,
      enableTypingEffect: false,
      maxBubbleWidth: 600,
      borderRadius: 12,
      spacing: 8
    }
    saveToLocalStorage()
  }

  function saveToLocalStorage(): void {
    try {
      localStorage.setItem('bubbleSettings', JSON.stringify(settings.value))
    } catch (error) {
      console.warn('Failed to save bubble settings to localStorage:', error)
    }
  }

  function loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('bubbleSettings')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate and merge with defaults
        Object.assign(settings.value, parsed)
      }
    } catch (error) {
      console.warn('Failed to load bubble settings from localStorage:', error)
    }
  }

  // Initialize from localStorage
  loadFromLocalStorage()

  return {
    // State
    settings,
    
    // Computed
    bubbleStyles,
    themeColors,
    bubbleClasses,
    
    // Actions
    updateSetting,
    updateSettings,
    resetToDefaults,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})
