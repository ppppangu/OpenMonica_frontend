<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- 错误消息显示 -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {{ errorMessage }}
    </div>

    <!-- 邮箱输入 -->
    <div class="input-group">
      <input
        v-model="formData.email"
        type="email"
        name="email"
        placeholder=" "
        required
        :disabled="isLoading"
        class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors disabled:bg-gray-100"
      >
      <label>邮箱地址</label>
    </div>

    <!-- 密码输入 -->
    <div class="input-group">
      <input
        v-model="formData.password"
        type="password"
        name="password"
        placeholder=" "
        required
        :disabled="isLoading"
        class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors disabled:bg-gray-100"
      >
      <label>密码</label>
    </div>

    <!-- 记住我和忘记密码 -->
    <div class="flex items-center justify-between">
      <label class="flex items-center">
        <input
          v-model="formData.remember"
          type="checkbox"
          name="remember"
          :disabled="isLoading"
          class="mr-2 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
        >
        <span class="text-sm text-gray-600">记住我</span>
      </label>
      <a href="#" class="text-sm text-purple-600 hover:text-purple-800">忘记密码？</a>
    </div>

    <!-- 登录按钮 -->
    <button
      type="submit"
      :disabled="isLoading"
      class="login-btn-primary w-full py-3 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="isLoading">登录中...</span>
      <span v-else>登录</span>
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '../store/user_info'


defineOptions({ name: 'Login' })

// Pinia store
const userStore = useUserStore()

// 响应式数据
const formData = reactive({
  email: '',
  password: '',
  remember: false
})

const isLoading = ref(false)
const errorMessage = ref('')

// 显示错误消息
const showError = (message: string) => {
  errorMessage.value = message
}

// 隐藏错误消息
const hideError = () => {
  errorMessage.value = ''
}

// 邮箱格式验证
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 表单验证
const validateForm = (): boolean => {
  const { email, password } = formData

  if (!email.trim()) {
    showError('请输入邮箱地址')
    return false
  }

  if (!validateEmail(email.trim())) {
    showError('请输入有效的邮箱地址')
    return false
  }

  if (!password) {
    showError('请输入密码')
    return false
  }

  if (password.length < 6) {
    showError('密码至少需要6个字符')
    return false
  }

  if (!formData.remember) {
    showError('请勾选用户协议和隐私政策')
    return false
  }

  return true
}

// 处理登录提交
const handleSubmit = async () => {
  hideError()

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    // 发送JSON格式的登录请求
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email.trim(),
        password: formData.password,
        remember: formData.remember
      }),
      credentials: 'include' // Include cookies for authentication
    })

    // 尝试解析JSON响应，如果解析失败则获取文本响应
    let result: any
    try {
      result = await response.json()
    } catch (parseError) {
      const text = await response.text()
      console.warn('无法解析JSON响应，返回文本:', text)
      result = { success: false, message: text }
    }

    if (response.ok && result.success) {
      // 登录成功，存储用户信息到 Pinia
      userStore.login({
        token: result.token,
        id: result.user_id,
        email: result.user_email,
        username: result.user_username
      })

      // 重定向到聊天界面
      window.location.href = '/src/chat/pages/chat.html'
    } else {
      showError(result.message || '登录失败，请检查邮箱和密码')
    }
  } catch (error) {
    console.error('登录请求失败:', error)
    showError('网络错误，请检查网络连接后重试')
  } finally {
    isLoading.value = false
  }
}
</script>
