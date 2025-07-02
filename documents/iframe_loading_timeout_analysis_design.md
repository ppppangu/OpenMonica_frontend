# Iframe 加载超时诊断与优化 – 设计文档

## 1. 背景
用户反馈在聊天窗口渲染如下地址时，始终显示 **"加载超时（45s）"**：

```
https://8.tcp.cpolar.cn:11869/publicfiles/subserver/mindmaps/mindmap_883eed00-d13d-402f-b3f1-87a11ae8f0c6_artifacts.html
```

其特点：
1. 该域名由 **cpolar TCP 隧道** 映射到 MinIO `9000` 端口，属于"**非 80/443** + **动态二级域名**"场景。
2. 资源大小未知，且服务器未启用 HTTPS 证书（客户端自行使用 `https://` scheme 访问）。
3. 直接在浏览器标签页中访问同样会卡顿或无法打开。

## 2. 现有实现回顾
```12:34:src/utils/streamingUtils.ts
// Markdown 预处理：<http(s)://...> → safe-iframe-wrapper
```
```80:190:src/components/chat/ChatMessage.tsx
// useEffect 内部：根据 data-src 创建 iframe，45s 超时
```
核心流程：
1. Markdown 转 HTML 时把裸链接包进 `div.safe-iframe-wrapper[data-src]`，初始子元素为 Loading。
2. `ChatMessage` 在渲染后对 wrapper 执行初始化：
   - 若页面为 `https:` 且 url 为 `http:`，自动拼接 `/proxy?url=` 以避免 **Mixed-Content**。
   - 创建 `<iframe sandbox="allow-scripts allow-same-origin">`，加载完毕/报错/超时后切换 UI。
3. 服务器 `/proxy` 路由使用 `axios.get(target, { responseType:'stream' })` 透传，并附带 `CSP: sandbox allow-scripts allow-same-origin`。

## 3. 复现现象
- 直接访问：**浏览器长时间 TLS 握手** → ERR_CONNECTION_TIMED_OUT。
- Iframe 渲染：45s 后前端定时器触发，显示"加载超时"。
- 使用 `/proxy?url=...`（后端）也会卡住，Node 进程日志打印 `ECONNREFUSED` 或 `ETIMEDOUT`。

## 4. 成因分析
| 潜在因素              | 结论 | 说明                                                                                                                                                       |
| --------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mixed-Content         | ❌    | URL 已用 https，不会触发混合内容阻断。                                                                                                                     |
| 非标准端口            | ✅    | 11869 端口在部分公司/校园网、防火墙默认被丢弃或重置；云函数/云服务器出网也可能被禁。                                                                       |
| TLS / 证书            | ✅    | cpolar TCP 隧道本质是"**原始 TCP 流量透传**"，若后端是 **HTTP 明文** 而客户端用 `https://`，会在 TLS 握手阶段直接超时。                                    |
| CORS                  | ❌    | iframe 本身不依赖 CORS，仅影响与子窗口的 JS 交互。                                                                                                         |
| X-Frame-Options / CSP | ❌    | 未能走到应用层，连 TCP/TLS 都没握手成功。                                                                                                                  |
| MinIO 配置            | ⚠️    | 若走 HTTP (`http://8.tcp.cpolar.cn:11869/...`) 则可能命中 Mixed-Content，被前端自动切换至 `/proxy`。但 proxy 端 axios 依旧需直连 11869，前述端口问题仍在。 |

**根因：请求未进入应用层，80% 可能是"访问者到 11869 端口的网络链路不可达 or 协议握手不匹配"**。

## 5. 解决方案候选
1. **统一走代理再降级到 HTTP**
   - 新增域名/端口白名单 `ALWAYS_PROXY_HOSTS`（如 `*.tcp.cpolar.cn:*`）。
   - 若命中则：
     1. 强制把 url scheme 改为 `http://`（MinIO 默认明文）。
     2. 前端始终以 `/proxy?url=` 请求，避免 Mixed-Content 且复用现有流量通道。
2. **后端 proxy 改进**
   - `axios`→`http(s).request` 手动管理，移除默认 **0ms socketTimeout**，设置 `timeout: 30000`。
   - 将 `MAX_PROXY_SIZE` 提升至 `200MB`（MinIO 导出的 HTML + 静态资源可能很大）。
   - 移除响应头 `Content-Security-Policy: sandbox ...`，改为 **最小权限 CSP**，避免再次"全沙箱"导致脚本无法运行。
3. **前端 UI 优化**
   - Loading ⏳ 提示改为 `skeleton + 进度条`。
   - 超时阈值可配置，面向大型文件调到 90s。
   - `showError()` 提示文案增加"请确认隧道在线并允许访问端口 11869"。
4. **DevOps / 网络侧**
   - 若必须使用 TLS，可在 **隧道入口层**（如 Nginx、Cloudflare Tunnel）做 **TLS 终结**，后端转发到 MinIO HTTP。
   - 或直接买专业版 cpolar，开 **HTTP 隧道**，分配 443 子域名 → 彻底摆脱端口与协议不匹配。

## 6. 详细实施步骤
| 步骤 | 模块                                  | 关键改动                                                                                    |
| ---- | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1    | `documents`                           | 撰写本设计文档 & Checklist ✅                                                                |
| 2    | `src/components/chat/ChatMessage.tsx` | 在初始化时若 `hostname.endsWith('.cpolar.cn')` 且 `:port` 非 80/443 → `forceProxy = true`。 |
| 3    | `server.cjs`                          | a) 调整 `MAX_PROXY_SIZE`，b) 自定义 `axios` 超时，c) 精简 CSP。                             |
| 4    | 集成测试                              | 新增 Playwright 用例：模拟 iframe 加载 cpolar 资源，断言能在 90s 内渲染完成。               |
| 5    | 交付文档                              | 更新 README & 部署说明。                                                                    |

## 7. 风险评估
- **破坏现有 /proxy 行为**：需在测试环境充分验证大文件、长链路。
- **安全**：放宽 CSP 可能被恶意页面执行脚本，需在前端 `sandbox` 权限维持 `allow-scripts` 最小。
- **性能**：大文件透传占用带宽；考虑 gzip / brotli 压缩。|

---
作者：
日期： 