import React, { useState, useEffect } from 'react';
import { Card, Select, Input, Button, Typography, message } from 'antd';
import { SendOutlined, SettingOutlined } from '@ant-design/icons';
import { useGlobal } from '../context/GlobalContext';
import axios from 'axios';

const { Text } = Typography;
const { TextArea } = Input;

const ModelSelector = ({ onChatToggle }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const { globalData, updateGlobalData } = useGlobal();

  // 获取可用模型列表
  const fetchModels = async () => {
    try {
      const response = await axios.get('/api/models');
      if (response.data && response.data.success) {
        const models = response.data.data || [];
        updateGlobalData({ 
          availableModels: models,
          selectedModelId: models.length > 0 ? models[0].id : '',
          selectedModelName: models.length > 0 ? models[0].name : 'Sonnet'
        });
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      // 使用默认模型
      updateGlobalData({
        availableModels: [
          { id: 'default', name: 'Sonnet' },
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'claude', name: 'Claude' }
        ],
        selectedModelId: 'default',
        selectedModelName: 'Sonnet'
      });
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // 处理模型选择
  const handleModelChange = (value) => {
    const selectedModel = globalData.availableModels.find(model => model.id === value);
    updateGlobalData({
      selectedModelId: value,
      selectedModelName: selectedModel ? selectedModel.name : 'Unknown'
    });
  };

  // 处理发送消息
  const handleSend = () => {
    if (!inputValue.trim()) {
      message.warning('请输入您的问题');
      return;
    }

    // 更新全局数据中的用户输入
    updateGlobalData({
      userInput: [inputValue.trim()]
    });

    // 清空输入框
    setInputValue('');

    // 打开聊天界面
    if (onChatToggle) {
      onChatToggle();
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="shadow-sm">
      <div className="space-y-4">
        {/* 模型选择器 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Text strong>AI模型:</Text>
            <Select
              value={globalData.selectedModelId}
              onChange={handleModelChange}
              style={{ width: 200 }}
              placeholder="选择AI模型"
            >
              {globalData.availableModels.map(model => (
                <Select.Option key={model.id} value={model.id}>
                  {model.name}
                </Select.Option>
              ))}
            </Select>
          </div>
          
          <Button 
            type="text" 
            icon={<SettingOutlined />}
            onClick={() => window.location.href = '/settings'}
            className="text-gray-500 hover:text-gray-700"
          >
            设置
          </Button>
        </div>

        {/* 输入区域 */}
        <div className="flex space-x-3">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题，按Enter发送..."
            autoSize={{ minRows: 3, maxRows: 6 }}
            className="flex-1"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!inputValue.trim()}
            className="self-end"
            size="large"
          >
            发送
          </Button>
        </div>

        {/* 提示文字 */}
        <div className="text-center">
          <Text className="text-gray-500 text-sm">
            当前模型: {globalData.selectedModelName} | 按 Shift+Enter 换行
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default ModelSelector;
