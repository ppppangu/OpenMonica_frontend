import React from 'react'
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuth, useGuestOnly } from '../hooks/useAuth'

const { Title, Text } = Typography

interface SignupForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

const SignupPage: React.FC = () => {
  const { signup, isLoading } = useAuth()
  const isGuest = useGuestOnly()

  // Don't render if user is already authenticated
  if (!isGuest) {
    return null
  }

  const onFinish = async (values: SignupForm) => {
    const result = await signup(values)

    if (result.success) {
      message.success('注册成功！请登录您的账户')
    } else {
      message.error(result.error || '注册失败，请稍后重试')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🤖</div>
          <Title level={2} className="mb-2">AI聊天助手</Title>
          <Text type="secondary">创建您的账户</Text>
        </div>

        <Form
          name="signup"
          onFinish={onFinish}
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
              prefix={<UserOutlined />}
              placeholder="用户名"
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
              prefix={<MailOutlined />}
              placeholder="邮箱地址"
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
              prefix={<LockOutlined />}
              placeholder="密码"
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
              prefix={<LockOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="w-full"
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div className="text-center">
          <Text type="secondary">
            已有账户？{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700">
              立即登录
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

export default SignupPage
