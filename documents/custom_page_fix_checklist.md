# 自定义页面功能修复 Checklist

> 文件位置：`documents/custom_page_fix_checklist.md`

- [x] 创建设计文档（`custom_page_fix_design.md`）
- [x] 阻断首次渲染空保存逻辑
- [x] 基于远端数据初始化 `lastSavedBodyRef`
- [x] 差异检测 + 1s Debounce 自动保存实现
- [x] 手动「保存」按钮（含 loading & 禁用状态）
- [x] 修正 API 路由映射（`useApi.ts`）
- [x] 调整样式：去除 `h-full`，启用 `TextArea.autoSize`
- [ ] 本地手动测试：进入页面可见远端数据
- [ ] 本地手动测试：输入后 1s 自动保存（Network Tab 验证）
- [ ] 本地手动测试：连续输入仅 1 次请求
- [ ] 本地手动测试：「保存」按钮可立即保存并复位
- [ ] 代码 Review & 合并
- [ ] 部署后线上验证

> **更新记录**
>
> - 2025-06-30 初始化并完成前 5 项。
> - 2025-07-01 完成 API & 样式修复。 