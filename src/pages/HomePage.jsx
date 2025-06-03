import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Button, Dropdown } from 'antd';
import { 
  EditOutlined, 
  TranslationOutlined, 
  BulbOutlined, 
  SearchOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import ModelSelector from '../components/ModelSelector';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;

const HomePage = () => {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [greeting, setGreeting] = useState('');
  const { user, logout } = useAuth();

  // 设置动态欢迎语
  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentTime = hour + minute / 60;

      let greetingText;
      if (currentTime >= 4 && currentTime < 11.5) {
        greetingText = "早上好 🌅";
      } else if (currentTime >= 11.5 && currentTime < 19) {
        greetingText = "下午好 ☀️";
      } else {
        greetingText = "晚上好 🌙";
      }
      setGreeting(greetingText);
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleChatToggle = () => {
    setIsChatVisible(!isChatVisible);
  };

  const userMenuItems = [
    {
      key: 'account',
      icon: <UserOutlined />,
      label: '我的账户',
      onClick: () => window.location.href = '/home'
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: '帮助中心',
      onClick: () => window.location.href = '/help'
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout
    },
  ];

  const toolItems = [
    { icon: <EditOutlined />, label: '写作', color: 'text-blue-500' },
    { icon: <TranslationOutlined />, label: '翻译', color: 'text-green-500' },
    { icon: <BulbOutlined />, label: '思维导图', color: 'text-teal-500', onClick: handleChatToggle },
    { icon: <SearchOutlined />, label: '搜索', color: 'text-orange-500' },
  ];

  return (
    <Layout className="min-h-screen">
      <Sidebar onChatToggle={handleChatToggle} />
      
      <Layout className="ml-20">
        <Content className="p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <Title level={1} className="text-gray-800 m-0">
              {greeting}
            </Title>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button 
                type="text" 
                className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white text-lg font-semibold hover:bg-purple-600"
              >
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Button>
            </Dropdown>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={16}>
              <Card className="shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <Title level={3} className="text-gray-700 m-0">工具</Title>
                  <Button type="link" className="text-purple-600 hover:text-purple-800">
                    更多 →
                  </Button>
                </div>
                <Row gutter={[16, 16]}>
                  {toolItems.map((item, index) => (
                    <Col xs={12} sm={8} md={6} key={index}>
                      <div 
                        className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={item.onClick}
                      >
                        <div className={`text-3xl mb-2 ${item.color}`}>
                          {item.icon}
                        </div>
                        <Text className="text-sm text-gray-600">{item.label}</Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card className="shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <Title level={3} className="text-gray-700 m-0">快捷功能</Title>
                </div>
                <div className="text-center py-8">
                  <Text className="text-gray-500">更多功能即将上线</Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Card className="mt-8 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <img 
                  alt="AI助手图标" 
                  className="w-10 h-10 rounded-lg mr-4" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmRpKmz88KNCjomaMZyRpdSX0kIKrfVWV7MTT-rBQBoEcCkgDjVwOkRgKUTt2RiA91uqE5HoLxo0NFCzcZN4yBHxKp7mNCcwsUHeh4nfrU70ogOG_5D9BCwYo40pWNTYcg5aWZStjTVUdjL7PtqX96dR9toQciHdDJW2pEOecPa1DPAJcfNGX7ajMKa-BH0jmCbyNH2grNZRFXPnEZJw6lV1KKqCgKMjIESMxKj9Q2IdycWV65oB-Iqaw07R_kqZ6fG1VgvKvDr3Q"
                />
                <div>
                  <Title level={5} className="text-gray-700 mb-1">在所有平台实时互通使用智达AI助手</Title>
                  <Text className="text-sm text-gray-500">App、终端 Pro</Text>
                </div>
              </div>
              <img 
                alt="二维码" 
                className="w-20 h-20" 
                src="https://pics5.baidu.com/feed/4b90f603738da977034c9f91d037b9168718e39a.jpeg@f_auto?token=2d263fb9f37411ca0f6accc659dd79b3"
              />
            </div>
          </Card>

          {/* 聊天输入组件 */}
          <div className="mt-8">
            <ModelSelector onChatToggle={handleChatToggle} />
          </div>
        </Content>
      </Layout>

      {/* 聊天界面 */}
      {isChatVisible && (
        <ChatInterface onClose={() => setIsChatVisible(false)} />
      )}
    </Layout>
  );
};

export default HomePage;
