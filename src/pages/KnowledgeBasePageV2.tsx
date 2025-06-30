import { useEffect } from 'react'
import { useKnowledgeBaseStoreV2 } from '../stores/knowledgeBaseStoreV2'
import { useAuthStore } from '../stores/authStore'
import { KBListPanel } from '../components/knowledgebase_v2/KBListPanel'
import { Spin, Empty } from 'antd'
import { KBDetail } from '../components/knowledgebase_v2/KBDetail'

export default function KnowledgeBasePageV2() {
  const userId = useAuthStore(state => state.user?.id)
  const { list, fetchList, loading, currentKB } = useKnowledgeBaseStoreV2()

  useEffect(() => {
    if (userId) {
      fetchList(userId)
    }
  }, [userId])

  if (!userId) {
    return <Empty description="请先登录" />
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <KBListPanel className="w-60 border-r border-gray-200" />

      {/* Main */}
      <div className="flex-1 p-4 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spin size="large" />
          </div>
        ) : currentKB ? (
          <KBDetail />
        ) : (
          <Empty description="请选择或创建知识库" />
        )}
      </div>
    </div>
  )
} 