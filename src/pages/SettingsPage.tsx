import React, { useState } from 'react'
import { Card, Typography, Form, Input, Button, Switch, Select, Divider, Tabs, App, Modal, Space } from 'antd'
import { UserOutlined, SettingOutlined, SecurityScanOutlined, EditOutlined, LockOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { updateUserInfo, deleteUserAccount } from '../utils/api'

const { Title, Text } = Typography
const { Option } = Select

const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuth()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  // 处理用户名修改
  const handleUsernameUpdate = async (values: { username: string }) => {
    if (!user?.id) return

    setLoading(true)
    try {
      await updateUserInfo('username', values.username, user.id)
      updateUser({ username: values.username })
      message.success('用户名更新成功')
      setEditingField(null)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理邮箱修改
  const handleEmailUpdate = async (values: { email: string }) => {
    if (!user?.id) return

    setLoading(true)
    try {
      await updateUserInfo('email', values.email, user.id)
      updateUser({ email: values.email })
      message.success('邮箱地址更新成功')
      setEditingField(null)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理密码修改
  const handlePasswordUpdate = async (values: { newPassword: string; confirmPassword: string }) => {
    if (!user?.id) return

    if (values.newPassword !== values.confirmPassword) {
      message.error('新密码与确认密码不一致')
      return
    }

    setLoading(true)
    try {
      await updateUserInfo('password', values.newPassword, user.id)
      message.success('密码修改成功')
      setPasswordModalVisible(false)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '密码修改失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理账号注销
  const handleAccountDelete = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      await deleteUserAccount(user.id)
      message.success('账号注销成功')
      logout()
      setDeleteModalVisible(false)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '账号注销失败，请稍后重试')
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
          <div className="space-y-6">
            {/* 用户名修改 */}
            <div>
              <Title level={4}>用户名</Title>
              <Text type="secondary">当前用户名：{user?.username || '未设置'}</Text>
              <br />
              {editingField === 'username' ? (
                <Form
                  layout="inline"
                  initialValues={{ username: user?.username }}
                  onFinish={handleUsernameUpdate}
                  className="mt-2"
                >
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input placeholder="输入新用户名" />
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        保存
                      </Button>
                      <Button onClick={() => setEditingField(null)}>
                        取消
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ) : (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  className="mt-2"
                  disabled={editingField !== null}
                  onClick={() => setEditingField('username')}
                >
                  修改用户名
                </Button>
              )}
            </div>

            <Divider />

            {/* 邮箱地址修改 */}
            <div>
              <Title level={4}>邮箱地址</Title>
              <Text type="secondary">当前邮箱：{user?.email || '未设置'}</Text>
              <br />
              {editingField === 'email' ? (
                <Form
                  layout="inline"
                  initialValues={{ email: user?.email }}
                  onFinish={handleEmailUpdate}
                  className="mt-2"
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱地址' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input placeholder="输入新邮箱地址" />
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        保存
                      </Button>
                      <Button onClick={() => setEditingField(null)}>
                        取消
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ) : (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  className="mt-2"
                  disabled={editingField !== null}
                  onClick={() => setEditingField('email')}
                >
                  修改邮箱地址
                </Button>
              )}
            </div>
          </div>
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
              <Button
                type="primary"
                icon={<LockOutlined />}
                className="mt-2"
                onClick={() => setPasswordModalVisible(true)}
              >
                修改密码
              </Button>
            </div>

            <Divider />

            <div>
              <Title level={4} type="danger">危险操作</Title>
              <Text type="secondary">删除账户将永久删除所有数据，此操作不可恢复</Text>
              <br />
              <Button
                danger
                icon={<DeleteOutlined />}
                className="mt-2"
                onClick={() => setDeleteModalVisible(true)}
              >
                账号注销
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

      {/* 密码修改模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
        forceRender={false}
      >
        <Form
          layout="vertical"
          onFinish={handlePasswordUpdate}
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password placeholder="输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[{ required: true, message: '请确认新密码' }]}
          >
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
              <Button onClick={() => setPasswordModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 账号注销确认模态框 */}
      <Modal
        title="账号注销确认"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={null}
        forceRender={false}
      >
        <div className="text-center py-4">
          <DeleteOutlined className="text-red-500 text-4xl mb-4" />
          <Title level={4} type="danger">确认注销账号？</Title>
          <Text type="secondary" className="block mb-6">
            此操作将永久删除您的账户和所有相关数据，包括聊天记录、知识库等。
            <br />
            <strong>此操作不可恢复！</strong>
          </Text>
          <Space>
            <Button
              danger
              type="primary"
              loading={loading}
              onClick={handleAccountDelete}
            >
              确认注销
            </Button>
            <Button onClick={() => setDeleteModalVisible(false)}>
              取消
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  )
}

export default SettingsPage
