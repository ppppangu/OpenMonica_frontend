import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  MessageOutlined,
  BookOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const { Header, Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  const menuItems = [
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: '智能对话',
    },
    {
      key: '/knowledge',
      icon: <BookOutlined />,
      label: '知识库',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      key: '/help',
      icon: <QuestionCircleOutlined />,
      label: '帮助',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
  }

  const userMenuItems = [
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
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 4 && hour < 11.5) return '早上好'
    if (hour >= 11.5 && hour < 19) return '下午好'
    return '晚上好'
  }

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="bg-white border-r border-gray-200"
        width={260}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🤖</div>
            {!collapsed && (
              <span className="text-lg font-semibold text-gray-800">AI助手</span>
            )}
          </div>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0"
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600"
            />
            <h1 className="text-lg font-medium text-gray-800 m-0">
              {menuItems.find(item => item.key === location.pathname)?.label || 'AI助手'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 hidden sm:inline">
              {getGreeting()}，{user?.username || '用户'}
            </span>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Avatar 
                icon={<UserOutlined />} 
                className="cursor-pointer bg-primary-600"
              />
            </Dropdown>
          </div>
        </Header>
        
        <Content className="p-6 overflow-auto">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
