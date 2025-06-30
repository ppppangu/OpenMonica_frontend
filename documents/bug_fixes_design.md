# 7 个前端 Bug 修复设计文档

> 文件位置：`documents/bug_fixes_design.md`

## 目标

在 React + TypeScript 前端代码中一次性修复下列 7 个问题，并在完成后确保所有页面功能正常、控制台无报错：

1. 注册页面失败（Ant Design `message` 静态调用导致上下文异常）
2. 聊天模式三选项 UI 需改为下拉/折叠式展示
3. DeepResearch 独立配置并作为提示词注入后台请求
4. 文件上传气泡多出 "xt" 字符
5. 快捷提示词按钮完全由 `config.yaml` 动态生成
6. 聊天页长回复时左侧菜单置顶遮挡内容
7. HTTPS 域名强制跳转/说明

---

## 问题 & 修复思路

### 1. 注册页面失败
* **现象**：控制台 `Warning: [antd: message] Static function can not consume context like dynamic theme.`，导致注册接口正常返回后无法跳转。
* **原因**：静态 `message.xxx()` 无法注入 React Context，新版 Ant Design 建议用 `App.useApp()` 获得实例。
* **方案**：
  1. 在所有使用 `message` 的页面（`AuthPage` / `SettingsPage` / `KnowledgeBasePage` 等）去掉 `import { message }`。
  2. 改为 `const { message } = App.useApp()`。
  3. 确认注册成功回调逻辑正常。

### 2. 聊天模式三选项 UI
* **现象**：`智能模式/纯知识库/纯联网搜索` 使用 Radio.Group 且展开占位；需折叠式体验。
* **方案**：
  * 重写 `components/chat/KnowledgeSourceSelect.tsx` → 使用 Ant Design `Select`（或 `Collapse`）组件；UI 与模型下拉保持一致。

### 3. DeepResearch 独立配置
* **需求**：DeepResearch 与 prompt buttons 类似但放开关；配置单独键。
* **方案**：
  1. 在 `config.yaml` 根级增加 `deep_research_prompt`。
  2. `ChatInput` 加载该字段至 `deepResearchPrompt` 状态。
  3. 当开关打开时，在 `handleSend` 内把 `deepResearchPrompt` 拼接到最终 `finalContent` 前。

### 4. 文件上传气泡 "xt" 字符
* **现象**：附件列表折叠后，气泡尾端出现无意义的 `xt`。
* **原因**：旧格式附件块清理时偏移量错误，残留了文件扩展名最后两个字符。
* **方案**：
  * 修正 `utils/parseAttachments.ts` 中旧格式 `stripped` 计算，只保留附件块前文本。

### 5. 动态 prompt 按钮
* **现象**：按钮数量与 `config.yaml` 不一致。
* **方案**：
  * 现有 `ChatInput` 已 `setPromptButtons`; 添加断言过滤，仅保留 `typeof value === 'string'` 的键值对。
  * 加入依赖 `prompt_buttons` 长度变化自动刷新。

### 6. 聊天长回复遮挡侧边栏
* **现象**：内容滚动到顶部时左侧菜单栏仍固定在可视区域，影响阅读。
* **方案**：
  * 给菜单容器 `overflow-y-auto`；同时在 `Content` 区域增加 `overflow-y-auto h-full`，并确保最外层 `Layout` 设置 `min-h-screen`。

### 7. HTTPS 子域名直接访问问题
* **说明**：浏览器访问 `https://xxx.cpolar.cn` 正常，直接 `xxx.cpolar.cn` 失败。
* **方案**：
  * 在前端通过 `window.location.protocol !== 'https:'` 判断并重定向到 `https`；
  * 或说明需在服务器/域名解析层做 301 重定向（NGINX `return 301 https://$host$request_uri;`）。

---

## 里程碑
1. 创建设计文档与检查清单
2. 修复 Bug1（注册）
3. 修复 Bug2（模式 UI）
4. 修复 Bug3（DeepResearch）
5. 修复 Bug4（文件气泡）
6. 修复 Bug5（动态按钮）
7. 修复 Bug6（布局）
8. 输出 Bug7 说明
9. 回归测试 & checklist 更新 