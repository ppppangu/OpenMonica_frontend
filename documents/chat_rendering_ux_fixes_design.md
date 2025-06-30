# Chat Page Rendering & UX Fixes Design Document

> 文件位置：`documents/chat_rendering_ux_fixes_design.md`

## 目标

统一解决 Chat 页面中与消息渲染和交互体验相关的 5 个问题，并顺带美化侧边栏：

1. Markdown 图片 `![alt](url)` 无法正常内联显示
2. 空 `<div class="thinking-content"></div>` 依旧占位
3. ```mermaid``` 代码块未被渲染为图表
4. 聊天流式输出时滚动条行为生硬，需智能自动滚动
5. Markdown 表格超出气泡宽度导致横向溢出
6. 侧边栏配色与交互体验升级为 OpenAI 风格

## 方案概览

| #   | 问题          | 方案概要                                                                                                                                         |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Markdown 图片 | 在 `markdownToHtml` 流程中保留 `<img>`，并为 `.markdown-content img` 添加 `max-w-full h-auto` 以保证自适应；同时确保 Tailwind `break-words` 生效 |
| 2   | 空思考块      | 在 `renderSegmentsToHtml` 中跳过 `content.trim() === ''` 的 `thinking-content`；并补充 CSS `:empty{display:none}` 保险                           |
| 3   | Mermaid       | 生成 `<div class="mermaid">${code}</div>` 时不再 `escape`，保留原始代码；`ChatMessage` 中已做 `mermaid.init`，保持不变                           |
| 4   | 智能滚动      | 在 `ChatMessageList` 中：                                                                                                                        |
  - 监听滚动事件，计算 `isAtBottom`
  - 用户向上滚动则暂停自动滚动；当再次到达底部自动恢复
  - `useEffect` 在新消息或流式更新时仅在 `shouldAutoScroll` 为 `true` 时滚动到底部 |
| 5 | 表格溢出 | 在 `index.css` 中 `.markdown-content table { @apply block overflow-x-auto; }` 并让内部 `thead, tbody` `min-w-full` |
| 6 | 侧边栏美化 | 使用淡紫背景 + Hover 高亮：
  - `.ant-layout-sider` 改渐变 / 固定颜色
  - `.ant-menu-item-selected` 使用品牌紫 `bg-purple-100 text-purple-700`
  - 为折叠按钮与 Logo 调整阴影 & 圆角 |

## 受影响文件

* `src/utils/streamingUtils.ts`
* `src/components/chat/ChatMessageList.tsx`
* `src/index.css`
* `src/components/layout/MainLayout.tsx`（纯样式类名追加，不改逻辑）

## 风险与回滚

1. **Mermaid XSS**：保持 `markdown-it` 默认 `html: true` 可能引入风险，但项目已面向受控用户；若需严格安全，可在服务器端做绿名单过滤。
2. **滚动条监听性能**：仅在 ChatMessageList 单一容器内监听，且滚动事件节流（浏览器默认 60fps 不会有瓶颈）。
3. **样式覆盖冲突**：所有新增样式均放入组件 Layer，优先级高于 Typography 插件默认样式，且类名隔离。

## 验收标准

- 在 Chat 页面发送包含 **图片**/ **Mermaid** / **表格** 的消息均能正确渲染，无控制台报错
- 用户手动滚动至历史消息时，流式输出不会扰动视图；回到底部后自动滚动恢复
- 表格宽度超出容器时出现横向滚动条，不出现横向页面滚动
- 侧边栏在展开/折叠/选中/悬停状态下符合新配色规范 