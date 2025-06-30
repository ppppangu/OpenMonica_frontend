import React from 'react'
import { Row, Col } from 'antd'
import CustomEditorSection from '../components/knowledgebase/CustomEditorSection'

const CustomPage: React.FC = () => {
  return (
    <div className="w-full">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <CustomEditorSection titleLabel="自定义提示" target="custom_personality" bodyPlaceholder="输入自定义提示词内容" />
        </Col>
        <Col xs={24} md={12}>
          <CustomEditorSection titleLabel="模型记忆" target="custom_memory" bodyPlaceholder="输入模型专属记忆内容" />
        </Col>
      </Row>
    </div>
  )
}

export default CustomPage 