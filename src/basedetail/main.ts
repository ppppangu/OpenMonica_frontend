import { createApp } from 'vue'
import { createPinia } from 'pinia'
import KnowledgeBaseDetailHeader from './KnowledgeBaseDetailHeader.vue'
import KnowledgeBaseDetailMain from './KnowledgeBaseDetailMain.vue'
import { useKnowledgeBaseStore } from '../store/knowledgebase_list'
import { useKnowledgeBaseDetailStore } from '../store/knowledgebase_detail'
import { useUserStore } from '../store/user_info'

// 创建Pinia实例
const pinia = createPinia()

// 获取URL参数
function getUrlParameter(name: string): string | null {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(name)
}

// 知识库详情页面功能
document.addEventListener('DOMContentLoaded', async () => {
    // 挂载头部组件
    const headerElement = document.getElementById('container-header')
    if (headerElement) {
        const headerApp = createApp(KnowledgeBaseDetailHeader)
        headerApp.use(pinia)
        headerApp.mount('#container-header')
        console.log('Knowledge base detail header component mounted')
    } else {
        console.warn('Knowledge base detail header container not found')
    }

    // 挂载主内容组件
    const mainElement = document.getElementById('container-main-layout')
    if (mainElement) {
        const mainApp = createApp(KnowledgeBaseDetailMain)
        mainApp.use(pinia)
        mainApp.mount('#container-main-layout')
        console.log('Knowledge base detail main component mounted')
    } else {
        console.warn('Knowledge base detail main container not found')
    }

    // 初始化数据
    const userStore = useUserStore()
    const knowledgeBaseStore = useKnowledgeBaseStore()
    const knowledgeBaseDetailStore = useKnowledgeBaseDetailStore()

    // 确保用户已登录
    userStore.initializeFromStorage()

    if (!userStore.isLoggedIn) {
        console.warn('User not logged in, redirecting to login page')
        window.location.href = '/src/login/signin.html'
        return
    }

    // 获取知识库ID
    const knowledgebaseId = getUrlParameter('id')
    if (!knowledgebaseId) {
        console.warn('No knowledge base ID provided in URL')
        window.location.href = '/src/knowledgebase/knowledgebase.html'
        return
    }

    try {
        // 首先获取知识库列表以找到对应的知识库信息
        await knowledgeBaseStore.fetchKnowledgeBaseList()

        // 查找对应的知识库并设置为活跃项
        const knowledgeBase = knowledgeBaseStore.knowledgeBaseList.find(kb => kb.id === knowledgebaseId)
        if (knowledgeBase) {
            knowledgeBaseStore.setActiveKnowledgeBaseItem(knowledgeBase)
        }

        // 获取知识库详情
        await knowledgeBaseDetailStore.fetchKnowledgeBaseDetail(knowledgebaseId)

        // 自动选择第一个文档
        if (knowledgeBaseDetailStore.documentDetailList.length > 0) {
            const firstDocument = knowledgeBaseDetailStore.documentDetailList[0]
            knowledgeBaseDetailStore.setActiveDocumentDetail(firstDocument)
            console.log('Auto-selected first document:', firstDocument.document_name)
        }

        console.log('Knowledge base detail loaded successfully')
    } catch (error) {
        console.error('Failed to load knowledge base detail:', error)
    }
});