# AGENT.md — Claude Code 代理规则

> 本项目的 Claude Code 代理行为准则。详细规范查看 **[docs/INDEX.md](docs/INDEX.md)**

---

## 🎬 权限级别

### ✅ 自主决策
- 编辑代码、测试、配置
- 创建本地分支和提交
- 运行 lint、build、test、/code-review
- 读写文件

### ⚠️ 需确认
- `git push` 到远程
- 创建 PR
- 删除文件/分支
- 修改 package.json
- 修改 CI/CD 配置

### ❌ 明确禁止
- 使用私密凭证（无授权）
- 强制推送到 main
- 跳过 hooks（--no-verify）
- 提交敏感信息（.env.local）

---

## 🚀 工作流

### 编码流程
```
1. 需求理解 → 方案设计（如需 Plan 模式）
2. 创建分支 + 开发
3. Lint + Build + Test
4. /code-review
5. 提交 + 推送（确认）→ PR
6. CI + Review 通过 → Merge
```

### 何时需要 Plan 模式
- 功能复杂（> 30 分钟工作量）
- 多个可行方案需对齐
- 影响全局代码结构
- 新的依赖或工具选择

### 何时需要用户确认
- 任何远程推送操作
- 修改 package.json
- 修改 GitHub Workflows
- 版本发布

---

## 🤝 沟通原则

- **遇到障碍** → 立即说出，不隐瞒
- **设计困境** → 展示方案，让用户选择
- **风险操作** → 提前说明后果
- **进度更新** → 1-2 句话，不啰嗦

---

## ✅ 执行标准

- 代码通过 TypeScript strict 模式
- 核心功能有测试覆盖
- `/code-review` 建议都应用
- 提交信息清晰，能说出 WHY
- 不修改无关代码

---

## 📖 完整规范

所有细节查看：**[docs/Frontend-Engineering.md](docs/Frontend-Engineering.md)**

权限边界、工作流、决策矩阵等完整内容。

---

**详见**：[docs/INDEX.md](docs/INDEX.md)
