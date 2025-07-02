# HTTPS Iframe 渲染安全代理设计 (支持 cpolar 隧道域名)

## 1. 背景
在 Edge 浏览器中，当 iframe 嵌入的目标 URL 属于 cpolar 提供的保留子域时（形如 `https://*.cpolar.[top|cn|io]`），SmartScreen 会将其标记为潜在风险并阻断加载，显示"此页面已被 Microsoft Edge 阻止"。这导致聊天界面无法预览经 cpolar 暴露的 MinIO 静态站点。

## 2. 目标
1. 自动检测 `*.cpolar.*` 目标域名并改用同源 `/proxy?url=` 进行转发，规避 SmartScreen 阻断。
2. 保持原有"HTTPS 页面内嵌 HTTP 资源"混合内容的代理逻辑。
3. 无需后端额外改动，沿用现有 `/proxy` 实现。

## 3. 方案概览
- 在 `ChatMessage.tsx` 的安全 iframe 注入逻辑中：
  1. 使用 `new URL(rawSrc).hostname` 解析域名。
  2. 若正则 `/\.cpolar\./i.test(host)` 命中，则判定为 cpolar 隧道域名，需要代理。
  3. 若当前页面协议为 `https:` 而目标为 `http:`，同样代理（旧逻辑保留）。
- 将两种判断结果合并为 `needProxy` 布尔值，触发 `resolvedSrc = '/proxy?url=' + encodeURIComponent(rawSrc)`。

## 4. 安全性
- 仍使用 `/proxy` 路由统一设置 `sandbox allow-scripts allow-same-origin` CSP，保障第三方内容隔离。
- 前端 `iframe` 保留 `sandbox` 与 `referrerpolicy="no-referrer"`，防止信息泄漏。

## 5. 影响范围
仅影响包含 `<https://*.cpolar.*>` 链接的聊天消息渲染，对其他功能无副作用。

## 6. 验证步骤
| 步骤 | 操作 | 期望 |
| ---- | ---- | ---- |
| 1 | 在聊天输入框发送 `<https://foo.cpolar.top>` | 气泡立即出现 loading 占位 |
| 2 | Edge 浏览器观察 iframe 渲染 | 页面内容正常展示，无 SmartScreen 拦截 |
| 3 | 打开 DevTools Network | 请求经由 `/proxy?url=`，返回 200 |

## 7. 工时预估
- 代码：≈5 行
- 文档与 Checklist：≈15 分钟

---
负责人：AI
日期：{{DATE}} 