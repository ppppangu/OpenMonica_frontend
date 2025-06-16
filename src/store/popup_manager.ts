import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import type { Component } from 'vue'

export interface PopupConfig {
  id: string
  component: Component | string
  props?: Record<string, any>
  title?: string
  width?: number | string
  height?: number | string
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  centered?: boolean
  zIndex?: number
  className?: string
  onClose?: () => void
  onOk?: () => void
  onCancel?: () => void
}

export interface PopupState extends PopupConfig {
  visible: boolean
  loading: boolean
  promise?: {
    resolve: (value?: any) => void
    reject: (reason?: any) => void
  }
  timestamp: number
}

export const usePopupManagerStore = defineStore('popupManager', () => {
  // State
  const popups = ref<Map<string, PopupState>>(new Map())
  const baseZIndex = ref(1000)
  const keyboardNavigation = ref(true)
  
  // Computed
  const visiblePopups = computed(() => {
    return Array.from(popups.value.values())
      .filter(popup => popup.visible)
      .sort((a, b) => a.timestamp - b.timestamp)
  })
  
  const topPopup = computed(() => {
    const visible = visiblePopups.value
    return visible.length > 0 ? visible[visible.length - 1] : null
  })
  
  const hasVisiblePopups = computed(() => visiblePopups.value.length > 0)
  
  // Actions
  function generateId(): string {
    return `popup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  function calculateZIndex(popup: PopupState): number {
    if (popup.zIndex) return popup.zIndex
    
    const visibleCount = visiblePopups.value.length
    return baseZIndex.value + visibleCount * 10
  }
  
  async function show(config: Omit<PopupConfig, 'id'> & { id?: string }): Promise<any> {
    const id = config.id || generateId()
    
    return new Promise((resolve, reject) => {
      const popup: PopupState = {
        ...config,
        id,
        visible: true,
        loading: false,
        timestamp: Date.now(),
        promise: { resolve, reject },
        // Default values
        closable: config.closable ?? true,
        maskClosable: config.maskClosable ?? true,
        keyboard: config.keyboard ?? true,
        centered: config.centered ?? true
      }
      
      popups.value.set(id, popup)
      
      // Auto-focus management
      nextTick(() => {
        focusPopup(id)
      })
    })
  }
  
  function hide(id: string, result?: any): void {
    const popup = popups.value.get(id)
    if (!popup) return
    
    popup.visible = false
    
    // Resolve promise if exists
    if (popup.promise) {
      popup.promise.resolve(result)
    }
    
    // Call onClose callback
    if (popup.onClose) {
      popup.onClose()
    }
    
    // Remove from map after animation
    setTimeout(() => {
      popups.value.delete(id)
    }, 300)
  }
  
  function hideAll(): void {
    visiblePopups.value.forEach(popup => {
      hide(popup.id)
    })
  }
  
  function cancel(id: string, reason?: any): void {
    const popup = popups.value.get(id)
    if (!popup) return
    
    popup.visible = false
    
    // Reject promise if exists
    if (popup.promise) {
      popup.promise.reject(reason || 'cancelled')
    }
    
    // Call onCancel callback
    if (popup.onCancel) {
      popup.onCancel()
    }
    
    // Remove from map after animation
    setTimeout(() => {
      popups.value.delete(id)
    }, 300)
  }
  
  function setLoading(id: string, loading: boolean): void {
    const popup = popups.value.get(id)
    if (popup) {
      popup.loading = loading
    }
  }
  
  function updateProps(id: string, props: Record<string, any>): void {
    const popup = popups.value.get(id)
    if (popup) {
      popup.props = { ...popup.props, ...props }
    }
  }
  
  function focusPopup(id: string): void {
    if (!keyboardNavigation.value) return
    
    nextTick(() => {
      const element = document.querySelector(`[data-popup-id="${id}"]`) as HTMLElement
      if (element) {
        const focusable = element.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement
        
        if (focusable) {
          focusable.focus()
        } else {
          element.focus()
        }
      }
    })
  }
  
  // Keyboard event handlers
  function handleKeydown(event: KeyboardEvent): void {
    if (!keyboardNavigation.value || !hasVisiblePopups.value) return
    
    const currentPopup = topPopup.value
    if (!currentPopup) return
    
    switch (event.key) {
      case 'Escape':
        if (currentPopup.keyboard && currentPopup.closable) {
          event.preventDefault()
          hide(currentPopup.id)
        }
        break
        
      case 'Tab':
        // Handle tab navigation within popup
        handleTabNavigation(event, currentPopup.id)
        break
    }
  }
  
  function handleTabNavigation(event: KeyboardEvent, popupId: string): void {
    const popup = document.querySelector(`[data-popup-id="${popupId}"]`)
    if (!popup) return
    
    const focusableElements = popup.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab (forward)
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }
  
  // Background click handler
  function handleBackgroundClick(popupId: string): void {
    const popup = popups.value.get(popupId)
    if (popup && popup.maskClosable) {
      hide(popupId)
    }
  }
  
  // Initialize keyboard listeners
  if (typeof window !== 'undefined') {
    document.addEventListener('keydown', handleKeydown)
  }
  
  return {
    // State
    popups,
    baseZIndex,
    keyboardNavigation,
    
    // Computed
    visiblePopups,
    topPopup,
    hasVisiblePopups,
    
    // Actions
    show,
    hide,
    hideAll,
    cancel,
    setLoading,
    updateProps,
    focusPopup,
    calculateZIndex,
    handleBackgroundClick,
    
    // Utils
    generateId
  }
})
