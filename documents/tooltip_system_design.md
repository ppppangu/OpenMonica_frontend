# UI 按钮悬浮提示系统 – 设计文档

## 1. 背景
当前界面中存在大量功能按钮，但缺乏直观的说明文字。为提升可用性，需要在用户将鼠标悬停到按钮时，显示简短的功能说明。所有说明内容统一维护在 **config.yaml** 的 `annotation` 区域，便于后续运营或研发进行集中管理。

## 2. 目标
1. 读取 `config.yaml` 中的 `annotation` 映射（键：按钮文本；值：说明文字）。
2. 当 UI 中任意按钮文本匹配到映射键时，自动在 `title` 属性中注入对应说明，实现浏览器原生悬浮提示。
3. 设计同时兼顾后续扩展——未来可替换为自定义样式 Tooltip 组件而无需更改业务逻辑。

## 3. 方案概述
- **数据加载**：在前端启动阶段（具体实现放在 `ChatInput.tsx` 中的 `useEffect`），通过 `fetch('/config.yaml')` 读取 YAML 文本并使用 `js-yaml` 解析。
- **状态管理**：使用 React `useState<Record<string,string>>` 在组件内保存 `annotation` 映射。
- **渲染注入**：在渲染按钮时，读取 `annotations[btn.label]`，如存在则写入 `title` 属性。
- **通用性考虑**：虽然目前主要影响 `ChatInput` 中的快捷按钮区域，但该映射状态可在未来提取为全局 `AnnotationContext`，以支持更多组件共享。

## 4. 关键代码片段
```ts
// 1. 加载 annotation
const [annotations, setAnnotations] = useState<Record<string,string>>({})
...
if (data && typeof data.annotation === 'object') {
  setAnnotations(data.annotation as Record<string,string>)
}

// 2. 按钮渲染
<Button title={annotations[btn.label]}> {btn.label} </Button>
```

## 5. 兼容性 & 性能
- `fetch('/config.yaml')` 已在组件中用于加载 `prompt_buttons`，此次复用同一次网络请求，无额外开销。
- 使用原生 `title` 属性，兼容所有主流浏览器，无需额外依赖。

## 6. 迭代计划
| 阶段 | 内容                                                           |
| ---- | -------------------------------------------------------------- |
| MVP  | 读取 `annotation` 并在 `ChatInput` 按钮上注入 `title` (已完成) |
| V2   | 提取为 `AnnotationContext` 并在全局共享                        |
| V3   | 用 Ant Design `Tooltip` 组件替换原生提示，支持多行 & 样式定制  |

## 7. 回滚策略
如发现 tooltip 导致意外布局问题，可在 `ChatInput.tsx` 中暂时注释 `title={annotations[btn.label]}` 行并重新部署，无需后端配合。 