import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Login from './signin.vue'

// 创建Pinia实例
const pinia = createPinia()

// 登录页面功能
document.addEventListener('DOMContentLoaded', () => {
    // 挂载登录组件
    const loginFormElement = document.getElementById('loginform');

    if (loginFormElement) {
        const loginApp = createApp(Login)
        loginApp.use(pinia)
        loginApp.mount('#loginform')
    }
});
