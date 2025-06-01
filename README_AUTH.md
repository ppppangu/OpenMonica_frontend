# 智达AI - 用户认证系统

## 功能概述

本项目已集成完整的用户注册登录系统，支持邮箱注册，使用PostgreSQL数据库存储用户信息。

## 主要特性

### 🎨 界面设计
- 采用与index.html一致的设计风格
- 渐变背景和毛玻璃效果
- 响应式设计，支持移动端
- 流畅的动画效果

### 🔐 安全特性
- 密码加密存储（bcrypt）
- 邮箱格式验证
- 密码强度验证（至少8位，包含字母和数字）
- 用户名和邮箱唯一性检查

### 📊 数据库功能
- 自动检查并创建用户表
- PostgreSQL连接池管理
- 完整的错误处理

## 配置说明

### 数据库配置 (config.yaml)

```yaml
# 用户管理数据库
database:
  host: "localhost"
  port: 5432
  database: "zhida_db"
  username: "postgres"
  password: "your_password"
  
# 用户表配置
user_table:
  name: "zhida_users"
```

### 用户表结构

系统会自动创建 `zhida_users` 表，包含以下字段：

```sql
CREATE TABLE zhida_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

## 使用方法

### 1. 安装依赖

```bash
npm install pg bcrypt
```

### 2. 配置数据库

1. 安装PostgreSQL
2. 创建数据库 `zhida_db`
3. 修改 `config.yaml` 中的数据库连接信息

### 3. 启动服务器

```bash
node server.js
```

### 4. 访问页面

- 主页：http://localhost:3035
- 登录页面：http://localhost:3035/login.html

## API接口

### 用户注册
- **URL**: `POST /api/user/register`
- **参数**: 
  ```json
  {
    "username": "用户名",
    "email": "邮箱地址",
    "password": "密码"
  }
  ```

### 用户登录
- **URL**: `POST /api/user/login`
- **参数**:
  ```json
  {
    "email": "邮箱地址",
    "password": "密码"
  }
  ```

## 文件结构

```
Desktop\V2\前端\
├── login.html              # 登录注册页面
├── public\js\auth.js       # 认证相关JavaScript
├── config.yaml             # 配置文件（包含数据库配置）
├── server.js               # 服务器文件（已更新）
└── README_AUTH.md          # 本说明文档
```

## 注意事项

1. **数据库连接**: 确保PostgreSQL服务正在运行
2. **密码安全**: 生产环境请使用强密码
3. **Token管理**: 当前使用简单token，生产环境建议使用JWT
4. **错误处理**: 系统包含完整的错误处理和用户友好的提示信息

## 开发说明

### JavaScript文件组织
- 认证相关的JavaScript代码已移至 `public/js/auth.js`
- 遵循模块化开发原则
- 包含完整的表单验证和错误处理

### 样式设计
- 使用Tailwind CSS框架
- 自定义CSS动画效果
- 保持与主页面一致的设计语言

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查PostgreSQL服务是否启动
   - 验证config.yaml中的数据库配置
   - 确认数据库用户权限

2. **端口占用**
   - 使用 `netstat -ano | findstr :3035` 检查端口
   - 使用 `taskkill /f /im node.exe` 结束Node.js进程

3. **页面无法访问**
   - 确认服务器已启动
   - 检查防火墙设置
   - 验证URL地址正确性

## 后续开发建议

1. 添加JWT token认证
2. 实现密码重置功能
3. 添加邮箱验证
4. 集成第三方登录（如Google、GitHub）
5. 添加用户权限管理
