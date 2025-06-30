import React from 'react'
import { Button } from 'antd'
import { FileTextOutlined, ShareAltOutlined } from '@ant-design/icons'

interface QuickNavProps {
  onGoDetail: () => void
  onGoGraph: () => void
}

const QuickNav: React.FC<QuickNavProps> = ({ onGoDetail, onGoGraph }) => {
  return (
    <div className="flex flex-wrap gap-4">
      <Button
        type="primary"
        icon={<FileTextOutlined />}
        onClick={onGoDetail}
        size="large"
      >
        文档管理
      </Button>
      <Button
        type="default"
        icon={<ShareAltOutlined />}
        onClick={onGoGraph}
        size="large"
      >
        知识图谱
      </Button>
    </div>
  )
}

export default QuickNav 