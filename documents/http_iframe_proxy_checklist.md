# HTTP Iframe Proxy Handling – Checklist

| 步骤 | 描述                                                         | 状态   |
| ---- | ------------------------------------------------------------ | ------ |
| 1    | 设计文档撰写                                                 | ✅ 完成 |
| 2    | 服务器端 `/proxy` 路由实现（server.cjs & simple-server.cjs） | ✅ 完成 |
| 3    | 前端 `ChatMessage.tsx` 修改（自动代理 & UI 链接更新）        | ✅ 完成 |
| 4    | 手动测试：HTTP/HTTPS/MindMap 文件                            | ⬜ 待办 |
| 5    | 修复部分 upstream 返回 application/octet-stream 导致下载     | ✅ 完成 |
| 6    | 更新 README & 文档                                           | ⬜ 待办 |