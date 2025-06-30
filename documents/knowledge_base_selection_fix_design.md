# 知识库列表点击无效问题修复设计

## 1. 问题描述
在知识库 V2 界面中，点击侧边栏的知识库条目时，主内容区域不刷新且浏览器未向后端发送 `target=detail` 的请求，导致无法查看知识库详情与文档列表。

## 2. 根因分析
1. `KBListPanel` 将 `onClick` 事件直接绑定到 `List.Item`，但在某些浏览器/AntD 版本组合下，`List.Item` 并不会把自定义的 `onClick` 透传到最外层 DOM，导致点击事件失效。
2. 点击事件中使用的 `userId` 取自组件渲染时的闭包，当用户登录状态异步更新后可能仍为空字符串，后续即使事件生效也会因为缺失 `user_id` 被后端拒绝。
3. `fetchKnowledgeBaseDetail` 仅假设后端以数组形式返回数据，当后端升级为直接返回对象时 `currentKB` 会被设置为 `undefined`，界面依旧空白。

## 3. 解决方案
1. **事件可靠性增强**：
   - 新增辅助函数 `handleSelect`，在函数内部实时读取 `useAuthStore` 中的最新 `userId`。
   - 用 `List.Item` 包含 `<div onClick>` 或直接保证点击事件在 DOM 上生效。
2. **UserId 护栏**：
   - 如未登录直接弹出 `message.warning`，避免发送不合法请求。
3. **API 兼容性**：
   - `fetchKnowledgeBaseDetail` 增加对对象/数组两种返回结构的兼容，防止 `currentKB` 为空。
4. **辅助改进**：
   - `KBDetailHeader` 在 `document_count` 缺失时退化为 `documents.length`。

## 4. 影响范围
- `src/components/knowledgebase_v2/KBListPanel.tsx`
- `src/utils/knowledgeBaseApi.ts`
- `src/components/knowledgebase_v2/KBDetailHeader.tsx`

## 5. 验证步骤
1. 登录系统并进入「知识库」页面。
2. 观察：侧边栏成功加载知识库列表。
3. 点击任一知识库条目，浏览器应立即发送 `POST /user/knowledgebase`（`target=detail`）。
4. 主内容区展示：
   - 知识库基本信息卡片
   - 文档列表 Tab 正常渲染
5. 多次切换不同知识库，主内容区应随之更新。

## 6. 回归测试
- ✔️ 侧边栏搜索、创建、删除功能仍可用
- ✔️ 文档上传、删除功能未受影响
- ✔️ 知识图谱 Tab 可以正常加载并刷新 