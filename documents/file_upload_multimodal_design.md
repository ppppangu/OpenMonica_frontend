# 多模态文件上传与消息格式支持设计文档

> 目标：前端在调用多模态模型（Vision / Image）时，按照 OpenAI Vision API 的要求，自动将图片附件整合进 messages 数组，格式如下：
>
> ```json
> {
>   "role": "user",
>   "content": [
>     { "type": "text", "text": "描述这张图片" },
>     { "type": "image_url", "image_url": { "url": "https://example.com/foo.png" } }
>   ]
> }
> ```

## 1. 现状分析
1. `ChatInput` 组件已支持将本地文件上传至后端 MinIO，并通过 `fileStore` 保存 `public_url` 等信息。
2. `ChatPage.handleSendMessage` 在判断为多模态模型时，会尝试组装 `messages` 字段，但：
   - 字段名使用 `messages`，而后端 `createChatStreamHandler` 期待的是 `user_message_list`。
   - 没有保证附件一定附着在同一条 user message 的 `content` 数组内。
3. 服务端如未检测到 `user_message_list`，会退化为读取简单的 `text` 字段，导致多模态调用失败。

## 2. 设计目标
- 前端统一使用 `user_message_list` 传递消息数组。
- 若检测到当前模型为多模态且存在图片附件，则：
  1. 将文本拆分为 `{ type:"text" }` 对象；
  2. 遍历图片附件，依次压入 `{ type:"image_url" }` 对象；
  3. 仅发送 **一** 条 user message，避免上下文膨胀。
- 发送成功后自动 `clearAllFiles()`。

## 3. 实现步骤
1. **类型判断**：在 `ChatPage.tsx` 根据 `model.owned_by` 是否含有 `multimodal` 字样来判定是否为多模态模型。（已存在）
2. **参数修正**：
   - 将 `formData.append('messages', ...)` 改为 `formData.append('user_message_list', ...)`。
   - 非多模态场景保持原有 `text` 字段逻辑。
3. **格式构造**：
   ```ts
   const contentArr = [ { type:'text', text: content } ]
   imageAttachments.forEach(img => contentArr.push({ type:'image_url', image_url:{ url: img.public_url } }))
   const messages = JSON.stringify([{ role:'user', content: contentArr }])
   formData.append('user_message_list', messages)
   ```
4. **附件生命周期**：发送完成后调用 `clearAllFiles()`，保证下一轮输入干净。
5. **配置**：如后端需要校验图片扩展名，确保 `config.yaml` 中 `allowed_image_exts` 包含常见格式。(已在其他任务中完成)

## 4. 回归测试
| 场景              | 步骤                              | 预期                                                                     |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------ |
| 多模态 + 单图     | 上传 `cat.png` → 发送"这是什么？" | 后端收到 `user_message_list[0].content[1].image_url.url === .../cat.png` |
| 多模态 + 多图     | 上传 2 张图 → 发送"比较这两张"    | `content` 中有 3 个元素：text + 2 image_url                              |
| 纯文本            | 不上传图 → 发送"你好"             | 走 `text` 字段，后端正常响应                                             |
| 文本 + 非图片文件 | 上传 `doc.pdf` → 发送提问         | 提示"附件列表"追加到文本内容                                             |

---
更新时间：2025-06-29 