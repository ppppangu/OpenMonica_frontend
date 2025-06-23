# 模型流式输出前端渲染核心算法设计

## 1. 背景
在对话类应用中，模型的响应通常采用**流式**方式返回。为提供更丰富的交互体验，需要在前端对**思考内容**、**正文内容**、**工具调用**和**工具调用结果**进行差异化渲染，并保持与历史记录的兼容。这份文档给出了核心算法与组件设计，方便任何开发者从零开始理解与实现。

## 2. 核心概念
| 名称           | 说明                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 气泡 (Bubble)  | 聊天窗口中的一条消息，由 *模型* 产生，对应一个 **X 字符串**状态。                                                                         |
| X 字符串       | 某条气泡当前已接收的所有原始流式文本的累积。算法仅对 X 做解析生成 DOM，不直接依赖流式事件。                                               |
| 流式块 (Chunk) | WebSocket / SSE 返回的增量 JSON，含 `content` 与 `reasoning_content` 字段。                                                               |
| `<think>` 标签 | 人工约定的占位标签，用于在 X 中标记 **思考过程**区段。                                                                                    |
| 四类子元素     | ① 思考过程 `<div class="think">` ② 正文 `<div class="normal">` ③ 工具调用 `<div class="tool-using">` ④ 工具完成 `<div class="tool-done">` |

## 3. X 字符串增量更新算法
### 3.1 状态
```
interface BubbleState {
  x: string          // 当前累计的 X
  inThink: boolean   // X 是否处于未闭合的 <think>
}
```

### 3.2 伪代码
```ts
function addChunk(state: BubbleState, chunk: Chunk): void {
  const isReason = !!chunk.reasoning_content;
  const text     = isReason ? chunk.reasoning_content : chunk.content;

  if (isReason) {
    // 思考块
    if (!state.x) {
      state.x += `\n<think>` + text;
      state.inThink = true;
    } else if (state.inThink) {
      state.x += text; // 已在 <think> 内
    } else {
      state.x += `\n<think>` + text;
      state.inThink = true;
    }
  } else {
    // 非思考块
    if (state.inThink) {
      state.x += `</think>\n` + text;
      state.inThink = false;
    } else {
      state.x += text;
    }
  }
}
```
*Tips*: 真实实现需处理 HTML 转义与前后空格。

## 4. DOM 渲染算法
给定完整的 X 字符串，执行一次 **自顶向下解析**，生成一颗只含四类子 `<div>` 的 DOM 树。

流程概述：
1. 以正则自左向右扫描 X，识别出三种结构块：
   - 工具调用 JSON 代码块
   - 工具完成 JSON 代码块
   - 其他文本（内部再切分为 think/normal）
2. 工具 JSON 解析成功后渲染对应 `<div class="tool-using|tool-done">`，并收集其 *tool* & *arguments* 以供"隐藏匹配的工具调用"逻辑。
3. 对未匹配 JSON 的文本再依据 `<think>` 标签切片：
   - 位于 `<think>...</think>` 内 → `<div class="think">`（灰色字体）
   - 其余 → `<div class="normal">`（白色字体）
4. **Markdown 渲染**：在 think/normal 内先用 markdown-it 转 DOM，再在渲染树中替换 `<url>` 模式为 `<iframe>`。

### 4.1 正则片段
```js
const reToolUsing = /```json[\s\S]*?"tool"[^]*?"arguments"[^]*?```/g;
const reToolDone  = /```json[\s\S]*?"params"[^]*?"tool_response"[^]*?"is_error"[^]*?```/g;
const reThinkTag  = /<think>|</think>/;
```

### 4.2 隐藏已完成的工具调用
若某 `<div class="tool-done">` 的 `params.tool` 与 `params.arguments` 与某 `<div class="tool-using">` 完全一致，则在最终渲染树中隐藏该 *tool-using* 元素。

## 5. 组件 API 草案
```
<Bubble :stream-state="bubbleState" />
```
- `stream-state`: 包含 `x` 与 `inThink`，父组件实时更新。
- Bubble 内部 `watch(x)` → `render()` 生成 Virtual DOM。

## 6. 边界与异常
- 多个 `<think>` 交错或缺省闭合：解析时按最近未闭合补全。
- 工具 JSON 解析失败：降级为普通文本。
- X 过大时分块 diff 渲染，避免整气泡重排。

## 7. 性能
- 使用 `requestIdleCallback` 延后 markdown 渲染。
- 对工具 JSON 块先缓存解析结果以复用。

## 8. 安全
- 统一使用 DOMPurify 防 XSS。
- `<iframe>` 采用 sandbox="allow-scripts allow-same-origin"，并设置 `srcdoc`。

## 9. 迭代计划
1. **MVP**：实现核心算法，完成测试样例。  _← 当前目标_
2. **组件化**：封装成 Vue 组件并在主聊天窗口替换。
3. **性能优化**：增量 Parsing + Virtual DOM diff。
4. **单元测试**：jest + jsdom 覆盖全部分支。 