# 聊天重复发送问题设计文档

## 背景
在当前 React 聊天页面 (`ChatPage.tsx`) 中，用户每发送一次消息，控制台会出现两条相同的日志：

```
[Chat] 发送开始: selectedModelIds ['Pro/deepseek-ai/DeepSeek-V3']
[Chat] 发送开始: selectedModelIds ['Pro/deepseek-ai/DeepSeek-V3']
```

并伴随自动创建新的会话，导致用户一次输入却触发两次与后端的对话流。

## 现象复现步骤
1. 打开聊天页面，输入任意内容并发送。
2. 观察浏览器控制台，`[Chat] 发送开始` 日志出现两次。
3. 会话列表中出现两条新建会话记录。
4. 后端返回两段回答。

## 原因分析
1. **`handleSendMessage` 被快速调用两次**。
   - 它既由组件事件触发，也可能在 _idle timeout_ 重试逻辑、或键盘/按钮双重事件里被触发。
   - React 的 `setState` 是异步的：第一次调用内将 `isStreaming` 设为 `true`，但在同一事件循环内再次调用时，`isStreaming` 仍然是旧值 `false`，从而无法被早期的 `if (!user || isStreaming ...) return` 判定阻止。
2. **缺少同步级别的互斥锁** 来标识「本次发送流程是否已开始」。

## 解决思路
- 引入 `sendingRef`（`useRef<boolean>`）作为同步锁：
  1. 在进入 `handleSendMessage` 时立即检查 `sendingRef.current`。
  2. 若为 `true`，说明已有发送流程在进行，直接返回。
  3. 若为 `false`，将其设为 `true`，直到本次发送完整结束（正常完成、错误、或用户停止）时再重置为 `false`。
- 这样即便多次触发 `handleSendMessage`，后续调用都会被第一时间拦截，保证一次用户操作只对应一次后端请求。

## 详细实现步骤
1. **代码修改**
   - 在 `ChatPage.tsx` 顶部 state 区域新增：
     ```ts
     const sendingRef = useRef<boolean>(false)
     ```
   - 在 `handleSendMessage` 最前端加入：
     ```ts
     if (sendingRef.current) return;
     sendingRef.current = true;
     ```
   - 在 `handleSendMessage` 的所有出口（`finally`、`handleStreamComplete` 等）重置：
     ```ts
     sendingRef.current = false;
     ```
   - 早期返回（`!user || isStreaming ...`）也需先释放锁。
2. **测试用例**
   - **单击发送按钮**：确认只出现一条日志；后端仅返回一次。
   - **键盘 Enter 发送**：同样只触发一次。
   - **快速连击发送按钮**：仅首击生效，其余被忽略。
   - **网络重试**：空闲超时等内部重试逻辑仍可触发（`isRetry=true`），不受锁影响，因为我们在重试前会显式调用 `sendingRef.current = false`。
3. **潜在影响评估**
   - 不改变业务流程，仅新增同步锁；并不会影响现有网络重试、停止流、错误处理逻辑。

## 结果预期
- 控制台 `[Chat] 发送开始` 仅出现一次。
- 会话列表不再出现重复/空白会话。
- 后端仅收到一次请求。

---

> 作者：AI 助手  
> 日期：{{date}} 