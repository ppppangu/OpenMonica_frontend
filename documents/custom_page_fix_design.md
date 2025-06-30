# 自定义页面（CustomPage）功能修复设计文档

> 文件位置：`documents/custom_page_fix_design.md`

## 目标

1. 进入自定义页面时，**立即**向后端请求并展示当前用户的「自定义提示（custom_personality）」和「模型记忆（custom_memory）」内容。
2. 用户编辑任意输入框内容后，**自动保存**至后端，且不产生多余请求；同时提供 **手动保存** 按钮方便立即保存。
3. 防止首次渲染时空内容覆盖后端已有数据。
4. 页面无报错、交互流畅，后端能收到正确的请求体。

## 后端接口

| 功能           | Endpoint                             | Method | 必填字段              | 说明                |
| -------------- | ------------------------------------ | ------ | --------------------- | ------------------- |
| 获取自定义提示 | `/user/settings/get_user_prompt`     | POST   | `user_id`             | 返回 `data: string` |
| 更新自定义提示 | `/user/settings/update_user_prompt`  | POST   | `user_id`, `new_text` |                     |
| 获取模型记忆   | `/user/settings/get_model_memory`    | POST   | `user_id`             | 返回 `data: string` |
| 更新模型记忆   | `/user/settings/update_model_memory` | POST   | `user_id`, `new_text` |                     |

## 前端现状（问题）

- Hooks 直接向 `/user/custom` 请求，前端 dev server 无该路由，导致 404。
- `Card` 采用 `h-full` 高度，造成文本框撑满整页。

### 已完成的优化

- ✅ 路由映射至 `/user/settings/get_*` & `/user/settings/update_*` 真实代理端点。
- ✅ 移除 `Card.h-full` 并改用 `TextArea.autoSize`，高度随内容增长。
- ✅ 防抖保存、手动保存按钮逻辑保持。

## 解决方案

1. **阻断首次空保存**
   - 使用 `isFirstRenderRef` 记录首帧，首次 Effect 直接 `return`。
   - 当远端数据加载完成后，再记录至 `lastSavedBodyRef` 作为基线。
2. **去重 + 自动保存**
   - 比较 `body` 与 `lastSavedBodyRef.current`，只有内容变化时才调用 `debouncedSave`。
   - `debounce` 间隔 1s，防止高频请求。
3. **手动保存按钮**
   - 在 `Card.extra` 中加入 `Button`：当存在未保存改动(`hasUnsavedChanges`)时可点击。
   - 点击后立即调用 `updateMutation` 并更新 `lastSavedBodyRef`。
4. **用户体验**
   - 加载时展示 `Spin`。
   - 保存时 `Button` 显示 `loading`。
   - 错误显示 `Alert`。

## 影响范围评估

仅修改 `useApi.ts`（请求端点映射）与 `CustomEditorSection.tsx`（样式调整），其他页面不受影响。

## 回归测试

1. 登录后进入 `/custom`，观察文本框是否立即显示后端内容。
2. 修改文本并等待 1-2s，检查 Network Tab 中 `/user/custom` 是否发送 `update` 请求。
3. 连续输入停止后只应出现 1 次请求。
4. 点击「保存」按钮应立即触发请求，按钮进入 loading 状态后复位。
5. 刷新页面应能看到刚刚保存的内容。
6. 文本框初始高度约 10 行，内容不足时不会触底。

---

> 更新记录：
>
> - 2025-06-30 创建文档并完成实现。
> - 2025-07-01 修正端点 & 样式，补充更新记录。 