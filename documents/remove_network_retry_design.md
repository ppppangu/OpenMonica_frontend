# ChatPage 网络重试提示移除设计

## 1. 背景
当 SSE 流因 idle timeout 被取消时，会调用 `message.warning('网络不稳定，正在重试…')` 弹出提示。产品决策调整：去除该提示，但保留自动重试逻辑。

## 2. 方案
- 定位 `src/pages/ChatPage.tsx` idle timeout `AbortError` 分支。
- 注释 / 删除 `message.warning(...)` 行。
- 其他逻辑（`retryCount` 及重试调用）保持不变。

## 3. 验证
1. 人为断网或阻塞响应，触发 idle 重试。
2. 浏览器不再出现"网络不稳定，正在重试…"提示，重试仍执行。

---
负责人：AI
日期：{{DATE}} 