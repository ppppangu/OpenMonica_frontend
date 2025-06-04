import { createRouter, createWebHistory } from 'vue-router';

// 定义路由规则
const routes = [
  {
    path: '/index', // URL 路径
    name: 'Index',  // 路由名字（可选）
    component: () => import('@/components/Index.vue') // 对应的组件
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 的 history 模式
  routes
});

export default router;
