# ChatInput 语音输入功能设计

## 1. 需求
现有语音按钮仅提示"开发中…"，需接入真实语音识别，支持中文普通话，将识别结果写入输入框。

## 2. 技术方案
- 使用浏览器原生 **Web Speech API** (`window.SpeechRecognition` / `webkitSpeechRecognition`)。
- 点击按钮：
  1. 检测浏览器兼容性。
  2. 若已在监听，再次点击停止识别。
  3. 未在监听则初始化 `SpeechRecognition`，设置参数：
     - `lang = 'zh-CN'`
     - `continuous = false`
     - `interimResults = false`
  4. 监听事件：
     - `onstart`：UI 反馈，按钮高亮。
     - `onresult`：拼接转写内容到 `inputValue`。
     - `onerror` / `onend`：重置状态、销毁提示。
- UI：按钮在录音时 `primary + danger`，图标 `animate-pulse text-red-500`。

## 3. 代码修改
文件：`src/components/chat/ChatInput.tsx`
1. 新增状态 `isListening`、`recognitionRef`。
2. 新增 `startVoiceRecognition()` 方法。
3. 修改按钮 `onClick` / 图标动画。

## 4. 兼容性
- 仅在支持 Web Speech API 的 Chromium / Safari 启用。
- 不支持时弹出错误提示。

## 5. 验证
1. Chrome 116+，点击语音按钮说话 -> 文本框填充识别文字。
2. 再次点击停止，或说完自动结束。
3. Edge (Chromium) 同样可用。
4. Firefox 下提示不支持。

---
负责人：AI
日期：{{DATE}} 