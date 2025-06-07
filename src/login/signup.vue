<script setup lang="ts">
import { ref, reactive } from 'vue'

defineOptions({ name: 'SignUp' })

// 响应式数据
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  agree_terms: false
})

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 显示错误消息
const showError = (message: string) => {
  errorMessage.value = message
  successMessage.value = ''
}

// 显示成功消息
const showSuccess = (message: string) => {
  successMessage.value = message
  errorMessage.value = ''
}

// 隐藏所有消息
const hideMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

// 邮箱格式验证
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 表单验证
const validateForm = (): boolean => {
  const { username, email, password, confirm_password, agree_terms } = formData

  if (!username.trim()) {
    showError('请输入用户名')
    return false
  }

  if (username.trim().length < 2) {
    showError('用户名至少需要2个字符')
    return false
  }

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

  if (password !== confirm_password) {
    showError('两次输入的密码不一致')
    return false
  }

  if (!agree_terms) {
    showError('请同意服务条款和隐私政策')
    return false
  }

  return true
}

// 重置表单
const resetForm = () => {
  formData.username = ''
  formData.email = ''
  formData.password = ''
  formData.confirm_password = ''
  formData.agree_terms = false
}

// 提交注册表单
const handleSubmit = async () => {
  hideMessages()

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    const response = await fetch('/user/account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'register',
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      showSuccess('注册成功！请使用您的邮箱和密码登录。')
      resetForm()

      // 3秒后重定向到登录页面
      setTimeout(() => {
        window.location.href = '/src/login/signin.html'
      }, 2000)
    } else {
      showError(result.message || '注册失败，请稍后重试')
    }
  } catch (error) {
    console.error('注册请求失败:', error)
    showError('网络错误，请检查网络连接后重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- 用户名输入 -->
    <div class="input-group">
      <input
        v-model="formData.username"
        type="text"
        name="username"
        placeholder=" "
        required
        class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
      >
      <label>用户名</label>
    </div>

    <!-- 邮箱输入 -->
    <div class="input-group">
      <input
        v-model="formData.email"
        type="email"
        name="email"
        placeholder=" "
        required
        class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
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
        class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
      >
      <label>密码</label>
    </div>

    <!-- 确认密码输入 -->
    <div class="input-group">
      <input
        v-model="formData.confirm_password"
        type="password"
        name="confirm_password"
        placeholder=" "
        required
        class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
      >
      <label>确认密码</label>
    </div>

    <!-- 服务条款同意 -->
    <div class="flex items-center">
      <input
        v-model="formData.agree_terms"
        type="checkbox"
        name="agree_terms"
        required
        class="mr-2 text-purple-600 focus:ring-purple-500"
      >
      <label class="text-sm text-gray-600">
        我同意 <a href="#" class="text-purple-600 hover:text-purple-800">服务条款</a> 和 <a href="#" class="text-purple-600 hover:text-purple-800">隐私政策</a>
      </label>
    </div>

    <!-- 错误消息 -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <div class="flex items-center">
        <span class="material-icons text-sm mr-2">error</span>
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <!-- 成功消息 -->
    <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
      <div class="flex items-center">
        <span class="material-icons text-sm mr-2">check_circle</span>
        <span>{{ successMessage }}</span>
      </div>
    </div>

    <!-- 提交按钮 -->
    <button
      type="submit"
      :disabled="isLoading"
      class="login-btn-primary w-full py-3 text-white font-medium rounded-lg"
    >
      {{ isLoading ? '注册中...' : '注册' }}
    </button>
  </form>
</template>