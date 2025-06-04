import { defineStore } from 'pinia';

// 定义一个名为 `useUserStore` 的状态管理模块
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null, // 存储用户信息
    isLoggedIn: false // 登录状态
  }),
  actions: {
    login(userData: any) {
      this.user = userData;
      this.isLoggedIn = true;
    },
    logout() {
      this.user = null;
      this.isLoggedIn = false;
    }
  }
});
