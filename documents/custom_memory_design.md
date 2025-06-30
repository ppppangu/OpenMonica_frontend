### 自定义页（CustomPrompt & ModelMemory）功能设计

#### 1. 目标
为侧边栏新增「自定义」按钮，进入后展示双列编辑界面：
1. 自定义提示（Custom Prompts）
2. 模型记忆（Model Memory）

支持数据自动加载与 1 秒防抖自动保存，使用后端提供的四个接口完成增删改查。

#### 2. API 交互
| 功能 | Endpoint | method | formData | 说明 |
| --- | --- | --- | --- | --- |
| 获取自定义提示 | `/user/custom` | POST | `mode=get` `target=custom_personality` `user_id` | 返回 `data:string` |
| 更新自定义提示 | `/user/custom` | POST | `mode=update` `target=custom_personality` `new_text` `user_id` | |
| 获取模型记忆 | `/user/custom` | POST | `mode=get` `target=custom_memory` `user_id` | 返回 `data:string` |
| 更新模型记忆 | `/user/custom` | POST | `mode=update` `target=custom_memory` `new_text` `user_id` | |

> Title 与 Body 的存储：后端暂未提供独立字段，前端采用 JSON 字符串 `{ title, body }` 填入 `new_text`。读取时优先尝试 `JSON.parse`，失败则默认 `title=''`，`body=原文本`。

#### 3. 组件架构
```
src/
  pages/
    CustomPage.tsx          // 页面级，负责整体布局
  components/
    knowledgebase/
      CustomEditorSection.tsx // 可复用的编辑区（标题 + 文本域 + loading/error 处理）
  hooks/
    useApi.ts               // 新增 useCustomData & useUpdateCustomData hook
```

- `CustomPage`：Flex 布局 `grid grid-cols-1 md:grid-cols-2 gap-6`；内部渲染两份 `CustomEditorSection`。
- `CustomEditorSection` Props：
  - `titleLabel`（string）
  - `target` (`'custom_personality' | 'custom_memory'`)

#### 4. 状态管理
使用 React Query：
- Query Key: `['custom', userId, target]`
- Mutation 后 `invalidateQueries` 同 key。

本地状态：受控表单；`useDebounce`(1s) 内触发 mutation。

#### 5. 交互流程
1. 进入页面 → `useQuery` 拉取远端数据 → 解析出 `title` & `body` 填充表单。
2. 用户编辑任一字段 → 更新局部 state → 1 秒无继续输入后触发 `mutation` 保存。
3. 成功后展示 ✅ Toast；失败展示 ❌ Error message。

#### 6. 错误与加载
- 加载中：Skeleton/Spinner 覆盖对应编辑区。
- 错误：Alert + 重试按钮（调用 `refetch()`）。

#### 7. 样式
- TailwindCSS。
- 输入框：`border rounded px-3 py-2 focus:ring-primary-500`。
- Textarea 高度：`min-h-[200px]`；滚动条隐藏。

#### 8. 路由与导航
- 在 `MainLayout.tsx` 的 `MENU_CONFIG` 中插入 `{ key: '/custom', icon: BulbOutlined, label: '自定义' }`。
- 在 `App.tsx` 添加 `<Route path="/custom" element={<CustomPage />} />`。

#### 9. 依赖
- `lodash.debounce`（或自实现）。React-Query 已存在。

#### 10. 待办
参见 checklist 文件。 