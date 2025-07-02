# Chat UI / UX 改进设计文档

## 目标
根据最新需求，对聊天界面进行以下改进：

1. 侧边栏
   - 去掉 "AI助手" 文本，仅保留 Logo
   - 折叠时只展示 Logo，隐藏菜单及底部用户信息
   - 折叠状态下点击 Logo 可重新展开
2. Chat 页面
   - 删除页面内部 Header（"当前会话: [id] 设置"）
   - 聊天主标题改为 "AgentNexus"（依赖 `MainLayout` 的动态标题渲染）
3. 会话逻辑
   - 首次进入 Chat 页面时，在前端静默生成一个新的 `session_id` 以承载后续会话
   - 新建对话按钮只创建本地会话，占位直到用户第一次发送消息再向后端落库
4. UX 细节
   - 折叠状态保留 80px 宽度，以容纳 Logo
   - 展开/折叠按钮仅在展开状态下可见

## 技术方案
1. **`src/components/layout/MainLayout.tsx`**
   - 更新 `MENU_CONFIG`：`智能对话` -> `AgentNexus`
   - 调整顶部 Logo 区域：删除文本，增加点击逻辑
   - 折叠时隐藏 `<Menu/>` 与底部用户信息
   - 展开/折叠按钮仅在展开时渲染
2. **`src/pages/ChatPage.tsx`**
   - 移除内部 Header 与 `SettingOutlined` 相关引用
   - `useEffect` 初始化时若无 `currentSessionId` 则调用 `createNewSession()`
3. **`chatStore`**
   - 现有 `createNewSession` 已满足需求，无需改动

## 兼容性/风险
- 侧边栏收缩后 `Content` 区域的 `margin-left` 已按 80px 计算，保证布局不变
- 由于移除了内部 Header，与设置相关的入口仍可通过侧边栏 "设置" 菜单访问，因此功能不受影响
- 所有改动均限定于前端，后端 API 无需变更

## 完成标准
- 运行 `npm run dev`，UI 效果符合需求
- 折叠侧边栏后仅显示 Logo，点击 Logo 可展开
- Chat 页面顶部仅显示 `AgentNexus`，无 "当前会话"/"设置" 字样
- 首次进入 Chat 页面即可输入消息，且会话列表中不会立即出现新会话记录，发送第一条消息后才能看到 