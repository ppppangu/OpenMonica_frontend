import React from 'react'

/**
 * 我的组织 页面
 * 显示组织相关占位信息，后续会接入智能中心代理等功能。
 */
const OrganizationPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full text-center px-4">
      <p className="text-gray-700">
        您的智能代理与所在组织内部的中心智能代理交互，获取多个组织最新通知与企业内部知识库；敬请期待
      </p>
    </div>
  )
}

export default OrganizationPage 