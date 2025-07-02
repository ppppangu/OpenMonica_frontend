# Chat 输入栏底部固定 & ChatGPT 风格重设 设计文档

## 背景

旧版输入栏采用 `position: sticky`，在大量聊天内容滚动时偶尔会移出视口。此外，外观较为朴素，与 ChatGPT 的圆角卡片视觉不一致。

## 目标

1. **固定**：输入栏始终固定在视口底部，滚动时不离开屏幕。
2. **美化**：应用圆角、浅阴影，与 ChatGPT 一致的卡片式设计。
3. **响应式**：在移动 / 桌面端均保持良好排版。
4. **不遮挡内容**：聊天列表底部应预留足够空间，避免被输入栏覆盖。

## 技术方案

### 1. 布局

* 将 `ChatInput` 根节点修改为 `fixed bottom-0 left-0 w-full`。
* 设置 `z-10`，防止被其他元素覆盖。
* 使用 `shadow-[0_-2px_8px_rgba(0,0,0,0.05)]` + `border-t` 增强层次感。

### 2. 圆角 & 边框

* `TextArea` 添加 `rounded-xl border border-gray-300 shadow-sm`。
* 通过 `!px-3 !py-2` 覆盖 Ant Design 默认 padding。

### 3. 适配内容高度

* `ChatMessageList` 追加 `pb-40`（≈160px）底部内边距，留出输入栏高度。

## 兼容性 & 性能

* 仅 CSS 变动，无额外 JS 执行，对性能影响忽略不计。
* 所有样式使用 Tailwind 原子类，自动适配暗色/亮色主题。

## 待办事项

无 