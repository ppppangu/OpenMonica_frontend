# 聊天页面优化设计文档 (Chat Page Optimizations)

> 目标日期：2025-06-30

## 背景
用户反馈以下问题需要修复/改进：
1. 终止按钮无法立即关闭流式 SSE 连接
2. MindMap HTML 资源通过 `http://` 加载导致 HTTPS Mixed-Content 警告
3. 多模态模型在混合文件上传时，无法正确区分图片与文档
4. Mermaid 图表未能稳定渲染
5. 左侧导航在滚动时随内容一起滚动，影响 UX

本设计文档给出逐项的技术分析与解决方案。

---

## 1. 终止按钮失效（SSE 中断）
### 问题分析
- 旧实现中使用 `fetch + ReadableStream` 取代原生 `EventSource`。
- `AbortController` 对象仅在 `handleSendMessage` 的本地作用域内，外部无法调 `abort()`。
- `ChatInput` 的「停止」按钮调用 `handleStopStreaming`，但只能关闭历史遗留的 `sseRef`，无法中断 `fetch`。

### 解决方案
1. 在 `ChatPage` 组件内创建 `abortControllerRef = useRef<AbortController | null>`。
2. 每次发送消息时将新的 `AbortController` 保存在该 ref 中。
3. `handleStopStreaming` 调用 `abortControllerRef.current?.abort()`，并清空引用。
4. 在 `handleStreamComplete / finally` 中统一清理。

### 影响面
- 仅改动 `src/pages/ChatPage.tsx`，无后端接口变更。

---

## 2. HTTPS Mixed-Content 警告
### 问题分析
- MindMap 生成服务返回的 HTML 路径为 `http://.../mindmap_xxx_artifacts.html`。
- 浏览器在 HTTPS 站点下解析该链接触发 Mixed-Content。

### 解决方案
1. **前端临时兜底**：在渲染富文本/附件链接前，检测 `http://` 且域名匹配 `*.cpolar.cn` 时，将协议替换为 `https://`。
2. **长期方案**：后端统一返回 HTTPS 链接或通过 CDN/反代提供 HTTPS（需后端配合）。
3. 本次迭代先实现方案 1，封装在 `utils/streamingUtils.ts` 的 URL 替换函数中。

### 影响面
- `ChatMessage` 的渲染以及附件预览。

---

## 3. 混合文件上传的多模态处理
### 问题分析
- 当模型支持多模态且带有图片时，会按 OpenAI 规范组装 `user_message_list`。
- 现逻辑忽略了同批次中的文档附件，导致所有文件都"丢失"或被当作图片处理。

### 解决方案
1. 在 `handleSendMessage` 中将附件拆分为 `imageAttachments` 与 `documentAttachments`。
2. 仍按多模态格式构建图片内容；对文档附件生成一段追加文本 `\n\n[附件列表]\nfile1: url1`。
3. 这样既保证图片进入模型视觉通道，也保留了文档链接供大模型阅读。

### 影响面
- 修改 `src/pages/ChatPage.tsx`（已完成）。

---

## 4. Mermaid 渲染
### 问题分析
- Mermaid 需要全局唯一的图表 ID，增量渲染时可能重复导致报错。
- Streaming 渲染多次刷新 `<div class="mermaid">` 节点。

### 解决方案
1. 在 `ChatMessage` 渲染后，对每个 `.mermaid` 元素动态分配随机 `id`（若无）。
2. 统一调用 `mermaid.initialize({ startOnLoad:false })` 只在首次全局调用。
3. 每次渲染后执行 `mermaid.init(undefined, elementList)` 避免重新初始化。

### 影响面
- `src/components/chat/ChatMessage.tsx`

---

## 5. Sidebar 固定定位
### 问题分析
- 当前 `Sider` 处于常规文档流，随 `Content` 滚动。

### 解决方案
1. 在 Ant Design `Layout` 基础上，将 `<Sider>` 设置 `style={{ position:'fixed', left:0, top:0, height:'100vh' }}`。
2. `Content` 外层添加左侧边距 `marginLeft: collapsed? 80 : 260`（与 `Sider` 宽度同步）。
3. 监听 `collapsed` 状态动态调整。

### 影响面
- `src/components/layout/MainLayout.tsx`

---

## 风险评估
| 风险                                | 等级 | 对策                                   |
| ----------------------------------- | ---- | -------------------------------------- |
| 中止逻辑引发潜在内存泄漏            | 中   | `finally` 彻底清理引用                 |
| URL 自动替换可能误伤非 MindMap 链接 | 低   | 正则限定域名 & `http:` 前缀            |
| `Sider` 固定后移动端适配            | 中   | 保持媒体查询，必要时 fallback 为原布局 |

---

## 里程碑
1. [x] 设计文档
2. [ ] SSE 终止修复
3. [ ] HTTPS Mixed-Content 处理
4. [ ] 混合附件处理
5. [ ] Mermaid 渲染稳定性
6. [ ] Sidebar 固定定位
7. [ ] 验证与回归测试

---

> 更新记录：
> - 2025-06-30  初稿 