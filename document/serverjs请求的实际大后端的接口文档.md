# 用户管理服务 API 文档

## 概述

本文档描述了用户管理服务的所有API接口，包括健康检查、账户管理、聊天记录、知识库管理和用户自定义功能。

---

## 1. Health 健康检查

### 功能说明

检查服务运行状态

### 调用方式

```
GET /health
```

### 返回示例

```json
{
    "status": "ok"
}
```

---

## 2. Account 账户管理

### 功能说明

- 用户注册：创建新用户账户
- 用户删除：删除用户及其所有相关数据
- 用户信息查询：获取用户名、邮箱或密码状态
- 用户信息更新：修改用户名、邮箱或密码

### 调用方式

#### 2.1 用户注册

```
POST /user/account
Content-Type: application/x-www-form-urlencoded

mode=register
username=用户名
email=邮箱地址
password=密码
```

#### 2.2 用户登录验证

```

POST /user/account

Content-Type: application/x-www-form-urlencoded


mode=check

email=邮箱地址

password=密码

```

**成功响应示例：**

```json

{

    "success": true,

    "message": "登录成功",

    "user_info": {

        "user_id": "用户UUID",

        "username": "用户名",

        "email": "邮箱地址"

    }

}

```

**失败响应示例：**

```json

{

    "success": false,

    "message": "邮箱或密码错误"

}

```


#### 2.3 用户删除

```
POST /user/account
Content-Type: application/x-www-form-urlencoded

mode=delete
user_id=用户ID
```

#### 2.4 查询用户信息

```
POST /user/account
Content-Type: application/x-www-form-urlencoded

mode=get
user_id=用户ID
target=username|email|password
```

#### 2.5 更新用户信息

```
POST /user/account
Content-Type: application/x-www-form-urlencoded

mode=update
user_id=用户ID
target=username|email|password
new_value=新值
```

---

## 3. Chat History 聊天记录

### 功能说明

- 获取用户所有会话ID列表
- 查询特定会话聊天记录
- 删除特定会话聊天记录

### 调用方式

#### 3.1 获取所有会话ID列表

```
POST /user/chat_history
Content-Type: application/x-www-form-urlencoded

mode=get_all_list
user_id=用户ID
```

#### 3.2 查询特定会话聊天记录

```
POST /user/chat_history
Content-Type: application/x-www-form-urlencoded

mode=get_specific
user_id=用户ID
session_id=会话ID
```

#### 3.3 删除特定会话聊天记录

```
POST /user/chat_history
Content-Type: application/x-www-form-urlencoded

mode=delete_specific
user_id=用户ID
session_id=会话ID
```

---

## 4. Knowledge Base 知识库管理

### 功能说明

- 删除知识库：删除指定知识库及其所有文档
- 创建/更新知识库：创建新知识库或更新现有知识库信息
- 查询知识库列表：获取用户所有知识库列表
- 查询知识库详情：获取特定知识库的文档列表

### 调用方式

#### 4.1 删除知识库

```
POST /user/knowledgebase
Content-Type: application/x-www-form-urlencoded

mode=delete
user_id=用户ID
knowledgebase_id=知识库ID
```

#### 4.2 创建/更新知识库（用的一个接口）

```
POST /user/knowledgebase
Content-Type: application/x-www-form-urlencoded

mode=update
user_id=用户ID
knowledgebase_id=知识库ID（可选，不提供则自动生成）
name=知识库名称（可选）
description=知识库描述（可选）
```

#### 4.3 查询知识库列表

```
POST /user/knowledgebase
Content-Type: application/x-www-form-urlencoded

mode=get
target=list
user_id=用户ID
```

#### 4.4 查询知识库详情

```
POST /user/knowledgebase
Content-Type: application/x-www-form-urlencoded

mode=get
target=detail
user_id=用户ID
knowledgebase_id=知识库ID
```

---

## 5. Custom 用户自定义

### 功能说明

- 更新个性化提示词：设置或更新用户的个性化提示词
- 更新个性化记忆：设置或更新用户的个性化记忆
- 查询个性化提示词：获取用户的个性化提示词
- 查询个性化记忆：获取用户的个性化记忆

### 调用方式

#### 5.1 更新个性化提示词

```
POST /user/custom
Content-Type: application/x-www-form-urlencoded

mode=update
user_id=用户ID
target=custom_personality
new_text=新的个性化提示词内容
```

#### 5.2 更新个性化记忆

```
POST /user/custom
Content-Type: application/x-www-form-urlencoded

mode=update
user_id=用户ID
target=custom_memory
new_text=新的个性化记忆内容
```

#### 5.3 查询个性化提示词

```
POST /user/custom
Content-Type: application/x-www-form-urlencoded

mode=get
user_id=用户ID
target=custom_personality
```

#### 5.4 查询个性化记忆

```
POST /user/custom
Content-Type: application/x-www-form-urlencoded

mode=get
user_id=用户ID
target=custom_memory
```

---

## 通用响应格式示例

### 成功响应

```json
{
    "status": "success",
    "message": "操作成功描述",
    "data": "返回的数据（如果有）"
}
```

### 错误响应

```json
{
    "status": "error",
    "message": "错误描述"
}
```

---

## 注意事项

1. 所有POST请求都使用 `application/x-www-form-urlencoded` 格式
2. `user_id` 为用户的UUID格式字符串
3. 密码要求至少8位字符
4. 邮箱必须符合标准邮箱格式
5. 知识库操作会同时影响数据库和文件存储
6. 删除操作不可逆，请谨慎使用
