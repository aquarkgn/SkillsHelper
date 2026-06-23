# HuHaa-MySkills 发版工作流

本文档定义了发版流程、版本号规则和检查清单。

## 📋 版本号规则

- **格式**：Semantic Versioning (`major.minor.patch`)
- **示例**：`0.3.0`, `0.3.1`, `0.3.2`
- **升级规则**：
  - **Patch（最后位）**：叠加发布（不询问）
    - Bug 修复 → `0.3.1`
    - 小功能改进 → `0.3.2`
    - 依赖更新 → `0.3.3`
  - **Minor（中间位）**：按需升级（不询问）
    - 新功能或重构 → `0.4.0`
  - **Major（第一位）**：必须询问用户
    - 不兼容改动 → `1.0.0`

## 🚀 发版流程

### 1. 检查清单（发版前）

```bash
# ✓ 确认代码已提交到 main
git log --oneline -3

# ✓ 检查是否有未提交的改动
git status

# ✓ 运行测试
npm run verify
npm run stats

# ✓ 检查构建
npm run build:web
```

### 2. 更新版本号

```bash
# 编辑 package.json
vim package.json
# 修改: "version": "0.3.1" (根据升级规则)

# 编辑 CHANGELOG.md
# 在顶部添加新版本条目

# 提交版本更新
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 0.3.1"
git push origin main
```

### 3. 创建发版标签

```bash
# 创建标签
git tag v0.3.1

# 推送标签到 GitHub
git push origin v0.3.1
```

**✨ 自动触发**：GitHub Actions 的 `release.yml` 会自动：
1. 检测到 `v*` tag push
2. 构建 web 资源 (`npm run build:web`)
3. 从 CHANGELOG.md 提取发布说明
4. npm publish
5. 创建 GitHub Release

### 4. 验证发版

```bash
# 检查 npm registry 中的新版本
npm view huhaa-myskills@0.3.1 version

# 检查 GitHub Release
# https://github.com/aquarkgn/HuHaa-MySkills/releases/tag/v0.3.1
```

## 📝 CHANGELOG.md 格式

新版本在顶部添加（Keep a Changelog 规范）：

```markdown
## [0.3.1] - 2026-06-24

### Fixed
- 修复侧边栏拖拽边界的 bug

### Changed
- 改进搜索性能

### Added
- 新增导出功能

---

## [0.3.0] - 2026-06-23
```

## 🔧 前置条件

### GitHub Secrets（一次性配置）

需要 `NPM_TOKEN` secret：

1. 访问 https://www.npmjs.com/settings/~/tokens
2. 生成 **Automation** 类型的新 token
3. 复制 token 值
4. 打开 https://github.com/aquarkgn/HuHaa-MySkills/settings/secrets/actions
5. 新增 Secret：
   - **Name**: `NPM_TOKEN`
   - **Value**: (粘贴 npm token)

### 本地环境

```bash
# Node.js 20+
node --version

# npm 已登录（或依赖 GitHub Actions 登录）
npm whoami
```

## 📊 发版检查清单

- [ ] 代码已提交到 main
- [ ] 无未提交的改动 (`git status` 干净)
- [ ] 测试通过 (`npm run verify`)
- [ ] 构建成功 (`npm run build:web`)
- [ ] 确认版本号（遵循升级规则）
- [ ] CHANGELOG.md 已更新
- [ ] package.json 已更新
- [ ] 版本 commit 已推送
- [ ] Tag 已创建并推送
- [ ] GitHub Actions 工作流已成功运行
- [ ] npm registry 中可见新版本
- [ ] GitHub Release 已创建

## 🎯 常见场景

### 场景 1: 修复 Bug（Patch）

```bash
# 修复 bug...
# git add && git commit

# 版本升级：0.3.0 → 0.3.1
# 编辑 package.json: "version": "0.3.1"
# 编辑 CHANGELOG.md: 添加 v0.3.1 条目
git add package.json CHANGELOG.md
git commit -m "chore: bump to 0.3.1"
git push origin main
git tag v0.3.1
git push origin v0.3.1
```

### 场景 2: 新功能（Minor）

```bash
# 开发新功能...
# git add && git commit

# 版本升级：0.3.0 → 0.4.0
# 编辑 package.json: "version": "0.4.0"
# 编辑 CHANGELOG.md: 添加 v0.4.0 条目
git add package.json CHANGELOG.md
git commit -m "chore: bump to 0.4.0"
git push origin main
git tag v0.4.0
git push origin v0.4.0
```

### 场景 3: 多个 Patch 发布

```bash
# v0.3.1 已发布
# 又修复了另一个 bug

# 版本升级：0.3.1 → 0.3.2
# 编辑 package.json: "version": "0.3.2"
# 编辑 CHANGELOG.md: 添加 v0.3.2 条目
git add package.json CHANGELOG.md
git commit -m "chore: bump to 0.3.2"
git push origin main
git tag v0.3.2
git push origin v0.3.2
```

## ⚠️ 注意事项

1. **不要回退版本号**：版本号只增不减
2. **CHANGELOG 必须更新**：GitHub Actions 会从 CHANGELOG 提取发布说明
3. **Tag 必须以 `v` 开头**：例如 `v0.3.1`，不是 `0.3.1`
4. **等待 GitHub Actions 完成**：推送 tag 后，等待工作流运行结束
5. **npm 发布是公开的**：发版后所有人都能访问

## 🔗 相关文档

- `.github/workflows/release.yml` — GitHub Actions 工作流
- `CHANGELOG.md` — 版本发布说明
- `package.json` — 项目元数据

## 📞 问题排查

### npm publish 失败

**原因**：NPM_TOKEN secret 未配置或过期

**解决**：
1. 检查 GitHub Settings → Secrets 中是否有 `NPM_TOKEN`
2. 如果没有，按前置条件配置
3. 如果已有，尝试重新生成 npm token

### GitHub Release 内容为空

**原因**：CHANGELOG.md 中该版本没有对应条目

**解决**：
1. 确保 CHANGELOG.md 包含 `## [0.3.1]` 格式的条目
2. 推送修改到 main
3. 删除并重新创建 tag：
   ```bash
   git tag -d v0.3.1
   git push origin :refs/tags/v0.3.1
   git tag v0.3.1
   git push origin v0.3.1
   ```

### 工作流未触发

**原因**：Tag 格式错误或没有推送

**解决**：
1. 确保 tag 以 `v` 开头：`v0.3.1`
2. 确保已推送：`git push origin v0.3.1`
3. 检查 GitHub Actions 标签页是否有运行记录

---

**最后更新**：2026-06-23
