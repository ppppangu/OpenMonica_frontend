import React from 'react'
import { List, Button, Tag, Typography, Empty } from 'antd'
import { 
  DeleteOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  FileOutlined,
  PictureOutlined,
  FileTextOutlined 
} from '@ant-design/icons'
import { FileAttachment } from '../../stores/fileStore'

const { Text } = Typography

interface FileAttachmentListProps {
  attachments: FileAttachment[]
  onPreview?: (attachment: FileAttachment) => void
  onDownload?: (attachment: FileAttachment) => void
  onRemove?: (attachmentId: string) => void
  showActions?: boolean
  groupByCategory?: boolean
  className?: string
}

const FileAttachmentList: React.FC<FileAttachmentListProps> = ({
  attachments,
  onPreview,
  onDownload,
  onRemove,
  showActions = true,
  groupByCategory = false,
  className = ''
}) => {
  const getFileIcon = (category: string, fileType: string) => {
    switch (category) {
      case 'image':
        return <PictureOutlined className="text-blue-500 text-lg" />
      case 'document':
        return <FileTextOutlined className="text-green-500 text-lg" />
      default:
        return <FileOutlined className="text-gray-500 text-lg" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'image':
        return 'blue'
      case 'document':
        return 'green'
      default:
        return 'default'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'image':
        return '图片'
      case 'document':
        return '文档'
      default:
        return '其他'
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getActions = (attachment: FileAttachment) => {
    const actions = []
    
    if (onPreview) {
      actions.push(
        <Button
          key="preview"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => onPreview(attachment)}
          title="预览"
        />
      )
    }
    
    if (onDownload) {
      actions.push(
        <Button
          key="download"
          type="text"
          icon={<DownloadOutlined />}
          onClick={() => onDownload(attachment)}
          title="下载"
        />
      )
    }
    
    if (onRemove) {
      actions.push(
        <Button
          key="remove"
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onRemove(attachment.id)}
          title="移除"
        />
      )
    }
    
    return actions
  }

  if (attachments.length === 0) {
    return (
      <Empty
        description="暂无文件"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        className={className}
      />
    )
  }

  if (groupByCategory) {
    const groupedAttachments = attachments.reduce((groups, attachment) => {
      const category = attachment.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(attachment)
      return groups
    }, {} as Record<string, FileAttachment[]>)

    return (
      <div className={className}>
        {Object.entries(groupedAttachments).map(([category, categoryAttachments]) => (
          <div key={category} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag color={getCategoryColor(category)}>
                {getCategoryName(category)} ({categoryAttachments.length})
              </Tag>
            </div>
            
            <List
              size="small"
              dataSource={categoryAttachments}
              renderItem={(attachment) => (
                <List.Item
                  actions={showActions ? getActions(attachment) : undefined}
                >
                  <List.Item.Meta
                    avatar={getFileIcon(attachment.category, attachment.file_type)}
                    title={
                      <div className="flex items-center gap-2">
                        <Text strong className="truncate">
                          {attachment.filename}
                        </Text>
                      </div>
                    }
                    description={
                      <div className="text-sm text-gray-500">
                        <div>{formatFileSize(attachment.file_size)}</div>
                        <div>{new Date(attachment.upload_time).toLocaleString()}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <List
      className={className}
      size="small"
      dataSource={attachments}
      renderItem={(attachment) => (
        <List.Item
          actions={showActions ? getActions(attachment) : undefined}
        >
          <List.Item.Meta
            avatar={getFileIcon(attachment.category, attachment.file_type)}
            title={
              <div className="flex items-center gap-2">
                <Text strong className="truncate">
                  {attachment.filename}
                </Text>
                <Tag 
                  color={getCategoryColor(attachment.category)} 
                  size="small"
                >
                  {getCategoryName(attachment.category)}
                </Tag>
              </div>
            }
            description={
              <div className="text-sm text-gray-500">
                <div>{formatFileSize(attachment.file_size)}</div>
                <div>{new Date(attachment.upload_time).toLocaleString()}</div>
              </div>
            }
          />
        </List.Item>
      )}
    />
  )
}

export default FileAttachmentList
