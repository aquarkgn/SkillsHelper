# CLAUDE.md — 项目 AI 助手协作规则

> 本项目的 Claude Code 协作规范。详细规范查看 **[docs/INDEX.md](docs/INDEX.md)**

---

## 🎯 核心原则

1. **全中文沟通** — 对话、提交信息、注释都用中文
2. **一致性优先** — 遵循 `docs/Frontend-Engineering.md`
3. **质量第一** — TypeScript strict、测试覆盖 >= 80%、代码审查通过
4. **工程纪律** — 单一职责、最小改动、推送前 `/code-review`
5. **文档优先** — 所有决策写入代码、文档或提交信息

---

## 📚 规范查阅

**快速问题 → 本文件**  
**详细规范 → `docs/Frontend-Engineering.md`**  
**全部导航 → `docs/INDEX.md`**

---

## 🔄 标准流程

### 功能开发
```
1. 创建 feature/xxx 分支
2. 实现 + 测试
3. npm run lint && build && test
4. /code-review
5. 提交 + PR
```

### Bug 修复
```
1. 创建 fix/xxx 分支
2. 写失败的测试
3. 修复代码（测试转 pass）
4. /code-review + /verify
5. 提交 + PR
```

### 提交信息（Conventional Commits）
```
feat(dashboard): 添加数据更新
fix(settings): 修复表单提交错误
refactor(types): 统一 API 类型定义
```

---

## ⚠️ 必须遵守

- ✅ TypeScript strict 模式
- ✅ 禁止 `any` 和 `@ts-ignore`
- ✅ 推送前必须 `/code-review`
- ✅ 核心功能必须有测试
- ✅ 提交信息清晰表达意图

---

## 📖 完整规范

所有规范细节查看：**[docs/Frontend-Engineering.md](docs/Frontend-Engineering.md)**

包括：
- 技术栈、版本管理、目录结构
- 编码规范、测试规范、Git 工作流
- CI/CD、安全、性能基准、发布流程

---

**详见**：[docs/INDEX.md](docs/INDEX.md)
