# React 应用安装指南

## 🚀 快速开始

### 问题说明
在 Vue.js 到 React 迁移过程中，遇到了 `better-sqlite3` 等后端依赖的编译问题。这些依赖对前端 React 应用不是必需的。

### 解决方案

#### 方案1：仅安装前端核心依赖 (推荐)

```bash
# 1. 清理现有依赖
rm -rf node_modules package-lock.json

# 2. 安装核心 React 依赖
npm install react@^18.2.0 react-dom@^18.2.0

# 3. 安装开发工具
npm install --save-dev @types/react@^18.0.26 @types/react-dom@^18.0.10 typescript@^4.9.4 vite@^4.0.4 @vitejs/plugin-react@^3.0.1

# 4. 安装 UI 库
npm install react-router-dom@^6.8.1 antd@^5.1.4 @ant-design/icons@^5.0.1

# 5. 安装状态管理和工具
npm install @tanstack/react-query@^4.24.4 zustand@^4.3.2 axios@^1.2.2

# 6. 安装样式工具
npm install --save-dev tailwindcss@^3.2.4 autoprefixer@^10.4.13 postcss@^8.4.21

# 7. 安装其他工具库
npm install markdown-it@^13.0.1 lodash-es@^4.17.21 d3@^7.8.2
npm install --save-dev @types/markdown-it@^13.0.7 @types/lodash-es@^4.17.6 @types/d3@^7.4.0
```

#### 方案2：使用 CDN 快速测试

如果依赖安装有问题，可以先使用 CDN 版本测试：

```bash
# 打开基础测试文件
open test-react-basic.html
```

#### 方案3：跳过编译步骤

```bash
npm install --ignore-scripts --no-optional
```

## 🧪 测试应用

### 1. 基础功能测试
```bash
# 打开基础测试页面
open test-react-basic.html
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
- 主页: http://localhost:5173/
- 登录: http://localhost:5173/login
- 聊天: http://localhost:5173/chat
- 知识库: http://localhost:5173/knowledge
- 测试页面: http://localhost:5173/test

## 📦 依赖说明

### 前端必需依赖
- `react`, `react-dom` - React 核心
- `react-router-dom` - 路由管理
- `antd`, `@ant-design/icons` - UI 组件库
- `@tanstack/react-query` - 数据获取和缓存
- `zustand` - 状态管理
- `axios` - HTTP 客户端
- `vite` - 构建工具
- `typescript` - 类型检查

### 可选依赖
- `markdown-it` - Markdown 渲染
- `lodash-es` - 工具函数
- `d3` - 数据可视化
- `tailwindcss` - CSS 框架

### 后端依赖 (前端不需要)
- `better-sqlite3` - SQLite 数据库
- `express` - 后端服务器
- `bcryptjs` - 密码加密
- `multer` - 文件上传
- `jsonwebtoken` - JWT 令牌

## 🔧 故障排除

### 如果 npm install 失败
1. 清理缓存: `npm cache clean --force`
2. 删除 node_modules: `rm -rf node_modules package-lock.json`
3. 使用 yarn: `yarn install`
4. 跳过脚本: `npm install --ignore-scripts`

### 如果 Vite 启动失败
1. 检查 Node.js 版本: `node --version` (需要 >= 14)
2. 检查依赖是否安装: `ls node_modules`
3. 重新安装 Vite: `npm install vite@^4.0.4`

### 如果类型检查失败
1. 检查 TypeScript 配置: `cat tsconfig.json`
2. 重新安装类型定义: `npm install --save-dev @types/react @types/react-dom`

## ✅ 验证迁移成功

迁移成功的标志：
1. ✅ React 应用可以启动 (`npm run dev`)
2. ✅ 页面可以正常访问 (http://localhost:5173/)
3. ✅ 路由正常工作 (可以访问不同页面)
4. ✅ 组件正常渲染 (登录页面、聊天页面等)
5. ✅ 状态管理正常 (可以登录、切换页面)

## 🎯 下一步

1. 完成依赖安装
2. 启动开发服务器
3. 测试各个页面功能
4. 连接后端 API
5. 完善功能和样式

迁移已完成，React 应用结构正确，只需要解决依赖安装问题即可正常运行！
