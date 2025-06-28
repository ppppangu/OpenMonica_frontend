# AI Chat Interface - 静态版本

这是一个简化的AI聊天界面，已移除所有JavaScript脚本，只保留基本的HTML结构和组件完整性。

## 📁 项目结构

```
前端/
├── index.html          # 主聊天界面
├── settings.html       # 设置页面
├── help.html          # 帮助页面
├── knowledgebase.html  # 知识库管理页面
├── basedetail.html    # 知识库详情页面
├── home.html          # 用户账户页面
├── login.html         # 登录页面
├── styles.css         # 统一样式文件
├── server.js          # 基本Express服务器
├── package.json       # 项目配置
└── README.md          # 项目说明
```

## ✨ 主要特性

### 🎨 保持的组件完整性

- **侧边栏导航** - 所有页面保持一致的侧边栏设计
- **表单结构** - 所有表单都转换为标准HTML表单
- **页面布局** - 保持原有的视觉设计和布局
- **样式系统** - 继续使用Tailwind CSS和Material Icons

### 🔄 简化的功能

- **静态导航** - 使用HTML链接代替JavaScript路由
- **标准表单** - 所有交互都通过HTML表单提交
- **移除脚本** - 删除所有Vue.js、React和自定义JavaScript
- **统一样式** - 所有CSS整合到单个styles.css文件
- **保留样式** - 保持所有CSS样式和视觉效果

## 📄 页面说明 

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

## 🌐 环境要求

本项目推荐使用 **Node.js 22** 和 **npm 11**。可通过 `node -v` 和 `npm -v` 查看本地版本。

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
