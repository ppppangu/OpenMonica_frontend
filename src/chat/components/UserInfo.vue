<template>
  <div>
    <h1>{{ userStore.userName || '欢迎 👋' }}</h1>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '../../store/user_info'

// 使用用户store
const userStore = useUserStore()

// 初始化用户数据（从localStorage恢复）
userStore.initializeFromStorage()
</script>
