<script setup lang="ts">
import { useUserStore } from '../../store/user_info'
import { computed, onMounted } from 'vue'
const userStore = useUserStore()

onMounted(() => {
  console.log('🎯 Hello component mounted successfully!')

  // 添加视觉指示器到DOM
  const helloElement = document.getElementById('hello')
  if (helloElement) {
    helloElement.style.border = '2px solid #ef4444'
    helloElement.style.minHeight = '60px'
    console.log('✅ Hello DOM element styled for visibility')
  }
})

const time_hello = computed(() => {
    const now = new Date();

    // 转换为东八区时间
    const utcHour = now.getUTCHours(); // 获取 UTC 时间的小时
    const localHour = (utcHour + 8) % 24; // 转换为东八区时间

    // 根据时间段返回问候语
    if (localHour >= 6 && localHour < 12) {
        return "早上好";
    } else if (localHour >= 12 && localHour < 18) {
        return "下午好";
    } else {
        return "晚上好";
    }
})

const userName = computed(() => time_hello.value + ' ' + userStore.user?.username + ' 👋')
</script>

<template>
    <header class="main-content-header">
        <h1 class="main-content-title">{{ userName }}</h1>
    </header>
</template>