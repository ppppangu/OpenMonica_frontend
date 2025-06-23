import { createApp, App, watch } from 'vue'
import { createPinia } from 'pinia'
import { useKnowledgebaseViewStore, KnowledgebaseView } from '../store/knowledgebase_view'

// 创建 Pinia 实例
const pinia = createPinia()

// 保存当前挂载的 app
let currentApp: App<Element> | null = null

// 按需加载组件
const importComponent = async (view: KnowledgebaseView) => {
  switch (view) {
    case 'dashboard':
      return (await import('../components/knowledgebase/KnowledgebaseDashboard.vue')).default
    case 'detail':
      return (await import('../components/knowledgebase/KnowledgebaseDetail.vue')).default
    case 'graph':
      return (await import('../components/knowledgebase/KnowledgeGraph.vue')).default
    default:
      return (await import('../components/knowledgebase/KnowledgebaseDashboard.vue')).default
  }
}

// 卸载已有组件
const unmountCurrent = () => {
  if (currentApp) {
    currentApp.unmount()
    currentApp = null
  }
}

// 根据当前视图挂载组件
const mountView = async (view: KnowledgebaseView) => {
  const container = document.getElementById('knowledge-dynamic-content')
  if (!container) {
    console.error('knowledge-dynamic-content container not found')
    return
  }

  // 清空容器
  container.innerHTML = ''

  // 动态导入并挂载
  const Component = await importComponent(view)
  const app = createApp(Component)
  app.use(pinia)
  app.mount(container)
  currentApp = app
  console.log(`Mounted view: ${view}`)
}

// DOMContentLoaded 初始化
window.addEventListener('DOMContentLoaded', () => {
  const viewStore = useKnowledgebaseViewStore(pinia)

  // 侧边栏按钮点击
  document.querySelectorAll('.knowledge-panel-item[data-view]').forEach(el => {
    el.addEventListener('click', () => {
      const view = (el as HTMLElement).dataset.view as KnowledgebaseView
      viewStore.setCurrentView(view)
    })
  })

  // 监听视图变化
  watch(
    () => viewStore.currentView,
    (newView) => {
      unmountCurrent()
      mountView(newView)
    },
    { immediate: true }
  )
})