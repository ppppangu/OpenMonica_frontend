## 知识库管理功能重构设计

### 1. 目标

1. 用组件化方式替换原先基于静态挂载的实现，将 **知识库概览**、**知识库详情**、**知识图谱** 拆分为独立 Vue 组件；
2. 所有知识库相关组件统一放置在 `src/components/knowledgebase/` 目录；
3. 通过 Pinia 统一管理当前选中的视图以及各视图内部需要共享的状态；
4. 在 `knowledgebase.html` 中通过点击侧边栏按钮以懒加载方式动态挂载对应组件；
5. 提供易扩展的架构，为后续增加更多知识库功能留下接口。

### 2. 目录结构

```
src/
  components/
    knowledgebase/
      KnowledgebaseDashboard.vue   // 概览仪表盘
      KnowledgebaseDetail.vue      // 文档列表 + 预览
      KnowledgeGraph.vue           // 知识图谱主容器
      DocumentList.vue             // 复用(从旧目录迁移)
  store/
    knowledgebase_view.ts          // 保存当前视图 & 公共状态
```

### 3. 组件职责

1. KnowledgebaseDashboard.vue
   - 负责展示统计卡片、图表等概览信息；
   - 通过 Pinia 读取/请求统计数据。

2. KnowledgebaseDetail.vue
   - 左侧 `DocumentList`：展示文档；
   - 右侧 `iframe`：实时预览当前选中文档，借助 `sandbox="allow-*"` 禁用浏览器默认限制；
   - 监听 `activeDocument` 变化并更新预览 URL。

3. KnowledgeGraph.vue
   - 布局划分：
     1. **控制面板**（右上角 / 固定）
     2. **图谱画布**（核心可视化区域）
     3. **节点/关系详情抽屉**（选中节点后从右侧滑出显示元数据）
   - 内部可拆分为子组件，但暂以单文件占位。

### 4. Data Flow

- `knowledgebase_view` Store 结构
```ts
state: {
  currentView: 'dashboard' | 'detail' | 'graph',
  activeDocument?: DocumentMeta,
  stats?: DashboardStats,
  graphData?: GraphPayload,
}
```
- 侧边栏按钮 -> 调用 `knowledgebase_view.setCurrentView(view)` -> main.ts 响应并动态挂载。

### 5. 动态挂载方案

- `knowledgebase/main.ts`
  1. 创建 Pinia → 挂载根占位组件 `EmptyApp`; 保存 `currentApp` 实例引用；
  2. 监听 `knowledge-panel-item` click 或 `store.currentView` 变化；
  3. 根据枚举 **懒加载**导入对应组件并重新 `createApp` 挂载到 `#knowledge-dynamic-content`。

### 6. 渐进式执行计划

| 步骤 | 内容                                                    |
| ---- | ------------------------------------------------------- |
| 1    | 编写设计文档 & checklist                                |
| 2    | 新建 Pinia store `knowledgebase_view.ts`                |
| 3    | 新建三个 Vue 组件骨架 + 迁移 DocumentList.vue           |
| 4    | 修改 `knowledgebase.html` 增加 `data-view` 属性标识按钮 |
| 5    | 改写 `knowledgebase/main.ts` 实现动态挂载               |
| 6    | 基础联调，确保视图切换正常                              |
| 7    | 填充 Dashboard、Graph 等业务细节（后续迭代）            |

### 7. 兼容性与性能

- 组件懒加载减少初始包体；
- `iframe` 采用 `sandbox="allow-scripts allow-same-origin allow-downloads"`，同时根据文件格式按需设置 `src`；
- Graph 画布后期考虑使用 `echarts` 或 `@antv/g6`。

---

> 以上为第一版设计，如有新需求请在 checklist 标注再行迭代。 