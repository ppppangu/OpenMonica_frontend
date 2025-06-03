import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Typography, Avatar, message } from 'antd';
import { SendOutlined, CloseOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useGlobal } from '../context/GlobalContext';
import axios from 'axios';

const { Text } = Typography;
const { TextArea } = Input;

const ChatInterface = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { globalData, updateGlobalData } = useGlobal();

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamMessage]);

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'assistant',
      content: '在所有平台实时互通使用智达AI助手',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // 发送消息
  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setCurrentStreamMessage('');

    try {
      const userId = user?.uuid || globalData?.user_id;
      const sessionId = globalData?.session_id || 'default-session';
      const modelId = globalData?.selectedModelId || 'default-model';

      const requestData = {
        model_id: modelId,
        user_id: userId,
        session_id: sessionId,
        messages: [userMessage.content],
        extra: globalData?.extra_messages || [],
        stream: true
      };

      console.log('发送聊天请求:', requestData);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // 流式传输完成
              const finalMessage = {
                id: Date.now(),
                type: 'assistant',
                content: assistantMessage,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, finalMessage]);
              setCurrentStreamMessage('');
              setIsStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                const content = parsed.choices[0].delta.content || '';
                assistantMessage += content;
                setCurrentStreamMessage(assistantMessage);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败，请重试');
      
      // 添加错误消息
      const errorMessage = {
        id: Date.now(),
        type: 'assistant',
        content: '抱歉，我现在无法回复您的消息。请稍后重试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setCurrentStreamMessage('');
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card 
        className="w-full max-w-4xl h-5/6 flex flex-col"
        title={
          <div className="flex justify-between items-center">
            <Text strong>AI助手对话</Text>
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            />
          </div>
        }
        bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-3xl ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <Avatar 
                  icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  className={message.type === 'user' ? 'bg-purple-500' : 'bg-blue-500'}
                />
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <Text className={message.type === 'user' ? 'text-white' : 'text-gray-800'}>
                    {message.content}
                  </Text>
                </div>
              </div>
            </div>
          ))}

          {/* 流式消息 */}
          {isStreaming && currentStreamMessage && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-3xl">
                <Avatar icon={<RobotOutlined />} className="bg-blue-500" />
                <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
                  <Text className="text-gray-800">
                    {currentStreamMessage}
                    <span className="animate-pulse">|</span>
                  </Text>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4">
          <div className="flex space-x-3">
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              className="flex-1"
              disabled={isStreaming}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              loading={isStreaming}
              disabled={!inputValue.trim()}
              className="self-end"
            >
              发送
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatInterface;
