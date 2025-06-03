import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Tooltip } from 'antd';
import { 
  HomeOutlined, 
  MessageOutlined, 
  BookOutlined, 
  QuestionCircleOutlined, 
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';

const Sidebar = ({ onChatToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: '聊天',
      onClick: onChatToggle
    },
    {
      key: '/brush',
      icon: <BookOutlined />,
      label: '知识库',
      onClick: () => navigate('/brush')
    },
    {
      key: '/help',
      icon: <QuestionCircleOutlined />,
      label: '帮助',
      onClick: () => navigate('/help')
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings')
    }
  ];

  const bottomItems = [
    {
      key: '/home',
      icon: <UserOutlined />,
      label: '我的账户',
      onClick: () => navigate('/home')
    }
  ];

  const isActive = (key) => {
    if (key === 'chat') return false; // 聊天按钮不需要激活状态
    return location.pathname === key;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 z-50">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          智
        </div>
      </div>

      {/* 主要菜单 */}
      <div className="flex-1 flex flex-col space-y-4">
        {menuItems.map(item => (
          <Tooltip key={item.key} title={item.label} placement="right">
            <Button
              type={isActive(item.key) ? 'primary' : 'text'}
              icon={item.icon}
              onClick={item.onClick}
              className={`w-12 h-12 flex items-center justify-center ${
                isActive(item.key) 
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              shape="round"
            />
          </Tooltip>
        ))}
      </div>

      {/* 底部菜单 */}
      <div className="flex flex-col space-y-4">
        {bottomItems.map(item => (
          <Tooltip key={item.key} title={item.label} placement="right">
            <Button
              type={isActive(item.key) ? 'primary' : 'text'}
              icon={item.icon}
              onClick={item.onClick}
              className={`w-12 h-12 flex items-center justify-center ${
                isActive(item.key) 
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              shape="round"
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
