# Chat Interface Style Update – Design Document

## 目标
本次迭代聚焦于 Chat 页面 UI 细节优化，改善整体观感与可用性，具体包含三点：

1. **聊天区域背景**：将聊天消息列表背景从灰色改为纯白色，带来更干净的视觉效果。
2. **气泡样式**：
   - 去除 AI 回复气泡的灰色边框，仅保留白底。
   - 将用户气泡背景色改为 `rgb(244, 244, 244)`（#F4F4F4），与纯白背景区分。
3. **输入区域容器**：
   - 让容器宽度随内部内容自适应（最大 4xl），而非占满整个可视宽度。
   - 移除容器自身的灰色顶边框，但保留输入框(TextArea) 的灰色边框。

## 方案
1. **背景色调整**
   - 在 `ChatMessageList.tsx` 已存在 `bg-white`，无需改动；如日后发现灰色来源，可在最外层容器统一设置 `bg-white`。

2. **气泡样式**
   - 修改 `src/index.css` 内的 `@layer components`：
     - `.chat-bubble-user` 去除 `bg-gray-200`，改为自定义 `background-color: rgb(244 244 244)`。
     - `.chat-bubble-assistant` 移除 `border border-gray-200`，仅保留 `bg-white`。

3. **输入区域容器**
   - 调整 `ChatInput.tsx` 顶部固定容器：
     - 删除 `border-t-2 border-gray-200`。
     - 移除固定 `width: calc(100% - siderWidth)`，改为 `width: auto` 并增加 `max-w-4xl mx-auto`，保持对齐侧边栏（left = siderWidth）。

## 兼容性与风险
- Tailwind `@apply` 不支持自定义颜色值，需直接写入 `background-color`。
- 固定容器宽度由 `auto` 调整可能在极窄窗口产生横向滚动；增加 `max-w-full` 可快速兜底，如后续发现问题再迭代。

## 回滚方案
- 仅涉及样式文件与 `ChatInput`/`index.css` 的小范围修改，可通过 Git revert 轻松回滚。

## 本轮新增需求概览

本轮用户提出了 4 大类改进需求：

1. **整体背景色**：确保 Chat 页面主内容（`Content` 以及内部 `flex-1 flex flex-col min-h-0` 容器）背景保持纯白。
2. **输入栏视觉一致性**：
   - 输入栏水平居中，对齐聊天气泡最大宽度（`max-w-4xl`）。
   - 解决上传/语音/发送按钮与输入框高度不一致的问题。
3. **个性化页面 Tooltip**：在 `个性化助手设置`、`模型记忆` 标题右侧加入问号图标，悬浮展示说明文字。
4. **文本域高度与滚动**：两个编辑区文本域默认撑满卡片高度，内容超出时出现滚动条。

## 详细设计

### 1. Content 背景改为白色
- **方案 A（首选）**：在 `MainLayout.tsx` 中给 `Content` 组件附加 `bg-white` 类。
- **方案 B**：在 `index.css` 全局加入 `.ant-layout-content{background:#fff}`（备用）。

理由：直接修改组件 class 可避免全局样式污染。

### 2. ChatInput 调整
1. **结构拆分**
   ```jsx
   <div className="fixed bottom-0 left-0 right-0" style={{ left: siderWidth }}>
     <div className="max-w-4xl mx-auto bg-white ...">...</div>
   </div>
   ```
   - 外层 div 负责定位与宽度（`left: siderWidth; right:0`），让内部容器可借助 `mx-auto` 居中。
   - 内层 div 才是视觉盒子，保持 `max-w-4xl`、圆角与阴影。
2. **统一按钮高度**
   - 给三类按钮（上传/语音/发送）显式 `size="middle"` 并通过 Tailwind `!h-10 w-10` 强制高度。
   - TextArea 使用 `autoSize={{minRows:1,maxRows:4}}` 同时增加 `leading-[40px]` 使单行高度与按钮匹配。

### 3. Tooltip 实现
- 修改 `CustomEditorSection`：
  - 将 `titleLabel` 类型由 `string` ➜ `ReactNode`，允许运入自定义节点。
- 在 `CustomPage.tsx` 中定义：
  ```jsx
  const personalityHeader = (
    <span className="flex items-center gap-1">
      个性化助手设置
      <Tooltip title="...整段文案...">
        <QuestionCircleOutlined className="text-gray-400" />
      </Tooltip>
    </span>
  )
  ```

### 4. 文本域高度与滚动
- `CustomEditorSection` 现已 `flex-1`，只需给 `Input.TextArea` 加 `overflow-auto`；并确保 `Card` 本身 `display:flex; flex-direction:column; flex:1`。

## 兼容性与风险
- **AntD Card** body 默认 `display:block`；但我们已在 `Card` 顶层加 flex，因此安全。
- `fixed` 输入栏拆分后需注意 iOS 软键盘遮挡问题，后续观察。

## 回滚方案
- 所有改动均限于局部组件与样式，可通过 `git revert` 单独回滚。 