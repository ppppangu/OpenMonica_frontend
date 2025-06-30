# Chat Page Six Issues Fix Design

> 文件位置: `documents/chat_page_fixes_design.md`

## 目标

本文档针对用户提出的 Chat 页面 6 项改进需求, 给出技术方案与受影响范围, 以指导后续实施与回归测试。

| #   | 问题                                     | 解决方案摘要                                                                                                                                                               |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 代码块渲染存在语言标签 & Mermaid 报 WARN | 修改 `streamingUtils.ts` 的 `highlight` 逻辑, 去除 `figcaption` 语言标签; 在 `ChatMessage` 中跳过 `language-mermaid` 的 `highlightElement`, 同时保持 `mermaid.init` 渲染。 |
| 2   | Markdown 图片被 CSP 限制                 | 在 `markdownToHtml` 渲染后统一为 `<img>` 注入 `referrerpolicy="no-referrer"` `crossorigin="anonymous"` `loading="lazy"` 等属性, 减少跨域与 Referrer 限制。                 |
| 3   | 侧边栏背景色需要纯白                     | `MainLayout.tsx` Sider 已使用 `bg-white`, 保持一致, 无需额外修改; 若样式被覆盖, 通过 Tailwind 类优先级保证白色。                                                           |
| 4   | 用户头像与底部间距不足                   | 给侧边栏用户信息容器添加 `mt-auto mb-4`, 保证永远贴底并预留 16px 间距。                                                                                                    |
| 5   | 代码块语法高亮校验                       | `highlight` 渲染只输出 `<pre><code>` 结构, 移除多余 figure/header; 仍保留 `language-*` class 供 highlight.js 使用。                                                        |
| 6   | hide_tool_name 配置支持                  | 在启动时 (App.tsx) 加载 `config.yaml`, 注入 `window.__APP_CONFIG`. `streamingUtils.renderSegmentsToHtml` 与 `ChatMessage` 根据该配置隐藏工具名。                           |

## 受影响文件

* `src/utils/streamingUtils.ts`
* `src/components/chat/ChatMessage.tsx`
* `src/components/layout/MainLayout.tsx`
* `src/App.tsx`
* `index.css` (若需补充样式)

## 回滚方案

保留 git 提交, 如出现渲染异常直接回退 commit 即可。 