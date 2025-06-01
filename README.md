# AI 聊天界面

## 环境设置与启动

### 方法一：使用批处理文件（Windows）

1. **安装 Node.js**

   - 访问 https://nodejs.org/
   - 下载并安装 LTS 版本
2. **安装项目依赖**

   - 双击运行 `安装依赖.bat`
3. **启动服务器**

   - 双击运行 `启动服务器-nodejs.bat`
   - 浏览器会自动打开 http://localhost:3000

### 方法二：使用命令行

```bash
# 安装依赖
npm install

# 启动服务器
npm start

# 或者使用开发模式（自动重启）
npm run dev
```

### 测试API连接

1. 打开 `test-api.html` 文件
2. 点击"测试API"按钮查看API是否可用
3. 查看返回的原始数据格式

### 使用模型选择功能

1. 点击页面底部的"Sonnet"按钮（带有下拉箭头）
2. 等待模型列表加载完成
3. 从下拉菜单中选择想要的模型
4. 选中的模型会显示在按钮上，并保存在全局状态中

**程序会自动：**

- 获取API返回的真实模型列表
- 如果API不可用，自动使用模拟数据
- 适配多种API响应格式

## 配置说明

### config.yaml

```yaml
get_model: http://localhost:8080/v1/models
```

- `get_model`: 获取模型列表的API端点

## API接口

### GET /v1/models

返回可用模型列表

**响应格式:**

```json
{
  "data": [
    {
      "id": "model-id",
      "name": "Model Name",
      "description": "Model description"
    }
  ]
}
```

## 技术实现

### 前端技术栈

- HTML5
- CSS3 (Tailwind CSS)
- Vanilla JavaScript
- Material Icons

### 核心功能

1. **配置读取**: 从config.yaml读取API配置
2. **API调用**: 使用fetch API获取模型列表
3. **DOM操作**: 动态渲染模型选项
4. **事件处理**: 处理点击事件和状态更新
5. **状态管理**: 全局变量管理选中的模型

### 关键函数

- `loadConfig()`: 读取配置文件
- `fetchAvailableModels()`: 获取模型列表
- `renderModelList()`: 渲染模型选项
- `selectModel()`: 选择模型并更新状态
- `initModelSelector()`: 初始化模型选择器

## 自定义配置

如果要连接到实际的API服务器，只需修改 `config.yaml`中的 `get_model`字段：

```yaml
get_model: https://your-api-server.com/v1/models
```

确保API服务器返回符合格式的JSON响应。

## 故障排除

### Sonnet点击后显示"加载失败"的解决方案

这是初学者最常遇到的问题，主要原因和解决方法：

#### 1. CORS跨域问题（最常见）

**问题**: 直接双击HTML文件打开时，浏览器阻止网络请求
**解决方案**:

- 双击 `启动服务器.bat` 启动本地服务器
- 在浏览器访问 `http://localhost:8000`

#### 2. API端点不可用

**问题**: config.yaml中的API地址无法访问
**解决方案**:

- 程序已自动添加模拟数据功能
- 即使API不可用，也会显示示例模型

#### 3. 网络连接问题

**问题**: 无法连接到外部API服务器
**解决方案**:

- 检查网络连接
- 使用模拟数据模式（自动启用）

### 其他常见问题

1. **模型列表加载失败**: 检查config.yaml中的API端点是否正确
2. **CORS错误**: 确保API服务器设置了正确的CORS头
3. **端口冲突**: 如果8000端口被占用，修改start-server.py中的PORT变量
4. **Python未安装**: 直接双击index.html使用模拟数据模式

## 扩展功能

可以考虑添加的功能：

- 模型搜索过滤
- 模型分类显示
- 模型详细信息展示
- 收藏常用模型
- 模型使用历史记录
