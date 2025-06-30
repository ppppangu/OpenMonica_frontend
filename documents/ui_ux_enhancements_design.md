# UI/UX 综合设计文档

> 版本: v1.0 （初稿）
> 创建日期: {{DATE}}

## 背景

现有前端界面在视觉一致性、响应性以及交互细节方面与 OpenAI ChatGPT 的设计语言仍有差距，同时部分功能（如功能按钮逻辑、模型多选等）需要进一步完善。本文档结合产品需求，对以下 6 个子任务进行统一设计说明：

1. 登录/注册页面重构（Login/Registration Page Redesign）
2. 聊天功能按钮样式（Chat Page Function Button Styling）
3. 聊天页面布局响应性修复（Chat Layout Responsiveness Fix）
4. 功能按钮逻辑增强（Function Button Logic Enhancement）
5. 模型选择增强（Model Selection Enhancement）
6. 应用图标实现（Application Icon Implementation）

---

## 通用设计原则

1. **极简主义（Minimalism）**：以白色为基调，使用中性色系（#F2F3F5 ~ #D9DDE3）做分隔；强调留白与信息分组。
2. **细微动效（Micro-interaction）**：统一使用 `transition-all duration-200` 与 `hover:opacity-90`，保证轻量的反馈。
3. **可访问性（A11y）**：颜色对比度符合 WCAG AA（对文本至少 4.5:1），所有可点击元素有 `aria-label` 或 `title`。
4. **移动优先（Mobile First）**：先保证 360 px 宽度下的可用性，再扩展到桌面。
5. **组件化（Atomic Components）**：复用 `Button`, `Card`, `Dropdown` 等基础组件，使用 Tailwind + Antd 按需结合。

---

## 1. 登录/注册页面重构

### 目标

- 白底、无多余装饰，模拟 [chat.openai.com/auth/login] 的视觉观感。
- 表单控件采用圆角输入框（`rounded-lg border-gray-300 focus:ring-2 focus:ring-black`）。
- 取消渐变背景与多余的装饰圆。
- 使用 `flex-col justify-center items-center` 居中排版，最大宽度 `max-w-sm`。
- 表单验证错误信息在输入框正下方以红色小字显示。

### 组件

- `AuthCard`: 包装原 `Card`，去除阴影，增加内部留白。
- `AuthInput`: 在 antd `Input` 外层封装 Tailwind 样式。

### 路径

- 修改 `src/pages/AuthPage.tsx`

---

## 2. 聊天功能按钮样式

### 目标

- 使用 `gray-100 → gray-200` 渐变背景，文字 `gray-800`。
- 鼠标悬停：背景 `gray-50` + 边框 `gray-300`。
- 动态渲染：读取 `config.yaml -> prompt_buttons`，`Object.entries()` 无上限渲染；每个按钮 `data-prompt` 属性用于逻辑绑定。

### 路径

- 修改 `src/components/chat/ChatInput.tsx` 按钮区域，抽离为 `PromptButton` 组件。

---

## 3. 聊天页面布局响应性修复

### 目标

- 修复右侧消息列过长导致 `Sider` 被挤出视口的问题。
- 在 `MainLayout` 中为 `Content` 设置 `min-w-0`，并在 `ChatMessageList` 中加入 `break-words` 和 `max-w-full`。
- 对 `ChatMessageList` 的父容器使用 `overflow-x-hidden`，防止水平滚动。

---

## 4. 功能按钮逻辑增强

### 目标

1. 点击按钮 → 将对应提示词 chip 展示到输入框上方（可删除）。
2. 同一按钮再次点击 → 若已选中则取消。
3. 提示词与用户输入分隔使用 `•`，最终拼接发送。

### 数据结构

```ts
interface ActivePrompt {
  key: string   // prompt label
  text: string  // prompt content
}
```

存储于 `ChatInput` 本地 `useState<ActivePrompt[]>`。

### 交互流程

1. **Toggle**
   - 若 `activePrompts` 不含当前按钮 → push;
   - 否则 → filter 删除。
2. **UI**
   - 选中按钮添加 `bg-gray-300` 状态；
   - 在输入框上方渲染 chip：`span.rounded-full.bg-gray-200.px-2.py-0.5`，附带 × 号。
3. **发送时**
   - 将 `activePrompts.map(p=>p.text).join('，') + ' • ' + inputValue` 作为最终内容。

---

## 5. 模型选择增强

### 目标

- 原有 Select 右侧新增 `KnowledgeSourceSelect`（多选，下拉向上 `placement='topLeft'`）。
- 选项：`智能模式`(default)、`知识库`、`联网搜索`。
- 允许单选(排他)或多选？需求为「多选下拉」，但视 UX 建议单选排他，保留多选实现。
- 右侧 `DeepResearch` 按钮，点击触发 `onDeepResearch()` 回调（暂显示 toast）。

### 路径

- 新建 `src/components/chat/KnowledgeSourceSelect.tsx`。
- 在 `ChatInput` 第 3 行加入该组件。

---

## 6. 应用图标实现

### 目标

- 新建 `public/icons` 目录；放置 `favicon.svg`, `favicon.png`, `logo.svg`。
- 在 `index.html` 内 `<link rel="icon" href="/icons/favicon.svg" />`。
- 在 `MainLayout` 里引用 `logo.svg` 代替 🤖 emoji。

---

## 迭代计划

| Sprint | 内容                             | 预计耗时 |
| ------ | -------------------------------- | -------- |
| 1      | 文档 + Checklist + 登录/注册重构 | 4h       |
| 2      | 功能按钮样式 + 逻辑增强          | 6h       |
| 3      | 布局响应性修复                   | 2h       |
| 4      | 模型选择增强                     | 3h       |
| 5      | 应用图标整合 + 收尾测试          | 2h       |

---

## 风险

- **Antd 与 Tailwind 样式冲突**：需要使用 `!` 前缀或自定义 class 隔离。
- **config.yaml CDN 缓存**：可能导致新增按钮不及时更新。
- **移动端兼容性**：下拉向上 placement 在小屏可能溢出，需要自适应。

---

## 结论

以上设计遵循 OpenAI 风格，确保视觉统一与交互易用，为后续功能扩展留出空间。
