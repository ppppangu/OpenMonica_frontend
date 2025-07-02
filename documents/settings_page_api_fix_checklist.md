# 设置页面 API 错误修复 Checklist

| 步骤 | 任务描述 | 状态 |
| ---- | -------- | ---- |
| 1 | 编写设计文档 (`settings_page_api_fix_design.md`) | ✅ |
| 2 | 修改 `simple-server.cjs`：实现 `mode=update` 分支 & 统一响应格式 | ✅ |
| 3 | 改进 `handleApiResponse`：兼容空 body | ✅ |
| 4 | 修改 `updateUserInfo`：兼容 `success` 字段 | ✅ |
| 5 | 本地测试：用户名 / 邮箱 / 密码修改 | ⬜ |
| 6 | 更新 checklist 状态 | ⬜ | 