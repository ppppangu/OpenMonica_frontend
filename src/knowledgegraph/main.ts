import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import KnowledgeGraphHeader from './KnowledgeGraphHeader.vue'
import KnowledgeGraphMain from './KnowledgeGraphMain.vue'
import { useUserStore } from '../store/user_info'

// 创建Pinia实例
const pinia = createPinia()

// 创建并挂载头部组件
const headerApp = createApp(KnowledgeGraphHeader)
headerApp.use(pinia)
headerApp.use(Antd)

// 初始化用户状态
const userStore = useUserStore()
await userStore.initializeFromStorage()

headerApp.mount('#container-header')

// 创建并挂载主内容组件
const mainApp = createApp(KnowledgeGraphMain)
mainApp.use(pinia)
mainApp.use(Antd)
mainApp.mount('#container-main-layout')

console.log('Knowledge Graph page initialized with user:', userStore.user)
