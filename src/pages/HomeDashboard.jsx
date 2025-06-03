import React from 'react';
import { Layout, Typography, Card, Row, Col, Avatar, Descriptions, Tag } from 'antd';
import { UserOutlined, MailOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;

const HomeDashboard = () => {
  const { user } = useAuth();

  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <Layout className="min-h-screen">
      <Sidebar />
      
      <Layout className="ml-20">
        <Content className="p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Title level={1} className="text-gray-800 m-0">
                我的账户
              </Title>
              <Text className="text-gray-600">
                管理您的个人信息和账户设置
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              {/* 用户信息卡片 */}
              <Col xs={24} lg={16}>
                <Card className="shadow-sm">
                  <div className="flex items-center mb-6">
                    <Avatar 
                      size={80} 
                      icon={<UserOutlined />}
                      className="bg-purple-500 mr-6"
                    >
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div>
                      <Title level={3} className="mb-2">
                        {user?.username || '未知用户'}
                      </Title>
                      <Text className="text-gray-600">
                        {user?.email || '未知邮箱'}
                      </Text>
                    </div>
                  </div>

                  <Descriptions 
                    title="账户信息" 
                    bordered 
                    column={1}
                    size="middle"
                  >
                    <Descriptions.Item 
                      label={<><UserOutlined className="mr-2" />用户名</>}
                    >
                      {user?.username || '未设置'}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<><MailOutlined className="mr-2" />邮箱地址</>}
                    >
                      {user?.email || '未设置'}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<><CalendarOutlined className="mr-2" />注册时间</>}
                    >
                      {formatDate(user?.created_at)}
                    </Descriptions.Item>
                    <Descriptions.Item 
                      label={<><CheckCircleOutlined className="mr-2" />账户状态</>}
                    >
                      <Tag color="green">正常</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              {/* 统计信息 */}
              <Col xs={24} lg={8}>
                <div className="space-y-6">
                  <Card className="shadow-sm text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      0
                    </div>
                    <Text className="text-gray-600">对话次数</Text>
                  </Card>

                  <Card className="shadow-sm text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      0
                    </div>
                    <Text className="text-gray-600">知识库数量</Text>
                  </Card>

                  <Card className="shadow-sm text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {user ? Math.floor((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <Text className="text-gray-600">使用天数</Text>
                  </Card>
                </div>
              </Col>
            </Row>

            {/* 快捷操作 */}
            <Card className="mt-8 shadow-sm">
              <Title level={4} className="mb-4">快捷操作</Title>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8} md={6}>
                  <div 
                    className="text-center p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = '/settings'}
                  >
                    <div className="text-2xl mb-2">⚙️</div>
                    <Text>个人设置</Text>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div 
                    className="text-center p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = '/brush'}
                  >
                    <div className="text-2xl mb-2">📚</div>
                    <Text>知识库</Text>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div 
                    className="text-center p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = '/help'}
                  >
                    <div className="text-2xl mb-2">❓</div>
                    <Text>帮助中心</Text>
                  </div>
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <div 
                    className="text-center p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = '/'}
                  >
                    <div className="text-2xl mb-2">🏠</div>
                    <Text>返回首页</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default HomeDashboard;
