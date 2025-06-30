import { Card, Input, Button, message, Spin } from 'antd'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useCustomData, useUpdateCustomDataMutation } from '../../hooks/useApi'

interface Props {
  titleLabel: string
  target: 'custom_personality' | 'custom_memory'
  bodyPlaceholder?: string
}

export default function CustomEditorSection({ titleLabel, target, bodyPlaceholder }: Props) {
  const userId = useAuthStore(state => state.user?.id) || ''
  const { data, isLoading, isError, refetch } = useCustomData(userId, target)
  const updateMutation = useUpdateCustomDataMutation()
  const [text, setText] = useState('')

  useEffect(() => {
    if (typeof data === 'string') {
      setText(data)
    }
  }, [data])

  const handleSave = async () => {
    if (!userId) {
      message.warning('请先登录')
      return
    }
    try {
      await updateMutation.mutateAsync({ user_id: userId, target, new_text: text })
      message.success('保存成功')
      refetch()
    } catch (e: any) {
      message.error(e.message || '保存失败')
    }
  }

  return (
    <Card title={titleLabel} bordered={false} extra={<Button type="primary" loading={updateMutation.isPending} onClick={handleSave}>保存</Button>}>
      {isLoading ? (
        <div className="flex justify-center items-center h-40"><Spin /></div>
      ) : isError ? (
        <p className="text-red-500">加载失败</p>
      ) : (
        <Input.TextArea
          autoSize={{ minRows: 8, maxRows: 16 }}
          placeholder={bodyPlaceholder}
          value={text}
          onChange={e => setText(e.target.value)}
        />
      )}
    </Card>
  )
} 