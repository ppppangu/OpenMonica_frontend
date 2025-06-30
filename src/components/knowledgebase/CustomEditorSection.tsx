import React, { useEffect, useMemo, useState } from 'react'
import { Card, Input, Spin, Alert } from 'antd'
import debounce from 'lodash-es/debounce'
import { useCustomData, useUpdateCustomDataMutation } from '../../hooks/useApi'
import { useAuthStore } from '../../stores/authStore'

const { TextArea } = Input

interface CustomEditorSectionProps {
  /** 区块标题（如"自定义提示"） */
  titleLabel: string
  /** 后端 target 参数 */
  target: 'custom_personality' | 'custom_memory'
  /** 标题输入框占位符 */
  titlePlaceholder?: string
  /** 正文输入框占位符 */
  bodyPlaceholder?: string
}

const CustomEditorSection: React.FC<CustomEditorSectionProps> = ({ titleLabel, target, bodyPlaceholder = '请输入内容...' }) => {
  const { user } = useAuthStore()
  const userId = user?.id || ''

  /** 查询远端数据 */
  const { data, isLoading, error } = useCustomData(userId, target)
  const updateMutation = useUpdateCustomDataMutation()

  /** 本地状态 */
  const [body, setBody] = useState('')

  // ----------------------
  // 初始化：解析远端数据
  // ----------------------
  useEffect(() => {
    if (typeof data === 'string') {
      setBody(data)
    }
  }, [data])

  // ----------------------
  // 防抖保存
  // ----------------------
  const debouncedSave = useMemo(() => debounce((bod: string) => {
    if (!userId) return
    updateMutation.mutate({ user_id: userId, target, new_text: bod })
  }, 1000), [userId, target])

  useEffect(() => {
    debouncedSave(body)
    return () => { debouncedSave.cancel() }
  }, [body, debouncedSave])

  // ----------------------
  // 渲染逻辑
  // ----------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin tip="加载中..." />
      </div>
    )
  }

  if (error) {
    return <Alert type="error" message="数据加载失败" showIcon />
  }

  return (
    <Card title={titleLabel} className="h-full">
      <TextArea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={14}
        placeholder={bodyPlaceholder}
      />
    </Card>
  )
}

export default CustomEditorSection 