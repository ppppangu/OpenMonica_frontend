## Chat Interface Improvements Design

本设计文档针对以下四个需求提出实现方案：

1. **图片与文件在聊天消息中的展示**
2. **UI 颜色方案改进**
3. **聊天布局与滚动问题修复**
4. **URL 自动渲染 iframe 预览**

---
### 1. 图片与文件展示

#### 数据结构
- 修改 `ChatMessage` 类型：`content` 字段从 `string` 扩展为 `string | any[]`。
- 当用户发送包含附件的消息且模型支持多模态时，`content` 存储 OpenAI 多模态数组：
  ```ts
  [{ type: 'text', text: '描述' }, { type: 'image_url', image_url: { url: '...' } }]
  ```

#### 渲染方案
- 在 `ChatMessage` 组件中：
  1. 若 `message.content` 为数组，则拆分出 `text` 片段与 `image_url` 片段。
  2. 文本片段继续走原有 `markdown-it` → `parseStreamingContent` 流程。
  3. 图片片段渲染为**可点击放大**的缩略图，布局放在文本下方，支持多张。
  4. 非图片文件：渲染为带图标的下载链接。

### 2. UI 颜色方案

| 元素       | 旧颜色                | 新颜色        |
| ---------- | --------------------- | ------------- |
| 代码块背景 | `bg-gray-900`         | `bg-gray-100` |
| 用户气泡   | `bg-primary-600 (绿)` | `bg-blue-600` |
| 用户头像   | 同上                  | `bg-blue-600` |

> 通过 Tailwind class 与 CSS 变量覆盖实现，无需改动 Ant Design 主题。

### 3. 布局与滚动

- 让 `ChatInput` 容器使用 `sticky bottom-0` 保持吸底。
- `ChatMessageList` 保持 `overflow-y-auto` 并新增 `overflow-x-hidden` 防止横向滚动。
- `.markdown-content` 与 `.chat-bubble` 添加 `break-words` 避免长行撑宽。

### 4. URL iframe 预览

- 已在 `streamingUtils.markdownToHtml` 中实现 `<url>` → `<iframe>` 的转换。
- 新增失败回退：iframe `onerror` 时隐藏 iframe，改用普通超链接展示。（通过在组件中监听 `onError`）

---
### 依赖与兼容性
- 仅使用现有 `TailwindCSS`、`React` 与 `Ant Design`，无新增第三方库。

---
### 风险点 & 缓解
1. **跨域 iframe 加载失败** → 提供回退链接。
2. **历史消息缺少附件信息** → 后端兼容性验证并保持向后兼容（若 `content` 为字符串则按旧逻辑渲染）。

---
### 里程碑
1. 更新数据结构和 store
2. 完成 ChatMessage 渲染逻辑
3. 调整颜色与样式
4. 调整布局
5. 自测 & 更新 checklist 