import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import UserPromptForm from './UserPromptForm.vue'
import ModelMemoryForm from './ModelMemoryForm.vue'

console.log('Settings main.ts loaded')

// 创建Pinia实例
const pinia = createPinia()

// 设置活跃的Pinia实例
setActivePinia(pinia)

// 设置页面功能
document.addEventListener('DOMContentLoaded', () => {
    try {
        // 挂载用户提示组件
        const userPromptElement = document.getElementById('user-prompt-container');

        if (userPromptElement) {
            // 清除占位符内容
            userPromptElement.innerHTML = ''

            const userPromptApp = createApp(UserPromptForm)
            userPromptApp.use(pinia)

            // 添加错误处理
            userPromptApp.config.errorHandler = (err, vm, info) => {
                console.error('User prompt component error:', err, info)
                // 如果出错，显示错误信息
                userPromptElement.innerHTML = '<div class="error-placeholder"><p>用户提示组件加载失败</p></div>'
            }

            userPromptApp.mount('#user-prompt-container')
        }

        // 挂载模型记忆组件
        const modelMemoryElement = document.getElementById('model-memory-container');

        if (modelMemoryElement) {
            // 清除占位符内容
            modelMemoryElement.innerHTML = ''

            const modelMemoryApp = createApp(ModelMemoryForm)
            modelMemoryApp.use(pinia)

            // 添加错误处理
            modelMemoryApp.config.errorHandler = (err, vm, info) => {
                console.error('Model memory component error:', err, info)
                // 如果出错，显示错误信息
                modelMemoryElement.innerHTML = '<div class="error-placeholder"><p>模型记忆组件加载失败</p></div>'
            }

            modelMemoryApp.mount('#model-memory-container')
        }

        console.log('All Vue components initialization completed')

    } catch (error) {
        console.error('Error during Vue components initialization:', error)
    }
});