import React from 'react'
import { Row, Col, Card, Tooltip, message } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import CustomEditorSection from '../components/custom/CustomEditorSection'

const CustomPage: React.FC = () => {
  /**
   * 点击 TODO 区域的占位时弹出提示
   */
  const handleTodoPlaceholderClick = () => {
    message.info('敬请期待')
  }

  // Header node for TODO column with tooltip
  const todoHeader = (
    <span className="flex items-center gap-1">
      每日TODO
      <Tooltip title={`智能代理"会在这里记忆要做什么，当符合条件时会自动执行相关动作，beta版最多10条。`}>
        <QuestionCircleOutlined className="text-gray-400" />
      </Tooltip>
    </span>
  )

  // Header with tooltip: 个性化助手设置
  const personalityHeader = (
    <span className="flex items-center gap-1">
      个性化助手设置
      <Tooltip
        title={
          <span className="whitespace-pre-line">
            {`您可以告诉您的智能代理做以下事情...\n使用正式、专业的语气。\n随意、健谈。\n要有主见。如果一个问题可能有多个答案尽量只给出最好的答案。\n称呼您为 任何 称呼。`}
          </span>
        }
      >
        <QuestionCircleOutlined className="text-gray-400" />
      </Tooltip>
    </span>
  )

  const memoryHeader = (
    <span className="flex items-center gap-1">
      模型记忆
      <Tooltip
        title={
          <span className="whitespace-pre-line">
            {`您可以分享以下内容...\n喜欢徒步旅行和爵士乐。\n喜欢吃素。\n正在努力学习法语。`}
          </span>
        }
      >
        <QuestionCircleOutlined className="text-gray-400" />
      </Tooltip>
    </span>
  )

  return (
    <div className="w-full h-full flex flex-col">
      <Row gutter={[24, 24]} className="flex-1" style={{ height: '100%' }}>
        {/* 个性化助手设置 */}
        <Col xs={24} md={8} style={{ display: 'flex' }}>
          <CustomEditorSection
            titleLabel={personalityHeader}
            target="custom_personality"
            bodyPlaceholder="输入自定义提示词内容"
            description={
              <>
                您智能代理的"行为指南"设置。您可以定义助手的回答风格、专业领域和互动方式，让AI按照您的期望回答与工作。<br />
                {/* 占位符行，保证段落高度一致 */}
                <span className="invisible">占位符行 1</span><br />
                <span className="invisible">占位符行 2</span>
              </>
            }
          />
        </Col>

        {/* 模型记忆 */}
        <Col xs={24} md={8} style={{ display: 'flex' }}>
          <CustomEditorSection
            titleLabel={memoryHeader}
            target="custom_memory"
            bodyPlaceholder="输入模型专属记忆内容"
            description={`AI助手会在与您交流过程中自动学习您的偏好和需求，形成"记忆"。在这里，您可以查看这些记忆内容，删除不需要的信息，或添加您希望AI记住的重要细节，确保助手始终以您期望的方式为您服务。`}
          />
        </Col>

        {/* 每日TODO Column */}
        <Col xs={24} md={8} style={{ display: 'flex' }}>
          <Card title={todoHeader} bordered={false} onClick={handleTodoPlaceholderClick} className="cursor-pointer select-none flex-1">
            {/* 空内容区域 - 点击时弹提示 */}
            <div className="h-40 flex flex-col justify-center items-center text-gray-400">
              <p className="mb-2">暂无任务</p>
              {/* 预留 TODO 条目的示例结构：
              <div className="flex items-center justify-between w-full py-1">
                <Checkbox />
                <span className="flex-1 mx-2 truncate">任务名称示例</span>
                <BookOutlined className="text-primary-600" />
              </div>
              */}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CustomPage 