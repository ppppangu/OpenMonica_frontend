# Robust Iframe Component – Design Document

## 背景

当前系统在渲染外部链接时会直接在 Markdown 中插入一个纯 `<iframe>`。对于不少站点（如 `http://` 协议、`X-Frame-Options: SAMEORIGIN`、CORS 限制、加载超时等）会导致浏览器直接返回通用报错页，体验不佳。

## 目标
1. **协议处理**：当页面本身以 `https://` 服务，而待嵌入的地址使用 `http://` 时（混合内容），及时提示并尝试自动切换到 `https://`。  
2. **错误检测与兜底**：检测 `load/error` 事件 + 定时器双保险，若连接失败或超时，给予用户友好的错误提示并提供『新标签打开』链接。  
3. **CORS / X-Frame-Options 检测**：当 `load` 事件触发但内容仍空白时，尝试 `contentWindow.location` 读取，若抛出跨域异常则判定为 `SAMEORIGIN` or `DENY`，提示"站点禁止内嵌"。  
4. **Loading 状态 & 超时**：统一 15 s 超时；加载期间展示骨架/Spinner。  
5. **代理方案**：对于明确禁止 http->https 且无法内嵌的站点，提供『通过代理打开』按钮（先简单拼接 `https://r.jina.ai/http://` 协议或可配置代理前缀，后期可扩展）。  
6. **统一封装**：新增 `SafeIframe` 组件（纯 DOM 注入版本，兼容现有 Markdown 流程），并在 `ChatMessage` 的 `useEffect` 中对生成的 wrapper 做事件绑定。  
7. **代理响应 CSP SandBox 过度限制问题**：

### 问题描述
当前 `/proxy` 路由为了避免代理到恶意脚本，在响应头统一添加了

```
Content-Security-Policy: sandbox
```

该指令等同于 **无参数的 `sandbox`**，浏览器会默认屏蔽脚本执行、表单提交以及同源特权，
从而导致即便前端在 `<iframe sandbox="allow-scripts allow-same-origin">` 中放宽了权限，
依旧因为**响应级 CSP**被再次"全量封禁"，导致部分静态 HTML（依赖脚本渲染、或需读取 Cookie 的页面）
呈现空白。

### 修复思路
1. **下放安全控制给 iframe 标签**：服务器不再全局施加 `sandbox`，而是让前端按需在 `iframe` 标签上设置所需权限。
2. **最小化 CSP**：若必须携带 CSP，可改为：

   ```http
   Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; frame-ancestors *;
   ```

   既阻止脚本执行，又避免 `sandbox` 带来的同源隔离；并通过 `frame-ancestors *` 允许被任何页面内嵌。
3. **细粒度 Token**：若仍希望继续使用 `sandbox`，应显式加上所需 token，例如：

   ```http
   Content-Security-Policy: sandbox allow-scripts allow-same-origin;
   ```

### 具体改动（server.cjs & simple-server.cjs）
- 删除或替换 `res.set('Content-Security-Policy', 'sandbox')`。
- 可增加白名单 / 长度限制等防护，保持其它安全头不变。

## 方案概述

### 1. Markdown 预处理阶段
- 原先正则 `<(https?:\/\/[^>]+)>` 直接替换为 `<iframe ...>`。改为包装：
  ```html
  <div class="safe-iframe-wrapper" data-src="{url}">
    <div class="safe-iframe-loading">加载中…</div>
    <!-- 真实 iframe 在 JS 中按需插入，避免浏览器马上因为混合内容报错 -->
  </div>
  ```
- 使用 `data-src` 保存原始地址，真正的 `<iframe>` 由脚本延迟加载，便于我们先做协议判断。

### 2. 前端逻辑 (`ChatMessage.tsx`)
1. 在 `useEffect` 中选取 `.safe-iframe-wrapper`：
   - 读取 `data-src` 为 `src`。
   - 若 `window.location.protocol === 'https:' && src.startsWith('http:')`：
     - 尝试将协议改为 `https:`，使用 `fetch` HEAD 请求验证（忽略 CORS，失败则回退）。
   - 创建 `<iframe>` 元素，设置 `sandbox`, `referrerPolicy`, `allow` 等属性。
   - 插入到 wrapper，挂载事件：
     - `load`：隐藏 loading；若无法访问 `contentWindow` → 显示跨域/禁止内嵌提示。
     - `error`：显示错误提示。
   - 启动 15 s `setTimeout`，若未触发 `load` 则显示超时提示。

### 3. 样式 (`index.css`)
- `.safe-iframe-wrapper`：`@apply relative w-full h-[300px] border border-gray-200 rounded`。
- `.safe-iframe-loading, .safe-iframe-error` 绝对定位覆盖；使用 `flex` 居中文本。

### 4. 代理/外链
- 在错误提示中附带两个按钮：
  1. **新标签页打开**：`target="_blank"`。
  2. **代理访问**：`https://cors.isomorphic-git.org/{encodedUrl}` （后期可配置）。

### 5. 兼容性考虑
- `load` 事件在 `X-Frame-Options` 拒绝时依旧会触发，所以需要额外通过 `try { iframe.contentWindow.location.href }` 检测。
- IE 不支持；项目本身已定位现代浏览器。

### 6. 单元/集成测试
- 通过 Vitest/Playwright（后续补充）验证：
  1. `https://example.com` 正常显示。
  2. `http://httpbin.org` 在 https 环境下触发混合内容提示。
  3. `https://mindmap.ai` → SAMEORIGIN 提示。
  4. 设定 mock 延迟 >15 s 的地址 → 超时提示。

## 迭代计划
1. **文档&Checklist**（当前步骤）
2. **实现 Markdown 注入调整 + 样式**
3. **实现 `ChatMessage` 逻辑**
4. **集成测试脚本**
5. **完善代理配置**

---
作者：
日期： 