import React from 'react'
import CustomEditorSection from './CustomEditorSection'

/**
 * 自定义区块（提示词 & 模型记忆）
 * - 左侧：自定义提示词管理
 * - 右侧：模型记忆管理
 */
const CustomSection: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      {/* 左侧：自定义提示词 */}
      <div className="flex-1">
        <CustomEditorSection
          titleLabel="自定义提示"
          target="custom_personality"
          titlePlaceholder="输入提示词标题"
          bodyPlaceholder="输入自定义提示词内容"
        />
      </div>

      {/* 右侧：模型记忆 */}
      <div className="flex-1">
        <CustomEditorSection
          titleLabel="模型记忆"
          target="custom_memory"
          titlePlaceholder="输入记忆标题"
          bodyPlaceholder="输入模型专属记忆内容"
        />
      </div>
    </div>
  )
}

export default CustomSection 