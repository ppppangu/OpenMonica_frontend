# 图片资源管理使用说明

## 📸 图片端点设计

### API端点

1. **获取单个图片**
   ```
   GET /api/images/:category/:filename
   ```
   例如: `/api/images/avatars/user1.jpg`

2. **获取分类图片列表**
   ```
   GET /api/images/:category
   ```
   例如: `/api/images/logos`

3. **上传图片**
   ```
   POST /api/images/upload/:category
   ```

### 图片分类

- `avatars/` - 用户头像
- `logos/` - 品牌Logo
- `icons/` - 图标
- `backgrounds/` - 背景图片
- `tools/` - 工具相关图片
- `gallery/` - 画廊/展示图片

## 🔧 使用方法

### 1. 基础用法

```javascript
// 获取图片URL
const avatarUrl = getImageUrl('avatars', 'user1.jpg');
// 结果: /api/images/avatars/user1.jpg

// 创建图片元素
const img = createImage('logos', 'company.png', {
    className: 'w-10 h-10 rounded-lg',
    alt: '公司Logo'
});
document.body.appendChild(img);
```

### 2. 高级用法

```javascript
// 获取分类下所有图片
const avatars = await ImageManager.getImages('avatars');
console.log(avatars);
// 结果: [{ name: 'user1.jpg', url: '/api/images/avatars/user1.jpg' }, ...]

// 预加载图片
await ImageManager.preloadImage('/api/images/logos/logo.png');

// 批量预加载
const urls = ['/api/images/icons/icon1.png', '/api/images/icons/icon2.png'];
await ImageManager.preloadImages(urls);
```

### 3. 在HTML中使用

```html
<!-- 直接使用端点 -->
<img src="/api/images/avatars/default.jpg" alt="默认头像" class="w-8 h-8 rounded-full">

<!-- 使用JavaScript动态创建 -->
<div id="avatar-container"></div>
<script>
const container = document.getElementById('avatar-container');
const avatar = createImage('avatars', 'user1.jpg', {
    className: 'w-8 h-8 rounded-full',
    alt: '用户头像'
});
container.appendChild(avatar);
</script>
```

### 4. 动态加载图片列表

```javascript
// 加载并显示所有Logo
async function loadLogos() {
    const logos = await ImageManager.getImages('logos');
    const container = document.getElementById('logos-container');
    
    logos.forEach(logo => {
        const img = createImage('logos', logo.name, {
            className: 'w-16 h-16 object-contain',
            alt: logo.name
        });
        container.appendChild(img);
    });
}
```

## 🎯 优势

### 1. **安全性**
- 所有图片通过服务器端点提供
- 可以添加访问控制和权限验证
- 避免直接暴露文件系统路径

### 2. **可控性**
- 统一的图片管理
- 可以添加图片处理（压缩、裁剪等）
- 支持缓存策略

### 3. **扩展性**
- 支持多种图片格式
- 可以轻松添加新的分类
- 支持图片上传功能

### 4. **性能优化**
- 内置图片预加载
- 客户端缓存
- 懒加载支持

## 📋 文件结构

```
public/images/
├── avatars/          # 用户头像
│   ├── default.jpg
│   └── user1.jpg
├── logos/            # 品牌Logo
│   ├── company.png
│   └── app-icon.svg
├── icons/            # 图标
│   ├── home.svg
│   └── chat.svg
├── backgrounds/      # 背景图片
└── tools/           # 工具相关图片
```

## 🚀 部署建议

### 1. **生产环境**
- 使用CDN加速图片访问
- 添加图片压缩中间件
- 实现图片缓存策略

### 2. **开发环境**
- 使用本地图片端点
- 支持热重载
- 添加图片上传功能

### 3. **图片优化**
```javascript
// 可以在端点中添加图片处理
app.get('/api/images/:category/:filename', (req, res) => {
    const { category, filename } = req.params;
    const { width, height, quality } = req.query;
    
    // 根据参数处理图片
    // 例如: /api/images/avatars/user1.jpg?width=100&height=100&quality=80
});
```

## 💡 最佳实践

1. **命名规范**: 使用有意义的文件名
2. **分类管理**: 按功能分类存储图片
3. **格式选择**: 根据用途选择合适的图片格式
4. **大小控制**: 控制图片文件大小，优化加载速度
5. **备用方案**: 提供占位符和错误处理
