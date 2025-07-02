import { Card, Input, Button, message, Spin } from 'antd'
import { useState, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useCustomData, useUpdateCustomDataMutation } from '../../hooks/useApi'

interface Props {
  titleLabel: string
  target: 'custom_personality' | 'custom_memory'
  bodyPlaceholder?: string
  /**
   * Description text displayed under the section title (optional)
   */
  description?: ReactNode
}

export default function CustomEditorSection({ titleLabel, target, bodyPlaceholder, description }: Props) {
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
    <Card
      title={titleLabel}
      bordered={false}
      extra={<Button type="primary" loading={updateMutation.isPending} onClick={handleSave}>保存</Button>}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {/* Optional description */}
      {description && <p className="text-gray-500 text-sm mb-2 leading-relaxed">{description}</p>}

      {isLoading ? (
        <div className="flex justify-center items-center h-40"><Spin /></div>
      ) : isError ? (
        <p className="text-red-500">加载失败</p>
      ) : (
        <Input.TextArea
          placeholder={bodyPlaceholder}
          value={text}
          onChange={e => setText(e.target.value)}
          autoSize={false}
          style={{ height: '100%', flex: 1, minHeight: 0 }}
          className="flex-1 resize-none rounded-md border border-gray-300"
        />
      )}
    </Card>
  )
} 