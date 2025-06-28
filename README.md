## 📄 页面说明

### 1. index.html - 主聊天界面

### 2. settings.html - 设置页面

- 用户提示词表单
- 模型记忆表单
- 通用设置表单

### 3. help.html - 帮助页面

### 4. knowledgebase.html - 知识库管理

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
