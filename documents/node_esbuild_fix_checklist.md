# 使用 Scoop 修复 esbuild 冲突 Checklist

- [ ] 1. 安装（或确认）Scoop 已可用
- [ ] 2. 添加 `versions` bucket
- [ ] 3. 安装 `nodejs-lts`
- [ ] 4. 切换 Shim 并验证 `node -v` 输出 20.x
- [ ] 5. 删除 `node_modules`、`package-lock.json`
- [ ] 6. 重新执行 `npm install` 并确保无报错
- [ ] 7. 运行 `npm run dev` 通过编译
- [ ] 8. 更新此 Checklist 为完成状态 