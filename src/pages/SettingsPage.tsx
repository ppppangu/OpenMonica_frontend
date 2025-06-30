import React, { useState } from 'react'
import { Card, Typography, Form, Input, Button, Switch, Select, Divider, Tabs, App } from 'antd'
import { UserOutlined, SettingOutlined, SecurityScanOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'

const { Title, Text } = Typography
const { Option } = Select

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  const handleUserInfoUpdate = async (values: any) => {
    setLoading(true)
    try {
      updateUser(values)
      message.success('个人信息更新成功')
    } catch (error) {
      message.error('更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesUpdate = async (values: any) => {
    setLoading(true)
    try {
      // Save preferences to localStorage or backend
      localStorage.setItem('userPreferences', JSON.stringify(values))
      message.success('偏好设置保存成功')
    } catch (error) {
      message.error('保存失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'profile',
      label: <span><UserOutlined />个人信息</span>,
      children: (
        <Card>
          <Form
            layout="vertical"
            initialValues={{
              username: user?.username,
              email: user?.email
            }}
            onFinish={handleUserInfoUpdate}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="输入用户名" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱地址"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="输入邮箱地址" disabled />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存更改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'preferences',
      label: <span><SettingOutlined />偏好设置</span>,
      children: (
        <Card>
          <Form
            layout="vertical"
            initialValues={{
              theme: 'light',
              language: 'zh-CN',
              autoSave: true,
              notifications: true
            }}
            onFinish={handlePreferencesUpdate}
          >
            <Form.Item name="theme" label="主题">
              <Select>
                <Option value="light">浅色主题</Option>
                <Option value="dark">深色主题</Option>
                <Option value="auto">跟随系统</Option>
              </Select>
            </Form.Item>

            <Form.Item name="language" label="语言">
              <Select>
                <Option value="zh-CN">简体中文</Option>
                <Option value="en-US">English</Option>
              </Select>
            </Form.Item>

            <Divider />

            <Form.Item name="autoSave" valuePropName="checked">
              <div className="flex items-center justify-between">
                <div>
                  <Text strong>自动保存</Text>
                  <br />
                  <Text type="secondary">自动保存聊天记录和设置</Text>
                </div>
                <Switch />
              </div>
            </Form.Item>

            <Form.Item name="notifications" valuePropName="checked">
              <div className="flex items-center justify-between">
                <div>
                  <Text strong>通知</Text>
                  <br />
                  <Text type="secondary">接收系统通知和更新提醒</Text>
                </div>
                <Switch />
              </div>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: <span><SecurityScanOutlined />安全设置</span>,
      children: (
        <Card>
          <div className="space-y-6">
            <div>
              <Title level={4}>密码安全</Title>
              <Text type="secondary">定期更改密码以保护账户安全</Text>
              <br />
              <Button type="primary" className="mt-2">
                修改密码
              </Button>
            </div>

            <Divider />

            <div>
              <Title level={4}>登录设备</Title>
              <Text type="secondary">管理已登录的设备和会话</Text>
              <br />
              <Button className="mt-2">
                查看登录设备
              </Button>
            </div>

            <Divider />

            <div>
              <Title level={4}>数据导出</Title>
              <Text type="secondary">导出您的聊天记录和个人数据</Text>
              <br />
              <Button className="mt-2">
                导出数据
              </Button>
            </div>

            <Divider />

            <div>
              <Title level={4} type="danger">危险操作</Title>
              <Text type="secondary">删除账户将永久删除所有数据，此操作不可恢复</Text>
              <br />
              <Button danger className="mt-2">
                删除账户
              </Button>
            </div>
          </div>
        </Card>
      ),
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <Title level={2}>设置</Title>

      <Tabs defaultActiveKey="profile" items={tabItems} />
    </div>
  )
}

export default SettingsPage
