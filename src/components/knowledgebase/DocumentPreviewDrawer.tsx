import React from 'react'
import { Drawer, Spin } from 'antd'
import { Document } from '../../stores/knowledgeBaseStore'

interface DocumentPreviewDrawerProps {
  open: boolean
  document: Document | null
  onClose: () => void
}

const DocumentPreviewDrawer: React.FC<DocumentPreviewDrawerProps> = ({ open, document, onClose }) => {
  const renderContent = () => {
    if (!document) return null

    // If pdf path exists, embed iframe else markdown.
    if (document.pdf_file_path) {
      return (
        <iframe
          src={document.pdf_file_path}
          title="PDF Preview"
          className="w-full h-full border-0"
        />
      )
    }

    if (document.markdown_file_path) {
      return (
        <iframe
          src={document.markdown_file_path}
          title="Markdown Preview"
          className="w-full h-full border-0"
        />
      )
    }

    return <p className="text-center mt-10">暂不支持预览该文件类型</p>
  }

  return (
    <Drawer
      title={document?.filename || '文档预览'}
      placement="right"
      width={640}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      {document ? renderContent() : <Spin />}
    </Drawer>
  )
}

export default DocumentPreviewDrawer 