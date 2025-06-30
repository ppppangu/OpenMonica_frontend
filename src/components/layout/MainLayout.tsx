import React, { useMemo, useCallback } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  MessageOutlined,
  BookOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const { Header, Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

// --------------------
// 模块级常量：侧边栏菜单配置
// --------------------
const MENU_CONFIG = [
  { key: '/chat', icon: MessageOutlined, label: '智能对话' },
  { key: '/custom', icon: BulbOutlined, label: '自定义' },
  { key: '/knowledge', icon: BookOutlined, label: '知识库' },
  { key: '/settings', icon: SettingOutlined, label: '设置' },
  { key: '/help', icon: QuestionCircleOutlined, label: '帮助' },
]

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  // 使用 useMemo 创建菜单项，避免每次渲染都创建新对象
  const menuItems = useMemo(() =>
    MENU_CONFIG.map(item => ({
      key: item.key,
      icon: React.createElement(item.icon),
      label: item.label,
    })),
    []
  )

  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      navigate(key)
    },
    [navigate]
  )

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const userMenuItems = useMemo(
    () => [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人信息',
        onClick: () => navigate('/settings'),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
    [handleLogout, navigate]
  )

  // 缓存 Dropdown 需要的 menu 对象，防止对象字面量新建
  const userMenu = useMemo(() => ({ items: userMenuItems }), [userMenuItems])

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours()
    if (hour >= 4 && hour < 11.5) return '早上好'
    if (hour >= 11.5 && hour < 19) return '下午好'
    return '晚上好'
  }, [])

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white border-r border-gray-200 flex flex-col overflow-y-auto"
        width={260}
        style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}
      >
        {/* 顶部 Logo 与 折叠按钮 */}
        <div className="relative h-16 border-b border-gray-200 flex items-center justify-center">
          <Button
            type="text"
            size="small"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-50 border border-gray-300 shadow-sm rounded-full"
          />
          <div className="flex items-center space-x-2">
            <img src="/icons/logo.svg" alt="logo" className="w-6 h-6" />
            {!collapsed && (
              <span className="text-lg font-semibold text-gray-800">AI助手</span>
            )}
          </div>
        </div>

        {/* 主菜单，占满可伸缩空间 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0 flex-1 overflow-y-auto"
        />

        {/* 侧边栏底部用户信息 */}
        <div className="p-4 border-t border-gray-200 mt-auto mb-4">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2`}>
            <Dropdown
              menu={userMenu}
              placement="top"
              trigger={["click"]}
            >
              <Avatar 
                icon={<UserOutlined />} 
                className="cursor-pointer bg-primary-600"
              />
            </Dropdown>

            {/* 展开状态下显示用户名与邮箱 */}
            {!collapsed && user && (
              <div className="flex flex-col text-xs text-gray-500 leading-tight">
                <span>{user.username || user.email?.split('@')[0]}</span>
                <span>{user.email}</span>
              </div>
            )}
          </div>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        <Header
          className="bg-white border-b border-gray-200 px-4 flex items-center"
          style={{ marginLeft: 0 }}
        >
          <h1 className="text-lg font-medium text-gray-800 m-0">
            {menuItems.find(item => item.key === location.pathname)?.label || 'AI助手'}
          </h1>
        </Header>

        <Content
          className="p-6 overflow-auto min-w-0"
          style={{ marginLeft: 0, minHeight: 'calc(100vh - 64px)' }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
