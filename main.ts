import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(createPinia()); // 使用 Pinia来管理全局状态
app.use(router); // 使用路由
app.mount('#app');
