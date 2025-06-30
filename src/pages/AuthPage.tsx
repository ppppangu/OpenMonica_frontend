import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, App, Divider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuth, useGuestOnly } from '../hooks/useAuth'

const { Title, Text } = Typography

interface LoginForm {
  email: string
  password: string
}

interface SignupForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

type AuthMode = 'login' | 'signup'

interface AuthPageProps {
  mode?: AuthMode
}

const AuthPage: React.FC<AuthPageProps> = ({ mode = 'login' }) => {
  const [authMode, setAuthMode] = useState<AuthMode>(mode)
  const { login, signup, isLoading, isAuthenticated, user } = useAuth()
  const { message } = App.useApp()
  const isGuest = useGuestOnly()

  console.log('AuthPage render - Auth state:', {
    isAuthenticated,
    hasUser: !!user,
    isGuest,
    isLoading
  })

  // Don't render if user is already authenticated
  if (!isGuest) {
    console.log('AuthPage - User is authenticated, not rendering')
    return null
  }

  const onLoginFinish = async (values: LoginForm) => {
    console.log('AuthPage - Starting login with:', values.email)

    const result = await login(values)

    console.log('AuthPage - Login result:', result)

    if (result.success) {
      message.success('登录成功！正在跳转...')
      console.log('AuthPage - Login successful, waiting for redirect...')

      // Additional check after a delay to see if redirect happened
      setTimeout(() => {
        console.log('AuthPage - Checking if still on login page after 2 seconds')
        if (window.location.pathname === '/login') {
          console.warn('AuthPage - Still on login page, redirect may have failed')
        }
      }, 2000)
    } else {
      console.error('AuthPage - Login failed:', result.error)
      message.error(result.error || '登录失败，请检查邮箱和密码')
    }
  }

  const onSignupFinish = async (values: SignupForm) => {
    const result = await signup(values)

    if (result.success) {
      message.success('注册成功！请登录您的账户')
      setAuthMode('login')
    } else {
      message.error(result.error || '注册失败，请稍后重试')
    }
  }

  const toggleMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login')
  }

  const renderLoginForm = () => (
    <Form
      name="login"
      onFinish={onLoginFinish}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱地址' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          placeholder="邮箱地址"
          className="h-10 rounded-md border-gray-300 focus:border-black focus:ring-1 focus:ring-black/40 transition-all duration-150"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined className="text-gray-400" />}
          placeholder="密码"
          className="h-10 rounded-md border-gray-300 focus:border-black focus:ring-1 focus:ring-black/40 transition-all duration-150"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 transition-colors duration-150 text-white font-medium"
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  )

  const renderSignupForm = () => (
    <Form
      name="signup"
      onFinish={onSignupFinish}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[
          { required: true, message: '请输入用户名' },
          { min: 2, message: '用户名至少2个字符' }
        ]}
      >
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          placeholder="用户名"
          className="h-10 rounded-md border-gray-300 focus:border-black focus:ring-1 focus:ring-black/40 transition-all duration-150"
        />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱地址' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input
          prefix={<MailOutlined className="text-gray-400" />}
          placeholder="邮箱地址"
          className="h-10 rounded-md border-gray-300 focus:border-black focus:ring-1 focus:ring-black/40 transition-all duration-150"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined className="text-gray-400" />}
          placeholder="密码"
          className="h-10 rounded-md border-gray-300 focus:border-black focus:ring-1 focus:ring-black/40 transition-all duration-150"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
              }
              return Promise.reject(new Error('两次输入的密码不一致'))
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined className="text-gray-400" />}
          placeholder="确认密码"
          className="h-10 rounded-md border-gray-300 focus:border-black focus:ring-1 focus:ring-black/40 transition-all duration-150"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 transition-colors duration-150 text-white font-medium"
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  )

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border border-gray-200 rounded-xl p-8 shadow-none">
        <div className="text-center mb-6">
          <Title level={3} className="text-gray-900 font-semibold">
            {authMode === 'login' ? '登录到 AI 聊天助手' : '创建您的 AI 账户'}
          </Title>
        </div>

        {authMode === 'login' ? renderLoginForm() : renderSignupForm()}

        <Divider className="my-6" />

        <div className="text-center">
          <Text className="text-gray-600 text-sm">
            {authMode === 'login' ? '还没有账户？' : '已有账户？'}
          </Text>
          <Button
            type="link"
            onClick={toggleMode}
            disabled={isLoading}
            className="p-0 ml-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm hover:underline transition-all duration-200"
          >
            {authMode === 'login' ? '立即注册' : '立即登录'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default AuthPage
