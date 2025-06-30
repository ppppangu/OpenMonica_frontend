import React from 'react'
import { Radio } from 'antd'

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
 * 知识来源单选按钮组（Radio.Group）。
 */
const KnowledgeSourceSelect: React.FC<KnowledgeSourceSelectProps> = ({ value = 'smart', onChange, disabled }) => {
  return (
    <Radio.Group
      options={OPTIONS}
      optionType="button"
      buttonStyle="solid"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className="knowledge-source-radio compact"
    />
  )
}

export default KnowledgeSourceSelect 