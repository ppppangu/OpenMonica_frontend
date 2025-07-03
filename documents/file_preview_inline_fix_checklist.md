# 文件预览 inline 展示修复 Checklist

| 步骤                                                                                  | 负责人   | 状态 |
| ------------------------------------------------------------------------------------- | -------- | ---- |
| 1. 确认问题与复现路径                                                                 | 前端     | ☑    |
| 2. 在本地抓包确认响应头（Content-Disposition / Content-Type）                         | 前端     | ☐    |
| 3. 后端修改 `createFileProxyHandler` 移除上游 Content-Disposition 并补全 Content-Type | 后端     | ☑    |
| 4. 前端统一代理地址为 `/file/proxy`                                                   | 前端     | ☑    |
| 5. ChatMessage 恢复使用代理注入 iframe                                                | 前端     | ☑    |
| 6. 本地测试 HTML/PDF 预览                                                             | QA       | ☐    |
| 7. 编写单元/集成测试（可选）                                                          | QA       | ☐    |
| 8. 更新相关文档 & README                                                              | 技术文档 | ☐    |
| 9. 部署到测试环境，二次验证                                                           | DevOps   | ☐    |
| 10. 上线生产、监控日志                                                                | DevOps   | ☐    |