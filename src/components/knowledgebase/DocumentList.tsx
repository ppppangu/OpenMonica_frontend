import React from 'react'
import { List, Typography, Tag, Button, Space, Empty } from 'antd'
import { 
  FileTextOutlined, 
  DownloadOutlined, 
  EyeOutlined,
  DeleteOutlined 
} from '@ant-design/icons'
import { Document } from '../../stores/knowledgeBaseStore'

const { Text } = Typography

interface DocumentListProps {
  documents: Document[]
  onPreview?: (document: Document) => void
  onDownload?: (document: Document) => void
  onDelete?: (documentId: string) => void
  loading?: boolean
  selectedDocumentId?: string
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onPreview,
  onDownload,
  onDelete,
  loading = false,
  selectedDocumentId
}) => {
  const getFileSize = (bytes?: number) => {
    if (!bytes) return '未知大小'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed':
      case 'completed':
        return 'green'
      case 'processing':
        return 'blue'
      case 'failed':
      case 'error':
        return 'red'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed':
      case 'completed':
        return '已处理'
      case 'processing':
        return '处理中'
      case 'failed':
      case 'error':
        return '处理失败'
      default:
        return status
    }
  }

  if (documents.length === 0 && !loading) {
    return (
      <Empty
        description="暂无文档"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  return (
    <List
      loading={loading}
      dataSource={documents}
      renderItem={(document) => (
        <List.Item
          className={`
            transition-colors duration-200 cursor-pointer
            ${selectedDocumentId === document.document_id ? 'bg-primary-50 border-primary-200' : 'hover:bg-gray-50'}
          `}
          onClick={() => onPreview?.(document)}
          actions={[
            <Button
              key="preview"
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                onPreview?.(document)
              }}
              title="预览"
            />,
            <Button
              key="download"
              type="text"
              icon={<DownloadOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                onDownload?.(document)
              }}
              title="下载"
            />,
            <Button
              key="delete"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(document.document_id)
              }}
              title="删除"
            />
          ]}
        >
          <List.Item.Meta
            avatar={<FileTextOutlined className="text-primary-600 text-lg" />}
            title={
              <div className="flex items-center gap-2">
                <Text strong className="truncate">
                  {document.filename}
                </Text>
                <Tag color={getStatusColor(document.status)} size="small">
                  {getStatusText(document.status)}
                </Tag>
              </div>
            }
            description={
              <Space direction="vertical" size="small" className="w-full">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>大小: {getFileSize(document.file_size)}</span>
                  <span>上传时间: {new Date(document.upload_time).toLocaleString()}</span>
                </div>
                
                {/* File paths */}
                <div className="flex flex-wrap gap-2">
                  {document.pdf_file_path && (
                    <Tag color="orange" size="small">PDF</Tag>
                  )}
                  {document.markdown_file_path && (
                    <Tag color="blue" size="small">Markdown</Tag>
                  )}
                </div>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  )
}

export default DocumentList
