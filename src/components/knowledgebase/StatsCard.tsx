import React from 'react'
import { Card, Statistic } from 'antd'
import { DatabaseOutlined, FileTextOutlined, HddOutlined } from '@ant-design/icons'

interface StatsCardProps {
  totalKnowledgeBases: number
  totalDocuments: number
  totalStorageUsage: number // MB
}

const StatsCard: React.FC<StatsCardProps> = ({
  totalKnowledgeBases,
  totalDocuments,
  totalStorageUsage
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <Statistic
          title="知识库总数"
          value={totalKnowledgeBases}
          prefix={<DatabaseOutlined />}
        />
      </Card>
      <Card>
        <Statistic
          title="文档总数"
          value={totalDocuments}
          prefix={<FileTextOutlined />}
        />
      </Card>
      <Card>
        <Statistic
          title="存储占用 (MB)"
          value={totalStorageUsage.toFixed(1)}
          prefix={<HddOutlined />}
        />
      </Card>
    </div>
  )
}

export default StatsCard 