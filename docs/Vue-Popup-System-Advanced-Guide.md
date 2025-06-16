# Vue.js Popup System - Advanced Implementation Guide

## Advanced Architecture Patterns

### 1. Popup Factory Pattern

Create a factory for generating different types of popups with consistent configuration:

```typescript
// utils/PopupFactory.ts
import { usePopupManagerStore } from '@/store/popup_manager'
import type { Component } from 'vue'

export interface PopupFactoryConfig {
  type: 'confirm' | 'form' | 'info' | 'custom'
  title?: string
  message?: string
  component?: Component
  props?: Record<string, any>
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  theme?: 'default' | 'purple' | 'danger' | 'success'
}

export class PopupFactory {
  private static popupStore = usePopupManagerStore()
  
  private static sizeMap = {
    small: { width: 400, height: 300 },
    medium: { width: 600, height: 500 },
    large: { width: 900, height: 700 },
    fullscreen: { width: '95vw', height: '95vh' }
  }
  
  private static themeMap = {
    default: 'base-popup',
    purple: 'base-popup purple-theme',
    danger: 'base-popup danger-theme',
    success: 'base-popup success-theme'
  }
  
  static async create(config: PopupFactoryConfig): Promise<any> {
    const { type, size = 'medium', theme = 'default', ...rest } = config
    const dimensions = this.sizeMap[size]
    const className = this.themeMap[theme]
    
    let component: Component
    let props: Record<string, any> = rest.props || {}
    
    switch (type) {
      case 'confirm':
        component = await this.loadComponent('ConfirmPopup')
        props = { message: config.message, ...props }
        break
        
      case 'form':
        component = await this.loadComponent('FormPopup')
        break
        
      case 'info':
        component = await this.loadComponent('InfoPopup')
        props = { message: config.message, ...props }
        break
        
      case 'custom':
        if (!config.component) {
          throw new Error('Custom popup requires component')
        }
        component = config.component
        break
        
      default:
        throw new Error(`Unknown popup type: ${type}`)
    }
    
    return this.popupStore.show({
      component,
      title: config.title,
      ...dimensions,
      className,
      props
    })
  }
  
  private static async loadComponent(name: string): Promise<Component> {
    const module = await import(`@/components/popup/${name}.vue`)
    return module.default
  }
  
  // Convenience methods
  static confirm(message: string, title = 'Confirmation'): Promise<boolean> {
    return this.create({ type: 'confirm', title, message, size: 'small' })
  }
  
  static info(message: string, title = 'Information'): Promise<void> {
    return this.create({ type: 'info', title, message, size: 'small' })
  }
  
  static danger(message: string, title = 'Warning'): Promise<boolean> {
    return this.create({ 
      type: 'confirm', 
      title, 
      message, 
      size: 'small', 
      theme: 'danger' 
    })
  }
}
```

### 2. Popup Queue Management

Implement a queue system for managing popup display order:

```typescript
// store/popup_queue.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePopupManagerStore } from './popup_manager'

interface QueuedPopup {
  id: string
  config: any
  priority: number
  timestamp: number
}

export const usePopupQueueStore = defineStore('popupQueue', () => {
  const queue = ref<QueuedPopup[]>([])
  const processing = ref(false)
  const maxConcurrent = ref(3)
  
  const popupStore = usePopupManagerStore()
  
  async function enqueue(config: any, priority = 0): Promise<any> {
    const queuedPopup: QueuedPopup = {
      id: generateId(),
      config,
      priority,
      timestamp: Date.now()
    }
    
    // Insert based on priority (higher priority first)
    const insertIndex = queue.value.findIndex(item => item.priority < priority)
    if (insertIndex === -1) {
      queue.value.push(queuedPopup)
    } else {
      queue.value.splice(insertIndex, 0, queuedPopup)
    }
    
    processQueue()
    
    return new Promise((resolve, reject) => {
      queuedPopup.config.onResolve = resolve
      queuedPopup.config.onReject = reject
    })
  }
  
  async function processQueue(): Promise<void> {
    if (processing.value || queue.value.length === 0) return
    if (popupStore.visiblePopups.length >= maxConcurrent.value) return
    
    processing.value = true
    
    const nextPopup = queue.value.shift()
    if (!nextPopup) {
      processing.value = false
      return
    }
    
    try {
      const result = await popupStore.show(nextPopup.config)
      nextPopup.config.onResolve?.(result)
    } catch (error) {
      nextPopup.config.onReject?.(error)
    }
    
    processing.value = false
    
    // Process next item in queue
    setTimeout(processQueue, 100)
  }
  
  function clearQueue(): void {
    queue.value.forEach(item => {
      item.config.onReject?.('queue_cleared')
    })
    queue.value = []
  }
  
  return {
    queue,
    processing,
    maxConcurrent,
    enqueue,
    processQueue,
    clearQueue
  }
})
```

### 3. Popup Context Provider

