import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ChatPage from '../components/ChatPage.vue'

const app = createApp(ChatPage)
app.use(createPinia())
app.mount('#app')
