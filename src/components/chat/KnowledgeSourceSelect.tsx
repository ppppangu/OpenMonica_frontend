import React from 'react'
import { Select } from 'antd'

const OPTIONS = [
  { label: '智能模式', value: 'smart' },
  { label: '纯知识库', value: 'kb' },
  { label: '纯联网搜索', value: 'web' }
]

interface KnowledgeSourceSelectProps {
  value?: string
  onChange?: (val: string) => void
  disabled?: boolean
}

/**
 * 知识来源选择下拉（Select）。
 */
const KnowledgeSourceSelect: React.FC<KnowledgeSourceSelectProps> = ({ value = 'smart', onChange, disabled }) => {
  return (
    <Select
      value={value}
      onChange={(val) => onChange?.(val)}
      disabled={disabled}
      style={{ width: 140 }}
      options={OPTIONS}
      placement="topLeft"
    />
  )
}

export default KnowledgeSourceSelect 