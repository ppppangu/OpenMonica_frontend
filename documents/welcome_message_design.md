# Welcome Message Design

## 目标
在聊天页面为空时展示欢迎提示，引导用户开始对话。

## 展示时机
1. 用户首次进入 ChatPage，当前会话消息列表为空。
2. 用户点击"新建对话"按钮，创建新的聊天会话后，消息列表被清空。

## 设计思路
- 使用现有 Zustand `chatStore` 的 `currentMessages` 数组长度来判断是否需要显示欢迎页。
- 在 `ChatMessageList` 组件中已经有"空状态"判定逻辑，因此直接在该组件替换现有 `Empty` 占位。
- 欢迎页包含：
  - 项目 LOGO（`/icons/logo.svg`）。
  - 文案 "您的智能代理"。
- Tailwind CSS 布局：
  - 父容器 `flex items-center justify-center h-full`，子容器 `flex flex-col items-center select-none text-center`。

## 实现步骤
1. 创建/更新设计文档与核对清单。✅
2. 修改 `ChatMessageList.tsx`：
   - 删除 `Empty` 组件引用。
   - 在列表为空时返回自定义欢迎页。
3. 手动验证：
   - 初次加载 ChatPage 时显示欢迎页。
   - 点击"新建对话"后再次显示欢迎页。
4. （可选）编写 E2E 测试覆盖空页面渲染。

## 兼容性注意
- 图片路径使用 Vite `public` 目录能力，直接 `src="/icons/logo.svg"` 即可，无需额外打包配置。
- 文字颜色与大小使用 Tailwind，保持与现有 UI 语言一致。 