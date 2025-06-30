import React, { useState } from 'react'
import { Upload, Button, Progress, Card, List, Typography, App } from 'antd'
import { 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  FileOutlined,
  PictureOutlined 
} from '@ant-design/icons'
import { useFileStore } from '../../stores/fileStore'
import { useFileUploadMutation } from '../../hooks/useApi'

const { Text } = Typography

interface FileUploadProps {
  onUploadComplete?: (files: any[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  showPreview?: boolean
  className?: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  accept,
  multiple = true,
  maxSize = 10,
  showPreview = true,
  className = ''
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({})
  const { 
    attachments, 
    addAttachment, 
    removeAttachment, 
    categorizeFile 
  } = useFileStore()
  
  const fileUploadMutation = useFileUploadMutation()
  const { message } = App.useApp()

  const handleUpload = async (file: File) => {
    const fileId = `${file.name}_${Date.now()}`
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      message.error(`文件 ${file.name} 超过 ${maxSize}MB 限制`)
      return false
    }

    try {
      setUploadingFiles(prev => ({ ...prev, [fileId]: 0 }))

      const formData = new FormData()
      formData.append('file', file)

      // Simulate upload progress (since we don't have real progress from the API)
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => {
          const currentProgress = prev[fileId] || 0
          if (currentProgress < 90) {
            return { ...prev, [fileId]: currentProgress + 10 }
          }
          return prev
        })
      }, 200)

      const result: any = await fileUploadMutation.mutateAsync(formData)
      
      clearInterval(progressInterval)
      
      if (result.public_url) {
        const attachment = {
          id: fileId,
          filename: file.name,
          public_url: result.public_url,
          file_type: file.type,
          file_size: file.size,
          upload_time: new Date().toISOString(),
          category: categorizeFile(file.name)
        }
        
        addAttachment(attachment)
        setUploadingFiles(prev => ({ ...prev, [fileId]: 100 }))
        
        setTimeout(() => {
          setUploadingFiles(prev => {
            const { [fileId]: removed, ...rest } = prev
            return rest
          })
        }, 1000)

        message.success(`文件 ${file.name} 上传成功`)
        onUploadComplete?.([attachment])
      }
    } catch (error) {
      console.error('File upload failed:', error)
      message.error(`文件 ${file.name} 上传失败`)
      setUploadingFiles(prev => {
        const { [fileId]: removed, ...rest } = prev
        return rest
      })
    }

    return false // Prevent default upload
  }

  const handleRemove = (attachmentId: string) => {
    removeAttachment(attachmentId)
    message.success('文件已移除')
  }

  const handlePreview = (attachment: any) => {
    if (attachment.category === 'image') {
      // Open image in new tab
      window.open(attachment.public_url, '_blank')
    } else {
      // For documents, could open in iframe or download
      window.open(`/user/file/proxy?url=${encodeURIComponent(attachment.public_url)}`, '_blank')
    }
  }

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <PictureOutlined className="text-blue-500" />
      default:
        return <FileOutlined className="text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className={className}>
      {/* Upload Area */}
      <Upload.Dragger
        beforeUpload={handleUpload}
        accept={accept}
        multiple={multiple}
        showUploadList={false}
        className="mb-4"
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持单个或批量上传，文件大小不超过 {maxSize}MB
        </p>
      </Upload.Dragger>

      {/* Upload Progress */}
      {Object.entries(uploadingFiles).map(([fileId, progress]) => (
        <div key={fileId} className="mb-2">
          <Text className="text-sm">{fileId.split('_')[0]}</Text>
          <Progress percent={progress} size="small" />
        </div>
      ))}

      {/* File List */}
      {showPreview && attachments.length > 0 && (
        <Card title="已上传文件" size="small">
          <List
            size="small"
            dataSource={attachments}
            renderItem={(attachment) => (
              <List.Item
                actions={[
                  <Button
                    key="preview"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(attachment)}
                    title="预览"
                  />,
                  <Button
                    key="delete"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(attachment.id)}
                    title="删除"
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={getFileIcon(attachment.category)}
                  title={attachment.filename}
                  description={`${formatFileSize(attachment.file_size)} • ${new Date(attachment.upload_time).toLocaleString()}`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  )
}

export default FileUpload
