import React from 'react';
import { Layout, Typography, Card, Row, Col, Anchor } from 'antd';
import { QuestionCircleOutlined, BookOutlined, SafetyOutlined } from '@ant-design/icons';
import Sidebar from '../components/Sidebar';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const HelpPage = () => {
  const sections = [
    {
      id: 'getting-started',
      title: '快速开始',
      icon: <BookOutlined />,
      content: (
        <div>
          <Paragraph>
            欢迎使用智达AI助手！这里是您开始使用的指南：
          </Paragraph>
          <ul>
            <li>注册并登录您的账户</li>
            <li>选择合适的AI模型</li>
            <li>开始与AI助手对话</li>
            <li>创建和管理您的知识库</li>
          </ul>
        </div>
      )
    },
    {
      id: 'features',
      title: '功能介绍',
      icon: <QuestionCircleOutlined />,
      content: (
        <div>
          <Paragraph>
            智达AI助手提供以下主要功能：
          </Paragraph>
          <ul>
            <li><strong>智能对话：</strong>与AI助手进行自然语言对话</li>
            <li><strong>知识库管理：</strong>创建和管理个人知识库</li>
            <li><strong>多模型支持：</strong>支持多种AI模型选择</li>
            <li><strong>个性化设置：</strong>自定义提示词和记忆功能</li>
          </ul>
        </div>
      )
    },
    {
      id: 'privacy',
      title: '隐私政策',
      icon: <SafetyOutlined />,
      content: (
        <div>
          <Paragraph>
            我们重视您的隐私和数据安全：
          </Paragraph>
          <ul>
            <li>您的对话数据仅用于提供服务</li>
            <li>我们不会与第三方分享您的个人信息</li>
            <li>所有数据传输都经过加密处理</li>
            <li>您可以随时删除您的数据</li>
          </ul>
        </div>
      )
    }
  ];

  const anchorItems = sections.map(section => ({
    key: section.id,
    href: `#${section.id}`,
    title: section.title
  }));

  return (
    <Layout className="min-h-screen bg-white">
      <Sidebar />
      
      <Layout className="ml-20">
        <Content className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <Title level={1} className="text-gray-800 m-0">
                帮助中心
              </Title>
              <Text className="text-gray-600">
                了解如何使用智达AI助手的各项功能
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              {/* 侧边导航 */}
              <Col xs={24} md={6}>
                <Card className="sticky top-8">
                  <Title level={4} className="mb-4">目录</Title>
                  <Anchor
                    items={anchorItems}
                    offsetTop={100}
                    className="help-anchor"
                  />
                </Card>
              </Col>

              {/* 主要内容 */}
              <Col xs={24} md={18}>
                <div className="space-y-8">
                  {sections.map(section => (
                    <Card key={section.id} id={section.id} className="shadow-sm">
                      <div className="flex items-center mb-4">
                        <div className="text-2xl text-purple-500 mr-3">
                          {section.icon}
                        </div>
                        <Title level={2} className="m-0">
                          {section.title}
                        </Title>
                      </div>
                      <div className="text-gray-700">
                        {section.content}
                      </div>
                    </Card>
                  ))}
                </div>
              </Col>
            </Row>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default HelpPage;
