# Assistant Personalization 页面布局修复设计

## 1. 问题描述
“助手个性化”页面中 3 列白底内容卡片高度不一致：
- `模型记忆` 描述文字 4 行，`个性化助手设置` 只有 2 行，导致卡片顶部对不齐。
- 页面底部卡片高度不一致，未延伸到可视区域底部。

## 2. 解决方案
1. **统一卡片高度** 
   - 使用 Ant Design `Row` + `Col` 的 `flex` 布局特性，给 `Row` 设置 `height:100%`，每个 `Col` 设置 `display:flex`；卡片设置 `flex:1`，强制填满高度。
2. **占位描述行** 
   - 在 `个性化助手设置` 描述末尾追加 2 行 `invisible` 占位 `<span>`，确保与 4 行描述高度一致。
   - 占位行使用注释说明，方便后期维护。
3. **代码位置**
   - `src/pages/CustomPage.tsx`
   - `src/components/custom/CustomEditorSection.tsx`

## 3. 关键实现
- `<Row className="flex-1" style={{height:'100%'}}>`
- `<Col style={{display:'flex'}}>`
- `<Card style={{flex:1, display:'flex', flexDirection:'column'}}>`
- 隐藏占位行：`<span className="invisible">占位符行</span>`

## 4. 影响范围
仅影响个性化页面样式，不涉及业务逻辑。其他页面 `Row/Col` 不受影响。

## 5. 验证
1. 进入 “助手个性化” 页面。
2. 滚动到页面底部，3 列卡片底部对齐。
3. 刷新浏览器窗口尺寸（PC / Mac），确认自适应无回归。

## 6. 文本输入框高度优化（新增）
- 原因：`Input.TextArea` 采用 `autoSize={{ minRows: 8 }}`，在高分辨率屏幕上显得过短。
- 调整：`minRows: 12, maxRows: 20`，同时保持自适应。
- 位置：`src/components/custom/CustomEditorSection.tsx`

---
负责人：AI
日期：{{DATE}} 