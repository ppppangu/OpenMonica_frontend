# 项目文件结构说明

## 📁 目录结构

```
Desktop\V2\前端\
├── public/                    # 静态资源目录
│   ├── css/                  # 样式文件
│   │   └── common.css        # 公共样式
│   ├── js/                   # JavaScript文件
│   │   ├── common.js         # 公共功能和工具函数
│   │   ├── components/       # 可复用组件
│   │   │   └── model-selector.js  # 模型选择器组件
│   │   └── pages/            # 页面特定脚本
│   │       ├── home.js       # 首页脚本
│   │       └── chat.js       # 聊天页脚本
│   ├── images/               # 图片资源（待添加）
│   └── libs/                 # 第三方库（待添加）
├── views/                    # HTML页面
│   ├── index.html            # 首页
│   └── chat.html             # 聊天页
├── server.js                 # Node.js服务器
├── config.yaml               # 配置文件
├── package.json              # 项目依赖
└── scripts.js                # 旧版脚本（保留备份）
```

## 🔧 文件说明

### 核心文件

- **server.js**: Express服务器，处理API请求和路由
- **config.yaml**: 配置文件，包含API地址等设置
- **package.json**: Node.js项目配置和依赖管理

### 前端页面 (views/)

- **index.html**: 首页，展示工具卡片和快速开始
- **chat.html**: 聊天页面，主要的对话界面

### 样式文件 (public/css/)

- **common.css**: 公共样式，包含模型选择器、按钮、加载动画等

### JavaScript文件 (public/js/)

#### 公共文件
- **common.js**: 全局变量、工具函数、导航功能

#### 组件 (components/)
- **model-selector.js**: 模型选择器组件，可在多个页面复用

#### 页面脚本 (pages/)
- **home.js**: 首页专用功能
- **chat.js**: 聊天页面功能，包含消息发送、接收等

## 🚀 使用方法

### 1. 启动服务器
```bash
node server.js
```

### 2. 访问页面
- 首页: http://localhost:3035/
- 聊天页: http://localhost:3035/chat.html

### 3. 页面导航
- 使用 `Navigation.goto('pageName')` 进行页面跳转
- 支持的页面: 'index', 'chat', 'settings'

## 📋 组件使用

### 模型选择器
```javascript
// 初始化模型选择器
const modelSelector = new ModelSelector('modelSelector');

// 监听模型变化
document.getElementById('modelSelector').addEventListener('modelChanged', (e) => {
    console.log('选中模型:', e.detail);
});

// 获取当前选中模型
const selectedModel = modelSelector.getSelectedModel();
```

### 工具函数
```javascript
// 显示成功消息
Utils.showSuccess('操作成功');

// 显示错误消息
Utils.showError('操作失败');

// API请求
const data = await Utils.request('/api/models');

// 页面导航
Navigation.goto('chat');
```

## 🔄 扩展指南

### 添加新页面
1. 在 `views/` 目录创建HTML文件
2. 在 `public/js/pages/` 创建对应的JS文件
3. 在 `server.js` 添加路由
4. 更新导航菜单

### 添加新组件
1. 在 `public/js/components/` 创建组件文件
2. 使用类的形式封装功能
3. 在需要的页面引入并使用

### 添加样式
1. 页面特定样式可以内联或创建单独CSS文件
2. 公共样式添加到 `public/css/common.css`

## 🎯 优势

1. **模块化**: 代码按功能分离，易于维护
2. **可复用**: 组件可在多个页面使用
3. **可扩展**: 新增页面和功能很简单
4. **标准化**: 遵循前端项目最佳实践
5. **清晰**: 文件结构一目了然

## 📝 注意事项

1. 所有页面都需要引入 `common.js` 作为基础
2. 组件需要在使用前初始化
3. API请求统一使用 `Utils.request()` 方法
4. 页面导航使用 `Navigation.goto()` 方法
5. 全局变量存储在 `window.globalData` 中
