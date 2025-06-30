import React, { useState } from 'react'
import { Modal, Form, Upload, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useDocumentUploadMutation } from '../../hooks/useApi'

interface UploadModalProps {
  open: boolean
  onClose: () => void
  knowledgeBaseId: string
}

const UploadModal: React.FC<UploadModalProps> = ({ open, onClose, knowledgeBaseId }) => {
  const [fileList, setFileList] = useState<any[]>([])
  const uploadMutation = useDocumentUploadMutation()

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件')
      return
    }

    const formData = new FormData()
    formData.append('knowledgebase_id', knowledgeBaseId)
    fileList.forEach(file => {
      formData.append('file', file.originFileObj)
    })

    try {
      await uploadMutation.mutateAsync(formData, {
        onSuccess: () => {
          message.success('上传成功')
          setFileList([])
          onClose()
        },
        onError: () => {
          message.error('上传失败')
        },
      })
    } catch (error) {
      // handled above
    }
  }

  return (
    <Modal
      title="上传文档"
      open={open}
      onCancel={onClose}
      onOk={handleUpload}
      okText="上传"
      confirmLoading={uploadMutation.isPending}
    >
      <Form layout="vertical">
        <Form.Item label="选择文件">
          <Upload.Dragger
            accept=".pdf,.md,.txt,.doc,.docx"
            beforeUpload={() => false}
            multiple
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            disabled={uploadMutation.isPending}
          >
            <p className="ant-upload-drag-icon">
              <PlusOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UploadModal 