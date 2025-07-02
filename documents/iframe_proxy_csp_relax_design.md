# Iframe Proxy CSP 放宽设计

## 1. 背景
当前 `/proxy` 路由为了安全，在响应头统一添加了

```
Content-Security-Policy: sandbox allow-scripts allow-same-origin
```

然而:
1. 该指令等同于 `sandbox` 并带有限制 token, 会触发 **强制同源隔离** , 导致 iframe 内页面无法读取自身 Cookie, 也无法请求外链脚本。
2. 某些 PDF/Office 在线预览服务自身依赖脚本执行, 结果因 CSP 被屏蔽呈现空白。
3. 近期业务需求要求"功能优先, 安全可以非常宽松"。

## 2. 目标
1. **彻底移除** `/proxy` 路由上的 `Content-Security-Policy` 头, 不再强加 sandbox。
2. 保持现有 `Access-Control-Allow-Origin: *` 等跨域便利头。
3. 前端 `<iframe>` 仍可保留 `sandbox="allow-scripts allow-same-origin"` 作为最小可接受隔离, 避免出现 **完全开放** 的安全洞。

## 3. 方案概览
- **后端修改**: 在 `server.cjs` 与 `simple-server.cjs` 中删除 `res.set('Content-Security-Policy', ...)` 行。
- **可选进一步放宽**: 若后期仍有兼容问题, 直接允许脚本执行, 可由前端去掉 iframe 的 `sandbox` 属性即可, 本轮暂不删除, 待验证需求。

## 4. 影响范围
仅影响通过 `/proxy` 获取的资源, 不改变其它 API 端点。

## 5. 验证步骤
| 步骤 | 操作                                                                                                           | 预期                                      |
| ---- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1    | 启动 `npm start` (生产环境)                                                                                    | server 运行成功                           |
| 2    | 访问 `http://localhost:3001/proxy?url=https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf` | PDF 正常渲染, console 无 CSP/Sandbox 报错 |
| 3    | 测试带脚本的静态 HTML (如 ECharts demo)                                                                        | 图表正常加载                              |

## 6. 工时
- 代码改动 < 5 行
- 文档+Checklist ≈ 10 分钟

---
负责人: AI
日期: {{DATE}} 