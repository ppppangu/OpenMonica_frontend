import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuth, useGuestOnly } from '../hooks/useAuth'

const { Title, Text } = Typography

interface LoginForm {
  email: string
  password: string
}

const LoginPage: React.FC = () => {
  const { login, isLoading, createMockUser } = useAuth()
  const isGuest = useGuestOnly()

  // Don't render if user is already authenticated
  if (!isGuest) {
    return null
  }

  const onFinish = async (values: LoginForm) => {
    const result = await login(values)

    if (result.success) {
      message.success('登录成功！')
    } else {
      message.error(result.error || '登录失败，请检查邮箱和密码')
    }
  }

  const handleMockLogin = () => {
    createMockUser()
    message.success('使用测试账户登录成功！')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🤖</div>
          <Title level={2} className="mb-2">AI聊天助手</Title>
          <Text type="secondary">登录您的账户</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
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
              prefix={<UserOutlined />}
              placeholder="邮箱地址"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="w-full"
            >
              登录
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              type="default"
              onClick={handleMockLogin}
              className="w-full"
              disabled={isLoading}
            >
              使用测试账户登录
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div className="text-center">
          <Text type="secondary">
            还没有账户？{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-700">
              立即注册
            </Link>
          </Text>
        </div>

        <div className="mt-6 text-center">
          <Text type="secondary" className="text-xs">
            © 2024 AI聊天助手 - 让AI更好地为您服务
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
