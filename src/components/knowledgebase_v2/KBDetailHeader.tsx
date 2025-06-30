import { Card, Button, Popconfirm, message } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useKnowledgeBaseStoreV2 } from '../../stores/knowledgeBaseStoreV2'
import { useAuthStore } from '../../stores/authStore'
import { useState } from 'react'
import { KBCreateEditModal } from './KBCreateEditModal'

export function KBDetailHeader() {
  const userId = useAuthStore(state => state.user?.id) || ''
  const { currentKB, createOrUpdate, remove } = useKnowledgeBaseStoreV2()
  const [open, setOpen] = useState(false)

  if (!currentKB) return null

  const handleDelete = async () => {
    try {
      await remove(userId, currentKB.id)
      message.success('已删除')
    } catch (e:any) {
      message.error(e.message)
    }
  }

  return (
    <>
      <Card
        title={currentKB.name}
        extra={<span>{(currentKB.document_count ?? currentKB.documents?.length ?? 0)} 个文档</span>}
        bordered={false}
        actions={[]}
      >
        <p className="text-gray-600 mb-2 whitespace-pre-wrap">{currentKB.description || '暂无描述'}</p>
        <div className="flex gap-2">
          <Button icon={<EditOutlined />} size="small" onClick={() => setOpen(true)}>编辑</Button>
          <Popconfirm title="确认删除该知识库?" onConfirm={handleDelete}>
            <Button icon={<DeleteOutlined />} danger size="small">删除</Button>
          </Popconfirm>
        </div>
      </Card>
      <KBCreateEditModal
        open={open}
        initial={{ name: currentKB.name, description: currentKB.description }}
        onCancel={() => setOpen(false)}
        onOk={async (values) => {
          try {
            await createOrUpdate({ userId, kbId: currentKB.id, name: values.name, description: values.description })
            message.success('已更新')
            setOpen(false)
          } catch (e:any) {
            message.error(e.message)
          }
        }}
      />
    </>
  )
} 