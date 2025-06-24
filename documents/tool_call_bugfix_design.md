## 3-A. 全链路超时排查表
| 层级                  | 默认超时                       | 排查命令 / 参考配置         | 可能症状                                            | 建议值                               |
| --------------------- | ------------------------------ | --------------------------- | --------------------------------------------------- | ------------------------------------ |
| 浏览器 Fetch          | 300 s（Chromium）              | DevTools > Network          | 前端触发 `TypeError: Timeout`，但本例多为服务端断连 | ⬆︎到 5 min 以上（默认够用）           |
| Vite dev-proxy        | `proxyTimeout=120 000`         | `vite.config.js` 中 `proxy` | 开发环境 2 min 后 502                               | 同步调高                             |
| Nginx / Traefik       | `proxy_read_timeout 60s;`      | `grep proxy_read_timeout`   | 60 s 静默后 499/502                                 | 90 s-5 min；+ `proxy_send_timeout`   |
| CDN / LB (Cloudflare) | 100 s (enterprise 600 s)       | Dash > Rules                | 524 A Timeout Occurred                              | 100-600 s，或走无代理直连            |
| Node.js `http.Server` | `server.headersTimeout` 60 000 | `server.timeout`            | ECONNRESET (<60 s)                                  | `server.headersTimeout = 0` 或 5 min |
| Express / Nest SSE    | 无，但需持续 `res.write()`     | 若无数据自行 close          | 每 25 s `data: {"ping":1}`                          |
| 上游 AI Provider      | OpenAI 600 s                   | --                          | finish_reason=null 且 no chunk                      | 分段流 or tool server 侧缓冲         |

> 从日志看 `ECONNRESET` ~65 s，**高度怀疑 Nginx 60 s idle 断连**。

### 调整示例（Nginx）
```nginx
location /user/chat {
    proxy_pass              http://backend;
    proxy_http_version      1.1;
    proxy_set_header        Connection keep-alive;

    # 延长 SSE 空闲时间
    proxy_read_timeout      3600s;   # 1h
    proxy_send_timeout      3600s;
    proxy_connect_timeout   60s;
}
```

### 后端 keep-alive 片段（Node）
```ts
setInterval(() => {
  res.write('data: {"ping":1}\n\n');
}, 25_000);
```

## 4. 方案（更新）
...（保留原内容） 