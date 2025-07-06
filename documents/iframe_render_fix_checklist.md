# Iframe 渲染自适应比例 Checklist

- [x] 分析现有 `.safe-iframe-wrapper` 固定高度问题
- [x] 设计方案（见 `iframe_render_fix_design.md`）
- [x] 移除 CSS 固定高度，设置默认 `aspect-ratio: 3 / 4`
- [x] 在 `ChatMessage.tsx` 中实现 `applyAspectRatio` 辅助函数
- [x] 在 iframe `load` 事件中尝试读取内容尺寸并更新比例
- [x] 跨域或检测失败时根据文件类型降级为 16:9 / 3:4 / 1:1
- [x] 保证 iframe 容器、控制按钮在 `relative` 定位下正常显示
- [ ] 手动测试：
  - [ ] 竖版 PDF 简历
  - [ ] 横版 PPT
  - [ ] 方形 SVG 图
- [ ] 在主要浏览器（Chrome, Edge, Firefox）验证兼容性
- [ ] 更新文档 & 提交 PR 