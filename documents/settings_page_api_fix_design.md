# 设置页面 API 错误修复 设计文档

## 1. 问题概述

| 编号 | 现象                                                                                                  | 影响                 |
| ---- | ----------------------------------------------------------------------------------------------------- | -------------------- |
| P1   | 修改用户名 / 邮箱后，前端抛出 `Failed to execute 'json' on 'Response': Unexpected end of JSON input`  | 用户无法更新基本信息 |
| P2   | 修改密码时返回 `500 Internal Server Error - {"success":false,"message":"服务器内部错误，请稍后重试"}` | 无法修改密码         |

## 2. 根本原因分析

1. **后端响应格式不一致 / 空响应**
   * 本地 `simple-server.cjs` 的 `/user/account` 仅实现了 `check`(登录) 逻辑。
   * 当前端以 `mode=update` 发送请求时，服务返回 200 + 空 body，`Content-Type` 仍为 `application/json`，导致 `response.json()` 解析失败。
2. **密码更新缺少对应分支**
   * `mode=update & target=password` 在后端未实现，Express 进入默认 `else` 分支并抛出 500。
3. **返回字段命名不统一**
   * 真实后端使用 `{ "status": "success" }`，而模拟服务使用 `{ "success": true }`。
   * `updateUserInfo` 仅检查 `result.status === 'success'`，导致本地调试时总是进入报错分支。
4. **错误处理过于严格**
   * `handleApiResponse` 对于空 body + `Content-Type: application/json` 情况未做兼容。

## 3. 解决方案

### 3.1 后端（模拟服务）

1. 在 `/user/account` 路由中加入 `update` 分支：
   * 根据 `target` 字段更新 `username` / `email` / `password`。
   * 统一返回 `{ status: 'success', message: 'update user xxx success' }`。
2. 解决 500：当 `target === 'password'` 时校验 `new_value` 长度 ≥ 6 后直接返回成功。

### 3.2 前端

1. **容错改进** `handleApiResponse`
   * 对 `204` 或空 body 时直接返回 `undefined` 而不是强制解析 JSON。
2. **统一状态判断**
   * `updateUserInfo` 同时兼容 `result.status==='success'` 或 `result.success===true`。

### 3.3 测试方案

| 场景                          | 预期                                  |
| ----------------------------- | ------------------------------------- |
| 修改用户名 / 邮箱             | Toast 提示 "更新成功"，刷新后数据保持 |
| 新密码 & 确认密码一致且 ≥6 位 | Toast 提示 "密码修改成功"             |
| 新密码长度 <6                 | 前端表单直接阻止提交                  |

## 4. 任务拆分

1. 更新设计文档（当前步骤）
2. 新建 checklist
3. **后端**：修改 `simple-server.cjs`，实现 `update` 分支 & 统一响应格式
4. **前端**：改进 `handleApiResponse`
5. **前端**：调整 `updateUserInfo` 状态判断
6. 本地手动测试三大场景
7. 更新 checklist 状态

## 5. 兼容性 & 风险

* 仅影响本地开发服务器，不改动线上真实后端。
* `handleApiResponse` 兼容空响应，对其他接口无破坏性影响。 