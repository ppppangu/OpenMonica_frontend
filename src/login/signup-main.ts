import { createApp } from 'vue'
import { createPinia } from 'pinia'
import SignUp from './signup.vue'

// 创建Pinia实例
const pinia = createPinia()

// 注册页面功能
document.addEventListener('DOMContentLoaded', () => {
    // 挂载注册组件
    const signupFormElement = document.getElementById('signup');

    if (signupFormElement) {
        const signupApp = createApp(SignUp)
        signupApp.use(pinia)
        signupApp.mount('#signup')
    }
});
