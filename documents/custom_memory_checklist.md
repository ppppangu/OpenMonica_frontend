## 自定义页功能 Checklist

> 状态标记：✅ 已完成 | ⌛ 进行中 | ⬜ 未开始 | ❌ 阻塞

- ✅ 1. 设计文档编写并审阅
- ✅ 2. 在 `documents` 目录保存设计与 checklist 文件
- ✅ 3. 安装依赖 `lodash.debounce`（已存在 lodash-es 包含 debounce）
- ✅ 4. 更新 `MainLayout.tsx` → 增加侧边栏菜单项「自定义」
- ✅ 5. 更新 `App.tsx` → 新增 `/custom` 路由指向 `CustomPage`
- ✅ 6. 在 `hooks/useApi.ts` → 编写 `useCustomData` Hook（GET）
- ✅ 7. 在 `hooks/useApi.ts` → 编写 `useUpdateCustomData` Hook（UPDATE）
- ✅ 8. 创建组件 `CustomEditorSection.tsx`
- ✅ 9. 创建页面 `CustomPage.tsx` 并集成两列布局
- ✅ 10. 为输入框实现 1s 防抖自动保存逻辑
- ✅ 11. 处理加载、错误与保存成功反馈
- ⬜ 12. 编写单元/集成测试（可选）
- ⬜ 13. 更新 README 或使用文档（可选）
- ⬜ 14. 代码 Review & 合并 