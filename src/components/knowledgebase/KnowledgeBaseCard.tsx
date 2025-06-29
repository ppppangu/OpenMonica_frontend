import React from 'react'
import { Card, Typography, Tag, Button, Dropdown } from 'antd'
import { 
  FileTextOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined 
} from '@ant-design/icons'
import { KnowledgeBase } from '../../stores/knowledgeBaseStore'

const { Title, Text } = Typography

interface KnowledgeBaseCardProps {
  knowledgeBase: KnowledgeBase
  onSelect: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  isActive?: boolean
}

const KnowledgeBaseCard: React.FC<KnowledgeBaseCardProps> = ({
  knowledgeBase,
  onSelect,
  onEdit,
  onDelete,
  isActive = false
}) => {
  const menuItems = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: '查看详情',
      onClick: () => onSelect(knowledgeBase.knowledgebase_id)
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => onEdit?.(knowledgeBase.knowledgebase_id)
    },
    {
      type: 'divider' as const
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => onDelete?.(knowledgeBase.knowledgebase_id)
    }
  ]

  return (
    <Card
      hoverable
      className={`
        transition-all duration-200 cursor-pointer
        ${isActive ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md'}
      `}
      onClick={() => onSelect(knowledgeBase.knowledgebase_id)}
      actions={[
        <Button
          key="view"
          type="text"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(knowledgeBase.knowledgebase_id)
          }}
        >
          查看
        </Button>,
        <Dropdown
          key="more"
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ]}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-primary-600 text-lg" />
            <Title level={4} className="m-0 truncate">
              {knowledgeBase.name}
            </Title>
          </div>
        </div>

        {/* Description */}
        <Text type="secondary" className="block">
          {knowledgeBase.description || '暂无描述'}
        </Text>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <Tag color="blue">
            {knowledgeBase.document_count} 个文档
          </Tag>
          
          <Text type="secondary" className="text-xs">
            {new Date(knowledgeBase.updated_at).toLocaleDateString()}
          </Text>
        </div>
      </div>
    </Card>
  )
}

export default KnowledgeBaseCard
