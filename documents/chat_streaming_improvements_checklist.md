# Chat Streaming Improvements – Checklist

- [x] 后端：在 SSE 响应中添加 `Connection: keep-alive` 及心跳包 ✅
- [x] 后端：延长 `keepAliveTimeout` & `headersTimeout` / Nginx `proxy_read_timeout` ✅
- [x] 前端：`streamResponse` 循环读取 + 心跳超时检测 ✅
- [x] 前端：自动重连（最多 3 次）实现 ✅
- [ ] 前端：流结束后隐藏"中断对话"按钮
- [ ] 前端：显示"网络不稳定，正在重试…"提示
- [ ] QA：本地延迟 30 s 测试无 ECONNRESET
- [ ] QA：断网恢复自动重连成功 