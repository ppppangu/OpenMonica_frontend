# 附件渲染增强 – 设计文档

## 1. 背景
当前后端返回的文件附件信息格式为：
```
这个文件讲了什么

[附件列表] filename: url
```
展示效果为一段纯文本，用户需手动复制链接体验不佳。

产品新需求：
1. 后端改为新的嵌套格式：
   ```
   [[附件列表]
   [附件1]
   [name]filename1
   [url]url1
   [附件2]
   [name]filename2
   [url]url2
   ]
   ```
2. 前端需识别此格式，在聊天气泡中渲染为文件图标列表；默认折叠，只显示"共X个附件 展开"，点击后展开并展示下载按钮。

## 2. 数据格式解析
- 使用正则或状态机解析：
  - 首行 `[[附件列表]` 标识开始，末尾 `]` 标识结束。
  - 中间出现若干 `[附件N]`，其下一行 `[name]` 与 `[url]` 分别给出元数据。
- 解析结果：`Attachment[]` 类型
```ts
interface Attachment { name: string; url: string; }
```

## 3. 组件设计
1. **utils/parseAttachments.ts**
   - 提供 `parseAttachmentBlock(text: string): {attachments: Attachment[], stripped: string}`
   - 返回解析后的附件数组及去除附件块后的纯文本消息。
2. **components/file/AttachmentToggle.tsx** (新)
   - Props: `attachments: Attachment[]`
   - 内部状态 `expanded`，默认 `false`。
   - 折叠态：文本"📎 共{attachments.length}个附件 展开 ⌄"。
   - 展开态：纵向列表，每行 `FileIcon(name) + name + 下载`。
3. **修改 ChatMessage.tsx**
   - 渲染前调用 `parseAttachmentBlock(message.content)`。
   - 如果有附件，则在消息文本后追加 `<AttachmentToggle />`。
4. **复用现有 FileAttachmentList.tsx**
   - 若样式足够，可直接用并调整 Props；否则按新组件实现。

## 4. 样式
- 使用 Tailwind：icon 按文件扩展名确定颜色 (pdf-red, docx-blue...)；
- 折叠行 `text-sm text-gray-500 cursor-pointer`，hover `underline`。

## 5. 兼容旧格式
- 若未匹配新格式，则回退原逻辑；
- 新老格式可并存，解析函数做非破坏性处理。

## 6. 实现步骤
| 步骤 | 文件                      | 负责人 | 预估 | 状态 |
| ---- | ------------------------- | ------ | ---- | ---- |
| 1    | utils/parseAttachments.ts | FE     | 0.5h | TODO |
| 2    | 新建 AttachmentToggle.tsx | FE     | 1h   | TODO |
| 3    | 修改 ChatMessage.tsx      | FE     | 0.5h | TODO |
| 4    | 样式优化 & 响应式测试     | FE     | 0.5h | TODO |
| 5    | 单元测试 (Jest)           | FE     | 0.5h | TODO |

## 7. 回归测试
- 含附件消息显示折叠行；
- 点击展开后，正确渲染所有文件名并可下载；
- 多条消息互不影响展开状态；
- 旧格式消息仍正常渲染。

## 8. 风险
- 消息体过大导致正则效率问题 → 改为流式遍历；
- XSS：文件名或 URL 需 `encodeURI` 与 `escapeHtml` 处理。 