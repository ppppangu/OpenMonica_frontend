# Chat Page 优化 Checklist

> 维护人：AI
> 更新时间：2025-06-30

- [x] 创建设计文档 `chat_page_optimization_design.md`
- [x] 修复 SSE 主动终止逻辑 (ChatPage AbortController)
- [ ] HTTPS Mixed-Content 临时处理 (URL 升级至 HTTPS)
- [x] 混合文件上传逻辑完善 (图片+文档)
- [x] Mermaid 渲染稳定化
- [x] Sidebar 固定定位
- [ ] 回归测试：
  - [ ] 停止按钮即时终止流式响应
  - [ ] MindMap HTML 资源无混合内容警告
  - [ ] 多模态模型正确处理混合附件
  - [ ] Mermaid 图渲染正常
  - [ ] 侧边栏在滚动时保持固定 