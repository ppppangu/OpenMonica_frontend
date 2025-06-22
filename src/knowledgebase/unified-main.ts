import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import UnifiedKnowledgeBase from '../components/knowledgebase/UnifiedKnowledgeBase.vue'
import { useUserStore } from '../store/user_info'

// Create Pinia instance
const pinia = createPinia()

// Create Vue app
const app = createApp(UnifiedKnowledgeBase)

// Use plugins
app.use(pinia)
app.use(Antd)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info)
  
  // Show user-friendly error message
  if (window.KnowledgeBaseUtils) {
    window.KnowledgeBaseUtils.showError('应用程序运行时错误，请刷新页面重试。')
  }
}

// Initialize and mount app
async function initializeApp() {
  try {
    // Initialize user store
    const userStore = useUserStore()
    await userStore.initializeFromStorage()
    
    // Check if user is authenticated
    if (!userStore.user?.token) {
      console.warn('User not authenticated, redirecting to login')
      window.location.href = '/signin'
      return
    }
    
    console.log('User authenticated:', userStore.user.id)
    
    // Mount the app
    app.mount('#app')
    
    console.log('Unified Knowledge Base application mounted successfully')
    
    // Hide loading screen
    if (window.KnowledgeBaseUtils) {
      window.KnowledgeBaseUtils.hideLoading()
    }
    
  } catch (error) {
    console.error('Failed to initialize application:', error)
    
    if (window.KnowledgeBaseUtils) {
      window.KnowledgeBaseUtils.showError('应用程序初始化失败，请检查登录状态后重试。')
    }
  }
}

// Start the application
initializeApp()

// Export for debugging
if (import.meta.env.DEV) {
  window.__VUE_APP__ = app
  window.__PINIA__ = pinia
}
