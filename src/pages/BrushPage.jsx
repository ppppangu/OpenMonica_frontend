import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Button, Modal, Input, message, Dropdown, Empty } from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined,
  BookOutlined,
  MessageOutlined
} from '@ant-design/icons';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import { useAuth } from '../context/AuthContext';
import { useGlobal } from '../context/GlobalContext';
import axios from 'axios';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const BrushPage = () => {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const { user } = useAuth();
  const { globalData, updateGlobalData } = useGlobal();

  // 知识库样式配置
  const getKnowledgeBaseStyle = (name, description) => {
    const styles = [
      { color: 'bg-blue-100', icon: '📝' },
      { color: 'bg-green-100', icon: '📚' },
      { color: 'bg-purple-100', icon: '🔬' },
      { color: 'bg-orange-100', icon: '💼' },
      { color: 'bg-pink-100', icon: '🎨' },
      { color: 'bg-yellow-100', icon: '⚡' },
      { color: 'bg-indigo-100', icon: '🌟' },
      { color: 'bg-red-100', icon: '🎯' }
    ];
    
    const hash = (name + description).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return styles[Math.abs(hash) % styles.length];
  };

  // 获取知识库列表
  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      const userId = user?.uuid || globalData?.user_id;
      
      if (!userId) {
        console.error('用户ID不存在，无法获取知识库列表');
        // 显示模拟数据
        setKnowledgeBases([
          {
            id: 'demo-1',
            name: '演示知识库1',
            description: '这是一个演示知识库',
            itemCount: 5,
            color: 'bg-blue-100',
            icon: '📝'
          },
          {
            id: 'demo-2',
            name: '演示知识库2',
            description: '另一个演示知识库',
            itemCount: 3,
            color: 'bg-green-100',
            icon: '📚'
          }
        ]);
        return;
      }

      console.log('正在获取知识库列表，用户ID:', userId);

      const response = await axios.post('/api/user/knowledgebase/list', {
        user_id: userId
      });

      console.log('知识库列表响应:', response.data);

      if (response.data && response.data.success) {
        const kbList = response.data.data.map(kb => {
          const style = getKnowledgeBaseStyle(kb.name, kb.description);
          return {
            id: kb.id,
            name: kb.name,
            description: kb.description || '暂无描述',
            itemCount: kb.document_count || 0,
            color: style.color,
            icon: style.icon
          };
        });

        console.log('知识库列表获取成功:', kbList);
        setKnowledgeBases(kbList);
      } else {
        console.error('获取知识库列表失败:', response.data?.message);
        // 显示模拟数据作为后备
        setKnowledgeBases([
          {
            id: 'fallback-1',
            name: '金融知识库',
            description: '学习金融过程中的知识库',
            itemCount: 4,
            color: 'bg-blue-100',
            icon: '📝'
          },
          {
            id: 'fallback-2',
            name: '法律知识库',
            description: '法律相关资料',
            itemCount: 3,
            color: 'bg-green-100',
            icon: '📚'
          }
        ]);
      }
    } catch (error) {
      console.error('获取知识库列表时发生错误:', error);
      message.error('获取知识库列表失败');
      // 显示模拟数据作为后备
      setKnowledgeBases([
        {
          id: 'error-1',
          name: '金融知识库',
          description: '学习金融过程中的知识库',
          itemCount: 4,
          color: 'bg-blue-100',
          icon: '📝'
        },
        {
          id: 'error-2',
          name: '法律知识库',
          description: '法律相关资料',
          itemCount: 3,
          color: 'bg-green-100',
          icon: '📚'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 创建知识库
  const createKnowledgeBase = async () => {
    try {
      const { name, description } = createForm;
      
      if (!name.trim()) {
        message.error('请输入知识库名称');
        return;
      }

      const userId = user?.uuid || globalData?.user_id;
      if (!userId) {
        message.error('用户ID不存在，无法创建知识库');
        return;
      }

      console.log('正在创建知识库，用户ID:', userId, '名称:', name, '描述:', description);

      const response = await axios.post('/api/user/knowledgebase/create', {
        user_id: userId,
        name: name.trim(),
        description: description.trim()
      });

      console.log('创建知识库响应:', response.data);

      if (response.data && response.data.success) {
        message.success('知识库创建成功');
        setIsCreateModalVisible(false);
        setCreateForm({ name: '', description: '' });
        // 重新获取知识库列表
        await fetchKnowledgeBases();
      } else {
        message.error('创建知识库失败: ' + (response.data?.message || '未知错误'));
      }
    } catch (error) {
      console.error('创建知识库时发生错误:', error);
      message.error('创建知识库失败，请重试');
    }
  };

  // 删除知识库
  const deleteKnowledgeBase = async (knowledgeBaseId, knowledgeBaseName) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除知识库"${knowledgeBaseName}"吗？此操作不可撤销。`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const userId = user?.uuid || globalData?.user_id;
          if (!userId) {
            message.error('用户ID不存在，无法删除知识库');
            return;
          }

          console.log('正在删除知识库，用户ID:', userId, '知识库ID:', knowledgeBaseId);

          const response = await axios.post('/api/user/knowledgebase/delete', {
            user_id: userId,
            knowledgebase_id: knowledgeBaseId
          });

          console.log('删除知识库响应:', response.data);

          if (response.data && response.data.success) {
            message.success('知识库删除成功');
            // 重新获取知识库列表
            await fetchKnowledgeBases();
          } else {
            message.error('删除知识库失败: ' + (response.data?.message || '未知错误'));
          }
        } catch (error) {
          console.error('删除知识库时发生错误:', error);
          message.error('删除知识库失败，请重试');
        }
      }
    });
  };

  // 页面初始化
  useEffect(() => {
    console.log('知识库页面初始化...');
    fetchKnowledgeBases();
  }, [user]);

  const handleChatToggle = () => {
    setIsChatVisible(!isChatVisible);
  };

  // 知识库卡片菜单项
  const getKnowledgeBaseMenuItems = (kb) => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => {
        // TODO: 实现编辑功能
        message.info('编辑功能即将上线');
      }
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => deleteKnowledgeBase(kb.id, kb.name)
    }
  ];

  return (
    <Layout className="min-h-screen">
      <Sidebar onChatToggle={handleChatToggle} />
      
      <Layout className="ml-20">
        <Content className="p-8 overflow-y-auto">
          <div className="mb-8">
            <Title level={1} className="text-gray-800 m-0">
              知识库管理
            </Title>
          </div>

          {/* 聊天区域 */}
          <Card className="mb-8" style={{ minHeight: 400 }}>
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageOutlined className="text-4xl mb-4" />
                <Text>开始与AI助手对话</Text>
              </div>
            </div>
          </Card>

          {/* 知识库区域 */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <Title level={2} className="text-gray-700 m-0">我的知识库</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                新建知识库
              </Button>
            </div>

            {/* 知识库网格 */}
            {loading ? (
              <div className="text-center py-12">
                <Text>加载中...</Text>
              </div>
            ) : knowledgeBases.length === 0 ? (
              <Empty
                image={<BookOutlined className="text-6xl text-gray-300" />}
                description={
                  <div>
                    <Text className="text-lg font-medium text-gray-500">暂无知识库</Text>
                    <br />
                    <Text className="text-sm text-gray-400">点击"新建知识库"按钮创建您的第一个知识库</Text>
                  </div>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {knowledgeBases.map(kb => (
                  <Card
                    key={kb.id}
                    className={`hover:shadow-md transition-shadow cursor-pointer ${kb.color}`}
                    actions={[
                      <Dropdown
                        menu={{ items: getKnowledgeBaseMenuItems(kb) }}
                        trigger={['click']}
                        key="more"
                      >
                        <Button type="text" icon={<MoreOutlined />} />
                      </Dropdown>
                    ]}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-4">{kb.icon}</div>
                      <Title level={4} className="mb-2 truncate" title={kb.name}>
                        {kb.name}
                      </Title>
                      <Text className="text-sm text-gray-600 mb-4 block">
                        {kb.description}
                      </Text>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{kb.itemCount} 项内容</span>
                        <span>知识库</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </Content>
      </Layout>

      {/* 聊天界面 */}
      {isChatVisible && (
        <ChatInterface onClose={() => setIsChatVisible(false)} />
      )}

      {/* 创建知识库模态框 */}
      <Modal
        title="新建知识库"
        open={isCreateModalVisible}
        onOk={createKnowledgeBase}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setCreateForm({ name: '', description: '' });
        }}
        okText="创建"
        cancelText="取消"
      >
        <div className="space-y-4">
          <div>
            <Text strong>知识库名称 *</Text>
            <Input
              placeholder="请输入知识库名称"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              className="mt-2"
            />
          </div>
          <div>
            <Text strong>描述</Text>
            <TextArea
              placeholder="请输入知识库描述（可选）"
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-2"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default BrushPage;
