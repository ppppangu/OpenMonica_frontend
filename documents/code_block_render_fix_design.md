# 代码块首行缩进异常修复设计

## 1. 问题描述
在聊天消息中，用 ``` 开头的 Markdown 代码块首行出现多余空格缩进，影响代码可读性。

## 2. 根因分析
自定义 `MarkdownIt` 高亮回调 `highlight()` 中使用模板字符串时，返回内容被包裹在 `\n        <pre>` 形式 —— 模板字符串第一行和缩进空格被当作普通文本输出到 HTML，`pre` 标签本身又会保留前置空白，导致首行看似被缩进。

## 3. 解决方案
将多行模板字符串改为单行返回，彻底去除标签前后的换行与缩进。例如：
```ts
const renderPlain = (codeHtml: string) =>
  `<pre class="hljs"><code class="language-${escape(safeLang || 'text')}">${codeHtml}</code></pre>`
```
同时保持对 highlight.js 支持与降级逃逸逻辑不变。

## 4. 影响范围
仅影响代码块渲染，不涉及业务数据。

## 5. 验证
1. 发送带有代码块的消息，如:
   ```js
   console.log('hello')
   ```
2. 首行与其余行左边对齐，缩进一致。

## 6. 工时
- 代码：≈1 行
- 文档 & Checklist：≈10 分钟

---
负责人：AI
日期：{{DATE}} 