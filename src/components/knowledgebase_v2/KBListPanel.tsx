import { useKnowledgeBaseStoreV2 } from '../../stores/knowledgeBaseStoreV2'
import { Button, List, Input, Space, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'
import { useState } from 'react'
import { KBCreateEditModal } from './KBCreateEditModal'

interface Props {
  className?: string
}

export function KBListPanel({ className }: Props) {
  const userId = useAuthStore(state => state.user?.id) || ''
  const { list, currentKB, fetchDetail, remove, createOrUpdate } = useKnowledgeBaseStoreV2()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = list.filter(kb => kb.name.toLowerCase().includes(search.toLowerCase()))

  const handleSelect = (kbId: string) => {
    const uid = useAuthStore.getState().user?.id || ''
    if (!uid) {
      message.warning('请先登录')
      return
    }
    fetchDetail(uid, kbId)
  }

  return (
    <div className={`p-2 flex flex-col ${className ?? ''}`}>
      <Space style={{ marginBottom: 8 }}>
        <Input.Search
          placeholder="搜索"
          size="small"
          onChange={e => setSearch(e.target.value)}
        />
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建</Button>
      </Space>
      <div className="flex-1 overflow-auto">
        <List
          size="small"
          dataSource={filtered}
          renderItem={item => (
            <List.Item
              className={`cursor-pointer ${currentKB?.id === item.id ? 'bg-blue-50' : ''}`}
              onClick={() => handleSelect(item.id)}
              actions={[
                <DeleteOutlined key="del" onClick={(e) => { e.stopPropagation(); remove(userId, item.id) }} />
              ]}
            >
              <div className="flex-1 truncate">{item.name}</div>
            </List.Item>
          )}
        />
      </div>
      <KBCreateEditModal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={async (values) => {
          try {
            await createOrUpdate({ userId, name: values.name, description: values.description })
            message.success('创建成功')
            setOpen(false)
          } catch (e:any) {
            message.error(e.message)
          }
        }}
      />
    </div>
  )
} 