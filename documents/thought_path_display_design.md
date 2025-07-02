# Agent 思维路径展示功能设计

## 1. 需求
在聊天界面中，当模型通过 deepresearch 工具进行推理并返回 `thought` 字段时，用户可以查看模型的完整思考过程。

- 每条助手消息(assistant 气泡)独立维护自己的思维路径
- 默认仅显示一枚可点击的圆角按钮，文字为 "agent思维路径"
- 点击按钮后，从页面右侧滑出宽 400px 的思维路径面板，再次点击按钮或面板中的关闭按钮可收起
- 思维路径按时间顺序、Markdown 列表形式(`- `) 渲染
- 仅 deepresearch 工具调用时出现；普通对话隐藏该功能

## 2. 触发条件
1. 解析助手消息内容中的 ```json code block```，定位 `"tool": "deepresearch"` 的 **toolDone** 片段
2. 读取 `tool_response`，尝试 `JSON.parse` 提取 `thought` 字段，若存在则视为可展示

## 3. 数据流
1. ChatMessage 解析 `segments` 后，过滤出包含 `thought` 的记录 → `thoughtList: string[]`
2. 若 `thoughtList.length > 0`，渲染圆角按钮 + `ThoughtPanel`
3. `ThoughtPanel` 使用 `MarkdownIt` 将 `thoughtList.map(t => '- ' + t).join('\n')` 渲染为 HTML
4. 面板采用绝对定位 + `transition-transform` 实现平滑滑入/滑出

## 4. 组件/状态设计
- **ChatMessage.tsx**
  - 新增本地状态 `showThought` (boolean)
  - 新增 `extractThoughts(segments): string[]` 方法
  - 条件渲染 `<ThoughtPathButton />` 与 `<ThoughtPanel />`
- **ThoughtPanel.tsx** (新建)
  - Props: `thoughts: string[]`, `onClose: () => void`
  - 内部使用 `useEffect` 监听 `Escape` 键关闭
- 状态隔离：按钮 & 面板均置于 ChatMessage 内部，互不影响

## 5. UI / 样式
- **按钮**
  - 类名：`rounded-2xl bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200 cursor-pointer transition`
- **面板**
  - 宽度 `w-[400px]`，固定在 `top-0 right-0 h-full shadow-lg bg-white z-50`
  - 隐藏态：`translate-x-full`，展示态：`translate-x-0`
  - 内部结构：标题栏(含关闭 Icon) + `overflow-y-auto` 内容区

## 6. 代码影响范围
| 文件                                 | 变更 | 说明                                     |
| ------------------------------------ | ---- | ---------------------------------------- |
| src/components/chat/ChatMessage.tsx  | M    | 解析 thoughts、按钮 & 面板渲染、状态管理 |
| src/components/chat/ThoughtPanel.tsx | A    | 新建面板组件                             |
| src/index.css                        | M    | 通用过渡/面板样式辅助                    |

## 7. 验证
1. 使用模拟数据触发 deepresearch 返回，确认按钮出现
2. 点击按钮 → 面板滑出并渲染 markdown
3. 再次点击按钮或关闭 icon → 面板收起
4. 同一页面多条消息互不干扰
5. 不触发 deepresearch 时不出现按钮

## 8. 回退方案
若出现重大 UI 问题，可在 ChatMessage 中直接短路 `thoughtList.length === 0` 逻辑，临时隐藏按钮与面板。

---
负责人：AI
日期：{{DATE}} 