Create a context system for sharing data between nested popups:

```typescript
// composables/usePopupContext.ts
import { provide, inject, ref, type Ref } from 'vue'

interface PopupContext {
  parentId?: string
  depth: number
  sharedData: Ref<Record<string, any>>
  addData: (key: string, value: any) => void
  getData: (key: string) => any
  removeData: (key: string) => void
}

const POPUP_CONTEXT_KEY = Symbol('popup-context')

export function providePopupContext(parentId?: string): PopupContext {
  const depth = parentId ? (inject(POPUP_CONTEXT_KEY)?.depth || 0) + 1 : 0
  const sharedData = ref<Record<string, any>>({})
  
  const context: PopupContext = {
    parentId,
    depth,
    sharedData,
    addData: (key: string, value: any) => {
      sharedData.value[key] = value
    },
    getData: (key: string) => {
      return sharedData.value[key]
    },
    removeData: (key: string) => {
      delete sharedData.value[key]
    }
  }
  
  provide(POPUP_CONTEXT_KEY, context)
  return context
}

export function usePopupContext(): PopupContext | null {
  return inject(POPUP_CONTEXT_KEY, null)
}
```

### 4. Advanced Animation System

Implement custom animations for different popup types:

```typescript
// utils/PopupAnimations.ts
export interface AnimationConfig {
  enter: string
  leave: string
  duration: number
}

export const PopupAnimations = {
  slideUp: {
    enter: 'popup-slide-up-enter',
    leave: 'popup-slide-up-leave',
    duration: 300
  },
  
  fadeScale: {
    enter: 'popup-fade-scale-enter',
    leave: 'popup-fade-scale-leave',
    duration: 250
  },
  
  slideFromRight: {
    enter: 'popup-slide-right-enter',
    leave: 'popup-slide-right-leave',
    duration: 350
  },
  
  bounce: {
    enter: 'popup-bounce-enter',
    leave: 'popup-bounce-leave',
    duration: 400
  }
}

// CSS animations (add to your global styles)
/*
@keyframes popup-slide-up-enter {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes popup-slide-up-leave {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100px);
  }
}

@keyframes popup-fade-scale-enter {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes popup-fade-scale-leave {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

@keyframes popup-slide-right-enter {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes popup-slide-right-leave {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@keyframes popup-bounce-enter {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes popup-bounce-leave {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.3);
  }
}
*/
```

### 5. Popup Middleware System

Create middleware for popup lifecycle hooks:

```typescript
// utils/PopupMiddleware.ts
export interface PopupMiddleware {
  beforeShow?: (config: any) => Promise<any> | any
  afterShow?: (popup: any) => Promise<void> | void
  beforeHide?: (popup: any) => Promise<boolean> | boolean
  afterHide?: (popup: any) => Promise<void> | void
}

export class PopupMiddlewareManager {
  private middlewares: PopupMiddleware[] = []
  
  use(middleware: PopupMiddleware): void {
    this.middlewares.push(middleware)
  }
  
  async executeBeforeShow(config: any): Promise<any> {
    let modifiedConfig = config
    
    for (const middleware of this.middlewares) {
      if (middleware.beforeShow) {
        modifiedConfig = await middleware.beforeShow(modifiedConfig) || modifiedConfig
      }
    }
    
    return modifiedConfig
  }
  
  async executeAfterShow(popup: any): Promise<void> {
    for (const middleware of this.middlewares) {
      if (middleware.afterShow) {
        await middleware.afterShow(popup)
      }
    }
  }
  
  async executeBeforeHide(popup: any): Promise<boolean> {
    for (const middleware of this.middlewares) {
      if (middleware.beforeHide) {
        const canHide = await middleware.beforeHide(popup)
        if (canHide === false) {
          return false
        }
      }
    }
    return true
  }
  
  async executeAfterHide(popup: any): Promise<void> {
    for (const middleware of this.middlewares) {
      if (middleware.afterHide) {
        await middleware.afterHide(popup)
      }
    }
  }
}

// Example middleware implementations
export const LoggingMiddleware: PopupMiddleware = {
  beforeShow: (config) => {
    console.log('Popup about to show:', config.title)
    return config
  },
  afterShow: (popup) => {
    console.log('Popup shown:', popup.id)
  },
  beforeHide: (popup) => {
    console.log('Popup about to hide:', popup.id)
    return true
  },
  afterHide: (popup) => {
    console.log('Popup hidden:', popup.id)
  }
}

export const AnalyticsMiddleware: PopupMiddleware = {
  afterShow: (popup) => {
    // Track popup views
    analytics.track('popup_shown', {
      popupId: popup.id,
      popupTitle: popup.title,
      timestamp: Date.now()
    })
  },
  afterHide: (popup) => {
    // Track popup interactions
    analytics.track('popup_closed', {
      popupId: popup.id,
      duration: Date.now() - popup.timestamp
    })
  }
}
```
