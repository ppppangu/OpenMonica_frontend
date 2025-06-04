<template>
  <div>
    <p v-if="isLoggedIn">欢迎, {{ user.name }}</p>
    <button @click="logout" v-if="isLoggedIn">退出登录</button>
    <button @click="login({ name: '张三' })" v-else>登录</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useUserStore } from '@/store';

export default defineComponent({
  setup() {
    const userStore = useUserStore();

    return {
      user: userStore.user,
      isLoggedIn: userStore.isLoggedIn,
      login: userStore.login,
      logout: userStore.logout
    };
  }
});
</script>
