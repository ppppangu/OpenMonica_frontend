# 语音识别错误处理改进设计

## 背景
当前 `ChatInput` 组件的语音识别功能在以下场景下会报错并向用户显示通用提示"语音识别出错" ：

1. 用户拒绝麦克风权限（`not-allowed`）
2. 浏览器或系统禁用了语音服务（`service-not-allowed`）
3. 设备无可用麦克风（`audio-capture` / `NotFoundError`）
4. 未检测到语音输入（`no-speech`）
5. 在非安全上下文（HTTP）下访问页面
6. 浏览器本身不支持 `SpeechRecognition`

缺少针对性提示导致用户无法快速定位并解决问题。

## 目标
1. 为常见错误场景提供**中文**的、可操作性强的提示
2. 在非 HTTPS 环境下直接阻止语音识别并告知原因
3. 统一错误映射函数，便于维护
4. 在 `navigator.mediaDevices.getUserMedia` 阶段增加权限异常与硬件缺失的区分
5. 保持对 `zh-CN` 语言的默认支持

## 技术方案
1. **错误映射函数**：新增 `getSpeechRecognitionErrorMessage(code: string)`，将 `SpeechRecognition` 错误码映射为友好的中文提示。
2. **安全上下文检查**：在调用语音识别前，通过 `window.isSecureContext` 判断，如非 HTTPS 直接提示并中断流程。
3. **权限获取增强**：
   - 使用 `navigator.mediaDevices.getUserMedia({audio:true})` 主动拉起权限弹窗。
   - 捕获异常，根据 `err.name` (`NotAllowedError`、`NotFoundError` 等) 给出具体提示。
4. **UI 反馈**：统一使用 `message.error/info` 并通过 `key: 'voice_rec'` 复用同一条提示，避免重复堆叠。
5. **回退策略**：当浏览器不支持或权限被拒绝时，不阻塞文本输入，用户仍可正常手动输入。

## 兼容性
- Chrome ≥ 33、Edge ≥ 79 完整支持。
- Safari 及部分移动浏览器暂不支持 `SpeechRecognition`，会走不支持分支并提示。

## 风险分析
- 无

## 验收标准
- 对每种错误场景能展示对应中文提示
- 在 HTTP 环境下点击语音按钮直接提示并中断
- 正常授权后可持续识别中文语音输入
- 文案符合设计 