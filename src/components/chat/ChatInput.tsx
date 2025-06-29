import React, { useState, useRef } from 'react'
import { Input, Button, Upload, message } from 'antd'
import { SendOutlined, PaperClipOutlined, MicrophoneOutlined } from '@ant-design/icons'
import { useFileStore } from '../../stores/fileStore'
import { useFileUploadMutation } from '../../hooks/useApi'

const { TextArea } = Input

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  disabled = false, 
  placeholder = "输入消息..." 
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const textAreaRef = useRef<any>(null)
  
  const { addAttachment, isUploading } = useFileStore()
  const fileUploadMutation = useFileUploadMutation()

  const handleSend = () => {
    const trimmedValue = inputValue.trim()
    if (!trimmedValue || disabled) return

    onSend(trimmedValue)
    setInputValue('')
    
    // Focus back to input
    setTimeout(() => {
      textAreaRef.current?.focus()
    }, 100)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const result = await fileUploadMutation.mutateAsync(formData)
      
      if (result.public_url) {
        const attachment = {
          id: Date.now().toString(),
          filename: file.name,
          public_url: result.public_url,
          file_type: file.type,
          file_size: file.size,
          upload_time: new Date().toISOString(),
          category: file.type.startsWith('image/') ? 'image' as const : 'document' as const
        }
        
        addAttachment(attachment)
        message.success(`文件 ${file.name} 上传成功`)
      }
    } catch (error) {
      console.error('File upload failed:', error)
      message.error(`文件 ${file.name} 上传失败`)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          await handleFileUpload(file)
        }
      }
    }
  }

  const uploadProps = {
    beforeUpload: (file: File) => {
      handleFileUpload(file)
      return false // Prevent default upload
    },
    showUploadList: false,
    multiple: true,
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* File Upload */}
        <Upload {...uploadProps}>
          <Button
            icon={<PaperClipOutlined />}
            disabled={disabled || isUploading}
            loading={isUploading}
            title="上传文件"
          />
        </Upload>

        {/* Text Input */}
        <div className="flex-1">
          <TextArea
            ref={textAreaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="resize-none"
          />
        </div>

        {/* Voice Input (placeholder) */}
        <Button
          icon={<MicrophoneOutlined />}
          disabled={disabled}
          title="语音输入"
          onClick={() => message.info('语音输入功能开发中...')}
        />

        {/* Send Button */}
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={disabled || !inputValue.trim()}
          title="发送消息 (Enter)"
        >
          发送
        </Button>
      </div>

      {/* File attachments preview could go here */}
    </div>
  )
}

export default ChatInput
