# Organization 页面内容居中设计

## 1. 问题描述
"我的组织"页面文字不居中，且顶部存在冗余标题。

## 2. 解决方案
1. **删除冗余标题** `<h2>`。
2. **简洁占位描述** 仍保留业务文案。
3. **Flex 居中** 使用 `flex items-center justify-center h-full text-center` 将内容水平垂直居中。
4. **文件位置** `src/pages/OrganizationPage.tsx`。

## 3. 验证步骤
1. 进入"我的组织"页面。
2. 文字位于可视区域中心，页面无其他内容。

---
负责人：AI
日期：{{DATE}} 