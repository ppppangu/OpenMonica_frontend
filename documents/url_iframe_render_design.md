# 聊天页面 <url> Iframe 渲染规则设计

## 1. 背景与目标
在现有聊天消息渲染体系中，Markdown 渲染拥有最高优先级。当模型回复中包含 `<http://...>` 或 `<https://...>` 形式的 URL 时，Markdown-it 的 *autolink* 规则会率先将其替换为 `<a>` 标签，导致难以将其渲染为 `iframe`。为支持"**在流式响应过程中**"即刻预览外部网页，需要为该语法新增 **更高优先级** 的渲染规则。

目标：
1. 检测 `<http(s)://…>` 形式 URL。
2. 将其直接渲染为可 sandbox 的 `iframe` 标签。
3. 与现有流式渲染算法无缝集成，保证边到边体验。

## 2. 方案概览
1. **预处理优先级**：在进入 Markdown-it 之前，使用正则 `/<(https?:\/\/[^>]+)>/g` 匹配，并直接替换为完整的 `<iframe>` HTML 片段。
2. Markdown-it 开启 `html: true`，能够原样保留 `<iframe>` 标签，因此该步骤后续不会对 iframe 产生干扰。
3. 为向后兼容历史数据中因转义导致的 `&lt;url&gt;`，保留原有"渲染后二次替换"逻辑。
4. `iframe` 属性采用：
   - `sandbox="allow-scripts allow-same-origin"` —— 避免第三方页面越权。
   - `referrerpolicy="no-referrer"` —— 减少信息泄漏。
   - 行内 `style="width:100%;height:300px;"` —— 默认高度 300px，宽度 100%。

## 3. 关键实现步骤
1. 在 `streamingUtils.ts` 的 `markdownToHtml` 方法起始处新增 **预处理逻辑**。
2. 完成替换后再调用 `md.render(preProcessed)`，保证 Markdown 功能不受影响。
3. 保留旧的 `&lt;url&gt;` → `iframe` 兜底逻辑。
4. 单元测试 & 手动测试：
   - 输入 `<https://example.com>` ⇒ 实时展示 iframe。
   - 流式返回 + 多段文本混合 ⇒ iframe 仍可即时渲染。
   - 其它 Markdown 语法不受影响。

## 4. 安全与性能
- `sandbox` 与 `referrerpolicy` 双重保护，降低点击劫持与信息泄露风险。
- 未对渲染 pipeline 进行深层改动，对性能影响极小。

## 5. 预计工作量
- 代码改动：≈ 10 行。
- 文档 & Checklist：≈ 30 分钟。
- 测试验证：≈ 30 分钟。

## 6. 变更记录
| 版本 | 作者 | 日期     | 说明        |
| ---- | ---- | -------- | ----------- |
| v1   | AI   | {{auto}} | 初稿/已实现 |