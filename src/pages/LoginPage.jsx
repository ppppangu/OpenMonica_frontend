import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // 登录处理
  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/user/login', {
        email: values.email,
        password: values.password
      });

      if (response.data && response.data.success) {
        // 保存token和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // 更新认证状态
        login(response.data.user);
        
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(response.data?.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error(error.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 注册处理
  const handleRegister = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/user/register', {
        username: values.username,
        email: values.email,
        password: values.password
      });

      if (response.data && response.data.success) {
        message.success('注册成功，请登录');
        setActiveTab('login');
      } else {
        message.error(response.data?.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      message.error(error.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              className="w-full"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          name="register"
          onFinish={handleRegister}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少8个字符' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请再次输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              className="w-full"
            >
              注册
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <Title level={2} className="text-gray-800 mb-2">
            智达AI助手
          </Title>
          <Text className="text-gray-600">
            欢迎使用智能助手平台
          </Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default LoginPage;
