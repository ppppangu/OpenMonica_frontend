import React, { useEffect, useState } from 'react'
import { Layout, Menu, Button, Input, Modal, Form, message, Tabs } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  BookOutlined,
  FileTextOutlined,
  ShareAltOutlined
} from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { useKnowledgeBaseStore } from '../stores/knowledgeBaseStore'
import { useKnowledgeBaseList, useKnowledgeBaseDetail, useKnowledgeBaseCreateMutation } from '../hooks/useApi'
import KnowledgeBaseCard from '../components/knowledgebase/KnowledgeBaseCard'
import DocumentList from '../components/knowledgebase/DocumentList'
import KnowledgeGraph from '../components/knowledgebase/KnowledgeGraph'

const { Sider, Content } = Layout
const { TabPane } = Tabs

const KnowledgeBasePage: React.FC = () => {
  const { user } = useAuth()
  const {
    knowledgeBases,
    activeKnowledgeBaseId,
    documents,
    currentView,
    graphData,
    isGraphLoading,
    graphError,
    setKnowledgeBases,
    setActiveKnowledgeBase,
    setDocuments,
    setCurrentView,
    getActiveKnowledgeBase
  } = useKnowledgeBaseStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [createForm] = Form.useForm()

  // Fetch knowledge bases
  const { data: kbList, isLoading: kbLoading } = useKnowledgeBaseList(user?.id || '')
  const { data: kbDetail, isLoading: detailLoading } = useKnowledgeBaseDetail(activeKnowledgeBaseId || '')
  const createKbMutation = useKnowledgeBaseCreateMutation()

  // Update store when data changes
  useEffect(() => {
    if (kbList) {
      setKnowledgeBases(kbList)
    }
  }, [kbList, setKnowledgeBases])

  useEffect(() => {
    if (kbDetail?.documents) {
      setDocuments(kbDetail.documents)
    }
  }, [kbDetail, setDocuments])

  const handleCreateKnowledgeBase = async (values: any) => {
    try {
      await createKbMutation.mutateAsync({
        ...values,
        user_id: user?.id || ''
      })
      message.success('知识库创建成功')
      setShowCreateModal(false)
      createForm.resetFields()
    } catch (error) {
      message.error('创建失败，请稍后重试')
    }
  }

  const handleSelectKnowledgeBase = (id: string) => {
    setActiveKnowledgeBase(id)
    setCurrentView('detail')
  }

  const activeKb = getActiveKnowledgeBase()

  const sidebarMenuItems = [
    {
      key: 'dashboard',
      icon: <BookOutlined />,
      label: '知识库概览',
    },
    ...(activeKb ? [
      {
        key: 'detail',
        icon: <FileTextOutlined />,
        label: '知识库详情',
      },
      {
        key: 'graph',
        icon: <ShareAltOutlined />,
        label: '知识图谱',
      }
    ] : [])
  ]

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">知识库管理</h2>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
              >
                创建知识库
              </Button>
            </div>

            {/* Search */}
            <Input
              placeholder="搜索知识库..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />

            {/* Knowledge Base Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeBases
                .filter(kb =>
                  !searchTerm ||
                  kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  kb.description?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(kb => (
                  <KnowledgeBaseCard
                    key={kb.knowledgebase_id}
                    knowledgeBase={kb}
                    onSelect={handleSelectKnowledgeBase}
                    isActive={kb.knowledgebase_id === activeKnowledgeBaseId}
                  />
                ))}
            </div>
          </div>
        )

      case 'detail':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{activeKb?.name}</h2>
                <p className="text-gray-600">{activeKb?.description}</p>
              </div>
              <Button type="primary" icon={<PlusOutlined />}>
                上传文档
              </Button>
            </div>

            <DocumentList
              documents={documents}
              loading={detailLoading}
              onPreview={(doc) => message.info(`预览文档: ${doc.filename}`)}
              onDownload={(doc) => window.open(doc.pdf_file_path || doc.markdown_file_path)}
              onDelete={(id) => message.info(`删除文档: ${id}`)}
            />
          </div>
        )

      case 'graph':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">知识图谱 - {activeKb?.name}</h2>

            <KnowledgeGraph
              data={graphData}
              loading={isGraphLoading}
              error={graphError}
              onReload={() => message.info('重新加载图谱...')}
              onNodeClick={(node) => message.info(`点击节点: ${node.label}`)}
              className="h-full"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Layout className="h-full">
      <Sider width={260} className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">导航</h3>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentView]}
          items={sidebarMenuItems}
          onClick={({ key }) => setCurrentView(key as any)}
          className="border-r-0"
        />
      </Sider>

      <Content className="p-6 overflow-auto">
        {renderContent()}
      </Content>

      {/* Create Knowledge Base Modal */}
      <Modal
        title="创建知识库"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateKnowledgeBase}
        >
          <Form.Item
            name="name"
            label="知识库名称"
            rules={[{ required: true, message: '请输入知识库名称' }]}
          >
            <Input placeholder="输入知识库名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea
              placeholder="输入知识库描述"
              rows={3}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowCreateModal(false)}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createKbMutation.isPending}
              >
                创建
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default KnowledgeBasePage
