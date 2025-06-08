import { createApp } from 'vue'
import { createPinia } from 'pinia'
import KnowledgeCardsGrid from './KnowledgeCardsGrid.vue'

// 创建Pinia实例
const pinia = createPinia()

// 知识库页面功能
document.addEventListener('DOMContentLoaded', () => {
    // 挂载知识库卡片网格组件
    const knowledgeGridElement = document.getElementById('knowledge-cards-grid-container');

    if (knowledgeGridElement) {
        const knowledgeApp = createApp(KnowledgeCardsGrid)
        knowledgeApp.use(pinia)
        knowledgeApp.mount('#knowledge-cards-grid-container')
        console.log('Knowledge base cards grid component mounted')
    } else {
        console.warn('Knowledge base cards grid container not found')
    }
});