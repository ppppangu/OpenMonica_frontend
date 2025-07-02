import React from 'react'

export interface SidebarContextValue {
  /** 当前侧边栏宽度，单位 px */
  siderWidth: number
}

/**
 * 提供侧边栏宽度信息，以便子组件（如 ChatInput）可根据展开/折叠状态动态调整布局。
 */
export const SidebarContext = React.createContext<SidebarContextValue>({
  siderWidth: 260
}) 