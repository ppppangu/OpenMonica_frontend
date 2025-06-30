import { Modal, Form, Input } from 'antd'
import { useEffect } from 'react'

interface Props {
  open: boolean
  initial?: { name: string; description: string }
  onOk: (values: { name: string; description: string }) => void
  onCancel: () => void
}

export function KBCreateEditModal({ open, initial, onOk, onCancel }: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initial || { name: '', description: '' })
    }
  }, [open])

  const handleOk = async () => {
    const values = await form.validateFields()
    onOk(values)
  }

  return (
    <Modal
      title={initial ? '编辑知识库' : '新建知识库'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={initial}>
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input.TextArea rows={3} maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  )
} 