# Iframe Proxy CSP 放宽 Checklist

| 序号 | 任务                                 | 负责人 | 状态 |
| ---- | ------------------------------------ | ------ | ---- |
| 1    | 编写设计文档                         | AI     | ✅    |
| 2    | 修改 `server.cjs` 去除 CSP 头        | AI     | ✅    |
| 3    | 修改 `simple-server.cjs` 去除 CSP 头 | AI     | ✅    |
| 4    | 修改 `ChatMessage.tsx` 去除 iframe sandbox | AI | ✅ |
| 5    | 本地验证 PDF / 脚本页面加载          | AI     | ⬜    |
| 6    | 更新 Checklist 状态                  | AI     | ⬜    |