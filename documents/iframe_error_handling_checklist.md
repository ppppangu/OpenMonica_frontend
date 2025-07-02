# Robust Iframe Component – Checklist

| 步骤 | 描述                                                  | 状态   |
| ---- | ----------------------------------------------------- | ------ |
| 1    | 设计文档撰写                                          | ✅ 完成 |
| 2    | Markdown 注入包装替换实现                             | ✅ 完成 |
| 3    | 新增样式 (`index.css`)                                | ✅ 完成 |
| 4    | `ChatMessage` 注入逻辑（SafeIframe 装载、事件、超时） | ✅ 完成 |
| 5    | 代理逻辑 & 错误 UI                                    | ✅ 完成 |
| 6    | 手动测试不同 URL（HTTP、HTTPS、mindmap.ai 等）        | ⬜ 待办 |
| 7    | 如有需要补充单元/集成测试脚本                         | ⬜ 待办 |
| 8    | 更新文档/README                                       | ⬜ 待办 |
| 9    | 修复 `/proxy` 路由 CSP sandbox 过度限制               | ✅ 完成 |