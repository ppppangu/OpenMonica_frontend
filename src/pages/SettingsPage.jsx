import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Input, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useGlobal } from '../context/GlobalContext';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const SettingsPage = () => {
  const [userPrompt, setUserPrompt] = useState('');
  const [modelMemory, setModelMemory] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState('');
  const { user } = useAuth();
  const { globalData } = useGlobal();

  // 自动保存定时器
  const [saveTimer, setSaveTimer] = useState(null);

  // 获取用户设置
  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      const userId = user?.uuid || globalData?.user_id;
      
      if (!userId) {
        console.log('用户ID不存在，跳过获取设置');
        return;
      }

      // 获取个性化提示词
      const promptResponse = await axios.post('/api/user/prompt/get', {
        user_id: userId
      });

      if (promptResponse.data && promptResponse.data.success) {
        setUserPrompt(promptResponse.data.data || '');
      }

      // 获取个性化记忆
      const memoryResponse = await axios.post('/api/user/memory/get', {
        user_id: userId
      });

      if (memoryResponse.data && memoryResponse.data.success) {
        setModelMemory(memoryResponse.data.data || '');
      }

    } catch (error) {
      console.error('获取用户设置失败:', error);
      // 不显示错误消息，因为可能是API不可用
    } finally {
      setLoading(false);
    }
  };

  // 保存设置
  const saveSettings = async (type, value) => {
    try {
      const userId = user?.uuid || globalData?.user_id;
      
      if (!userId) {
        message.error('用户ID不存在，无法保存设置');
        return;
      }

      const endpoint = type === 'prompt' ? '/api/user/prompt/update' : '/api/user/memory/update';
      
      const response = await axios.post(endpoint, {
        user_id: userId,
        new_text: value
      });

      if (response.data && response.data.success) {
        setSaveIndicator('已保存');
        setTimeout(() => setSaveIndicator(''), 2000);
      } else {
        console.error('保存失败:', response.data?.message);
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      // 不显示错误消息，静默处理
    }
  };

  // 自动保存处理
  const handleAutoSave = (type, value) => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    setSaveIndicator('保存中...');
    
    const timer = setTimeout(() => {
      saveSettings(type, value);
    }, 3000);

    setSaveTimer(timer);
  };

  // 处理用户提示词变化
  const handleUserPromptChange = (e) => {
    const value = e.target.value;
    setUserPrompt(value);
    handleAutoSave('prompt', value);
  };

  // 处理模型记忆变化
  const handleModelMemoryChange = (e) => {
    const value = e.target.value;
    setModelMemory(value);
    handleAutoSave('memory', value);
  };

  // 页面初始化
  useEffect(() => {
    fetchUserSettings();
    
    // 清理定时器
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  }, [user]);

  return (
    <Layout className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <Sidebar />
      
      <Layout className="ml-20">
        <Content className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <Title level={1} className="text-gray-800 m-0">
                  设置
                </Title>
                <Text className="text-gray-600">
                  个性化您的AI助手体验
                </Text>
              </div>
              
              {/* 保存指示器 */}
              {saveIndicator && (
                <div className="flex items-center text-green-600">
                  <SaveOutlined className="mr-2" />
                  <Text className="text-green-600">{saveIndicator}</Text>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Spin size="large" />
                <div className="mt-4">
                  <Text>加载设置中...</Text>
                </div>
              </div>
            ) : (
              <Row gutter={[24, 24]}>
                {/* 用户提示词 */}
                <Col xs={24} lg={12}>
                  <Card 
                    className="h-full shadow-sm"
                    style={{ backgroundColor: 'white' }}
                  >
                    <Title level={3} className="text-gray-700 mb-4">
                      用户提示词
                    </Title>
                    <Text className="text-gray-600 block mb-4">
                      设置您的个性化提示词，AI助手将根据这些信息来调整回答风格。
                    </Text>
                    <TextArea
                      value={userPrompt}
                      onChange={handleUserPromptChange}
                      placeholder="例如：我是一名软件工程师，请用技术性的语言与我交流..."
                      rows={12}
                      className="rounded-lg"
                      style={{ 
                        backgroundColor: 'white',
                        border: '1px solid #d9d9d9',
                        resize: 'none'
                      }}
                    />
                  </Card>
                </Col>

                {/* 模型记忆 */}
                <Col xs={24} lg={12}>
                  <Card 
                    className="h-full shadow-sm"
                    style={{ backgroundColor: 'white' }}
                  >
                    <Title level={3} className="text-gray-700 mb-4">
                      模型记忆
                    </Title>
                    <Text className="text-gray-600 block mb-4">
                      AI助手将记住这些信息，在后续对话中提供更个性化的服务。
                    </Text>
                    <TextArea
                      value={modelMemory}
                      onChange={handleModelMemoryChange}
                      placeholder="例如：我喜欢简洁的回答，不要太冗长。我对机器学习很感兴趣..."
                      rows={12}
                      className="rounded-lg"
                      style={{ 
                        backgroundColor: 'white',
                        border: '1px solid #d9d9d9',
                        resize: 'none'
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {/* 说明文字 */}
            <Card className="mt-6 shadow-sm" style={{ backgroundColor: 'white' }}>
              <Text className="text-gray-500 text-sm">
                💡 提示：您的设置会在停止输入3秒后自动保存。这些设置将影响AI助手与您的交互方式，
                帮助提供更个性化的服务体验。
              </Text>
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SettingsPage;
