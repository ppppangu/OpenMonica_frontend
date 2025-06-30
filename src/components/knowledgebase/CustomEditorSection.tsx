import React, { useEffect, useMemo, useState } from 'react'
import { Card, Input, Spin, Alert, Button } from 'antd'
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
  /**
   * 用于记录首次渲染阶段，防止初始化时发送空字符串 update 请求。
   * 当组件第一次挂载并完成数据拉取后才开始监听用户输入。
   */
  const isFirstRenderRef = React.useRef(true)
  /**
   * 记录最近一次已保存到后端的文本，避免重复提交同样内容。
   */
  const lastSavedBodyRef = React.useRef('')

  // ----------------------
  // 初始化：解析远端数据
  // ----------------------
  useEffect(() => {
    if (typeof data === 'string') {
      setBody(data)
      // 将远端初始值记录为已保存状态，避免立刻触发更新
      lastSavedBodyRef.current = data
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
    // 组件首次渲染阶段不触发保存逻辑，待远端数据加载完成后再开启
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      // 同步远端初始值到最近一次保存引用
      lastSavedBodyRef.current = body
      return
    }

    // 只有当内容真正发生变化时才触发保存
    if (body !== lastSavedBodyRef.current) {
      debouncedSave(body)
      lastSavedBodyRef.current = body
    }

    return () => {
      debouncedSave.cancel()
    }
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

  // 计算是否有未保存的修改
  const hasUnsavedChanges = body !== lastSavedBodyRef.current

  return (
    <Card
      title={titleLabel}
      className="h-full flex flex-col"
      extra={
        <Button
          type="primary"
          size="small"
          loading={updateMutation.isLoading}
          disabled={!hasUnsavedChanges}
          onClick={() => {
            if (!userId) return
            updateMutation.mutate({ user_id: userId, target, new_text: body })
            lastSavedBodyRef.current = body
          }}
        >
          保存
        </Button>
      }
    >
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