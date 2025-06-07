<script setup lang="ts">
import { useUserStore } from '../store/user_info'
import { computed } from 'vue'
const userStore = useUserStore()
const userName = computed(() => userStore.userName)
</script>

<template>
    <header class="main-content-header">
        <h1 class="main-content-title">欢迎 {{ userName }} 👋</h1>
    </header>
</template>