# 知识库列表点击无效问题修复 Checklist

| 序号 | 任务                                                   | 负责人 | 状态 |
| ---- | ------------------------------------------------------ | ------ | ---- |
| 1    | 阅读知识库设计文档，明确期望交互                       | AI     | ✅    |
| 2    | 复现问题，确认未发送 detail 请求                       | AI     | ✅    |
| 3    | 排查 `KBListPanel` 点击事件 & userId 问题              | AI     | ✅    |
| 4    | 修改 `KBListPanel`，新增 `handleSelect` 并确保事件生效 | AI     | ✅    |
| 5    | 修改 `fetchKnowledgeBaseDetail` 兼容多返回结构         | AI     | ✅    |
| 6    | `KBDetailHeader` 文档计数回退逻辑                      | AI     | ✅    |
| 7    | 本地手动测试：切换知识库正常                           | AI     | ⬜    |
| 8    | 更新设计文档与 Checklist                               | AI     | ✅    |
| 9    | 提交 PR / 通知 reviewer                                | AI     | ⬜    |

> 说明：待手动测试完成后，将第 7 步标记为 ✅；PR 合并后更新第 9 步。 