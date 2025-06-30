# Chat Page 功能升级 Checklist

- [x] 创建设计文档 `chat_page_functionality_design.md`
- [x] 模型选择改为单选并默认选中第一项
- [x] `useFileUploadMutation` Endpoint 改为 `/upload_minio`
- [x] `ChatInput` 文件上传：
  - [x] 300 MB 限制验证
  - [x] 携带 `user_id`，解析 `public_url`
  - [x] 上传成功后写入 `fileStore`
  - [x] UI 预览及删除
- [x] `ChatPage` 未选模型时进入页面自动选中第一模型
- [ ] 回归测试：
  - [ ] 上传不同类型文件 (<300MB) 成功
  - [ ] 上传超大文件失败提示
  - [ ] 聊天历史加载、删除、新建流程
  - [ ] SSE 聊天保持正常

更新时间：2025-06-29 