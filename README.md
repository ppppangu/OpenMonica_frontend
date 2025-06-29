# AI Chat Interface - React版本

这是一个现代化的AI聊天界面，使用React 18 + TypeScript + Vite技术栈构建，提供完整的聊天、知识库管理和文件处理功能。

## 📁 项目结构

```text
前端/
├── index.html                    # React应用入口
├── src/
│   ├── main.tsx                  # React应用主入口
│   ├── App.tsx                   # 主应用组件
│   ├── pages/                    # 页面组件
│   │   ├── LoginPage.tsx         # 登录页面
│   │   ├── ChatPage.tsx          # 聊天页面
│   │   ├── KnowledgeBasePage.tsx # 知识库页面
│   │   ├── SettingsPage.tsx      # 设置页面
│   │   └── HelpPage.tsx          # 帮助页面
│   ├── components/               # 可复用组件
│   │   ├── layout/               # 布局组件
│   │   ├── chat/                 # 聊天相关组件
│   │   ├── knowledgebase/        # 知识库组件
│   │   └── file/                 # 文件管理组件
│   ├── stores/                   # Zustand状态管理
│   │   ├── authStore.ts          # 用户认证状态
│   │   ├── chatStore.ts          # 聊天状态
│   │   ├── knowledgeBaseStore.ts # 知识库状态
│   │   └── fileStore.ts          # 文件管理状态
│   ├── hooks/                    # React Hooks
│   │   ├── useAuth.ts            # 认证相关hooks
│   │   └── useApi.ts             # API相关hooks
│   └── utils/                    # 工具函数
│       ├── api.ts                # API工具
│       └── streamingUtils.ts     # 流式处理工具
├── server.js                     # Express代理服务器
├── package.json                  # 项目配置
├── vite.config.js               # Vite配置
├── tailwind.config.js           # Tailwind CSS配置
└── README.md                    # 项目说明
```

## ✨ 主要特性

### 🚀 现代化技术栈

- **React 18** - 最新的React版本，支持并发特性
- **TypeScript** - 静态类型检查，提升开发体验和代码质量
- **Vite** - 快速的构建工具，支持热模块替换
- **Ant Design** - 企业级UI组件库
- **Tailwind CSS** - 原子化CSS框架
- **Zustand** - 轻量级状态管理
- **TanStack Query** - 强大的数据获取和缓存库

### 🎯 核心功能

- **智能对话** - 支持流式响应、工具调用、多模型选择
- **知识库管理** - 文档上传、知识图谱可视化、智能搜索
- **文件处理** - 多格式文件上传、预览、分类管理
- **用户认证** - 安全的登录注册、会话管理
- **响应式设计** - 适配各种屏幕尺寸
- **实时通信** - SSE流式数据传输

### 🔧 开发特性

- **组件化架构** - 模块化、可复用的组件设计
- **类型安全** - 完整的TypeScript类型定义
- **状态管理** - 统一的状态管理和数据流
- **API集成** - 完整的后端API集成
- **测试支持** - 内置测试工具和示例

## 📄 功能说明

### 1. index.html - 主聊天界面

- 简化的聊天输入表单
- 静态的工具栏和模型选择
- 保持原有的视觉设计

### 2. settings.html - 设置页面

- 用户提示词表单
- 模型记忆表单
- 通用设置表单

### 3. help.html - 帮助页面

- 静态帮助内容
- 保持导航结构

### 4. knowledgebase.html - 知识库管理

- 纯知识库管理界面（已移除聊天框）
- 静态知识库卡片展示
- 新建知识库功能

### 5. basedetail.html - 知识库详情

- 知识库详情页面，显示具体知识库内容
- 左侧文档列表，右侧PDF文档查看器
- 支持文档搜索、上传和管理功能

### 6. home.html - 用户账户

- 个人信息表单
- 密码管理表单
- 偏好设置表单

### 6. signin.html - 登录页面

- 登录表单
- 导航到注册页面

### 7. signup.html - 注册页面

- 注册表单
- 导航到登录页面

## 🚀 使用方法

### 🐧 Linux (Ubuntu) 环境准备

在Ubuntu系统上运行此项目，需要先安装以下依赖：

```bash
# 更新包管理器
sudo apt update

# 安装Node.js和npm
sudo apt install nodejs npm

# 验证安装
node --version
npm --version

# 如果需要最新版本的Node.js，可以使用NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装构建工具（某些npm包可能需要）
sudo apt install build-essential

# 安装Python（某些npm包编译时需要）
sudo apt install python3 python3-pip

# 可选：安装Git（如果需要克隆项目）
sudo apt install git
```

### 方式一：Express服务器（推荐）

```bash
# 安装依赖
npm install

# 启动服务器
npm start

# 访问 http://localhost:3000
```

### 方式二：直接打开

```bash
# 直接在浏览器中打开任意HTML文件
open index.html
```

### 方式三：其他本地服务器

```bash
# 使用Python简单服务器
python -m http.server 8000

# 或使用Node.js serve
npx serve .

# 然后访问 http://localhost:8000
```

## 🖥️ 服务器特性

### Express服务器功能

- **静态文件托管** - 自动托管所有HTML、CSS文件
- **路由支持** - 支持干净的URL路径（如 `/settings` 而不是 `/settings.html`）
- **表单处理** - 基本的API端点用于表单提交
- **控制台日志** - 显示所有表单提交的数据
- **404处理** - 自动重定向到登录页面

### 可访问的页面

- `http://localhost:3000/` - 登录页面（signin.html）
- `http://localhost:3000/signin` - 登录页面
- `http://localhost:3000/signup` - 注册页面
- `http://localhost:3000/index` - 主聊天界面（index.html）
- `http://localhost:3000/settings` - 设置页面
- `http://localhost:3000/help` - 帮助页面
- `http://localhost:3000/knowledgebase` - 知识库管理
- `http://localhost:3000/basedetail` - 知识库详情
- `http://localhost:3000/home` - 用户账户
- `http://localhost:3000/login` - 登录页面（重定向到signin）

## 📋 表单端点

所有表单都配置了相应的API端点：

- **聊天**: `POST /api/chat`
- **用户设置**: `POST /api/settings/*`
- **用户认证**: `POST /api/auth/*`
- **用户资料**: `POST /api/user/*`

## 🎯 设计原则

### 1. **简化优先**

- 移除所有复杂的JavaScript逻辑
- 保持最基本的HTML结构
- 使用标准表单提交

### 2. **组件完整性**

- 保持所有视觉组件的完整性
- 维持一致的设计语言
- 确保用户体验的连贯性

### 3. **易于理解**

- 代码结构清晰简单
- 适合初学者学习
- 便于本地或局域网使用

## 🔧 自定义

### 修改样式

- 所有样式都使用Tailwind CSS类
- 可以直接修改HTML中的class属性
- 保持响应式设计

### 添加功能

- 可以添加简单的JavaScript增强
- 建议保持轻量级的实现
- 避免复杂的框架依赖

### 后端集成

- 所有表单都已配置action属性
- 可以直接连接到后端API
- 支持标准的HTTP表单提交

## 📝 注意事项

1. **无JavaScript依赖** - 项目不依赖任何JavaScript框架
2. **静态资源** - 所有外部资源都通过CDN加载
3. **表单提交** - 需要后端服务器处理表单数据
4. **浏览器兼容** - 支持所有现代浏览器

## 🤝 贡献

欢迎提交问题和改进建议！

## 📄 许可证

MIT License
