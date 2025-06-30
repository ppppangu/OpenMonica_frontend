# CustomPage 导入路径错误修复设计

## 1. 问题描述
在启动开发服务器时，Vite 报错：
```
Failed to resolve import "../components/knowledgebase/CustomEditorSection" from "src/pages/CustomPage.tsx".
```
原因是 `src/components/knowledgebase/CustomEditorSection.tsx` 已在早期重构中被删除，导致 `CustomPage` 中的旧引用失效。

## 2. 解决方案
1. **重新实现 `CustomEditorSection` 组件**
   - 新建目录 `src/components/custom/`。
   - 组件职责：
     * 加载目标数据（自定义提示/模型记忆）。
     * 提供文本编辑、保存功能。
   - 使用现有 hooks：`useCustomData` & `useUpdateCustomDataMutation`。
2. **更新 `CustomPage` 引用路径**
   - 从 `../components/custom/CustomEditorSection` 引入新组件。

## 3. 关键实现要点
- 实时获取 userId（Zustand `useAuthStore`）。
- 文本变更后点击「保存」触发 `mutation`，成功后 `refetch` 数据。
- 组件自带 `Spin` 与错误信息展示。

## 4. 验证步骤
1. 登录后进入「自定义」页面。
2. 确认页面正常渲染两个编辑区。
3. 修改文本并点击「保存」后出现成功提示，刷新页面仍能看到更新后的内容。

## 5. 影响范围
- `src/components/custom/CustomEditorSection.tsx`（新增）
- `src/pages/CustomPage.tsx`（更新 import）

---
此次修改独立于知识库功能，不影响其他模块。 