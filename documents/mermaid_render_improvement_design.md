# Mermaid 渲染防闪烁 & 交互式预览 设计文档

## 背景

在现有聊天气泡中，Mermaid 代码块会被立即替换成 `<svg>`，在渲染期间会出现明显的闪烁（Flash of Un-styled/Un-rendered content，FOUC）。此外，无法查看原始源码也限制了用户的二次编辑与复制需求。

## 目标

1. **消除闪烁**：在图表完成渲染前仅显示占位骨架。
2. **查看源码**：支持用户在预览图与 Mermaid 源码之间切换。
3. **零侵入**：保持现有 Markdown → HTML 流程不变；所有处理在前端运行时完成。

## 技术方案

1. **包裹器 (`.mermaid-wrapper`)** 结构

```
<div class="mermaid-wrapper">
  <div class="mermaid-placeholder">生成中…</div>
  <div class="mermaid-preview hidden">
    <div class="mermaid">graph TD;A-->B</div> <!-- 由 mermaid.js 渲染为 svg -->
  </div>
  <pre class="mermaid-source hidden"><code>graph TD;A-->B</code></pre>
</div>
```

2. **渲染流程**

```
useEffect → 查询 .mermaid → 构建包裹器 → mermaid.init() →
setTimeout(100ms) → 隐藏 placeholder, 显示 preview
```

3. **交互逻辑**

* 点击 `.mermaid-wrapper`：
  * 若当前显示预览 → 显示源码
  * 若当前显示源码 → 显示预览

4. **错误处理**

* `try / catch` 捕获 `mermaid.init` 异常，placeholder 文本更新为「图表渲染失败」。

5. **样式**

* 使用 Tailwind 类名：
  * 边框 `border border-gray-200`
  * 圆角 `rounded-md`
  * 阴影 `shadow-sm`
  * 占位骨架 `animate-pulse text-gray-400 h-40 flex items-center justify-center`

## 组件耦合

全部逻辑注入到 `ChatMessage.tsx` 内部 `useEffect`，无需修改下游 Markdown 解析。

## 性能评估

* 每个 mermaid 节点仅初始化一次，重复渲染时先行检查 `parentElement` 是否已包装。
* placeholder 使用静态 DOM，无额外重绘开销。

## 向后兼容

旧 `.mermaid` 渲染流程依旧可用；仅当节点第一次被包裹时启用新逻辑。

## 待办事项

* 无 