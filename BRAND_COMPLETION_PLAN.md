# 品牌数据补全建议方案 (E1-2)

## 概述

基于技能的分类和功能，本文档提供了 144 个缺失 brand 字段的技能的补全建议。

**目标**: 将完整性从 0.7% 提升至 80%+ (需补充 ~116 个技能)

---

## 品牌优先级表 (按技能数排序)

| 优先级 | 品牌/分类 | 技能数 | 建议品牌值 | 建议操作 |
|--------|----------|--------|-----------|---------|
| 1 | DevOps 工具 | 25 | DevOps | 逐一审查，细分为 AWS/Docker/K8s 等 |
| 2 | 软件开发 | 25 | Development | 保持通用或细分为框架名称 |
| 3 | ML/AI 工具 | 24 | ML/AI | 保持通用或按库名细分 |
| 4 | 创意工具 | 16 | Creative | 保持通用或按工具名细分 |
| 5 | 生产力工具 | 12 | Productivity | 保持通用或按服务名细分 |
| 6 | Apple 生态 | 7 | Apple | 直接使用 Apple |
| 7 | 研究工具 | 5 | Research | 保持通用或按平台细分 |
| 8 | 媒体工具 | 4 | Media | 保持通用或按平台细分 |
| 9 | Anthropic | 3 | Anthropic | 直接使用 Anthropic |
| 10 | 其他 | 28 | 根据具体情况 | 逐一分析 |

---

## 详细品牌分配方案

### 1️⃣ DevOps (25 个技能) → `brand: DevOps`

```
- third-party-api-gateway-setup
- proxy-deployment-documentation
- cross-branch-makefile-integration
- deploy-script-wrapper
- hysteria2-deployment
- clash-verge-proxy-rules
- proxy-reliability-debugging
- kanban-worker
- minimal-proxy-deployment
- webhook-subscriptions
- residential-proxy-routing
- kanban-orchestrator
- dingtalk-bot-notifications
- k8s-private-registry-deploy
- subscription-account-pools
- sing-box-multi-protocol-deployment
- xray-multi-instance-deployment
- deployment-script-best-practices
- release-automation-github-actions
- huhaa-myskills-release-automation
- public-exposure-private-host
- new-api-deployment
- custom-anthropic-endpoint-setup
- rclone-as-s3-gateway
- storage-consistency-atomicity
```

**细分建议**:
- AWS 相关: `brand: AWS`
- Docker 相关: `brand: Docker`
- Kubernetes 相关: `brand: Kubernetes`
- macOS 相关: `brand: Apple`
- Linux 相关: `brand: Linux`

---

### 2️⃣ 软件开发 (25 个技能) → `brand: Development`

```
- vue-vite-layout-refactoring
- test-driven-development
- systematic-debugging
- config-sync-patterns
- multi-source-data-aggregation-diagnosis
- vue3-pinia-i18n-filter-patterns
- vue3-react-component-refactoring
- plan
- prompt-rules-distribution
- multi-source-data-ui-validation
- local-cli-node-tool-design
- cross-layer-logic-relocation
- react-router-state-sync
- hermes-agent-skill-authoring
- python-debugpy
- writing-plans
- spike
- requesting-code-review
- third-party-api-self-throttle
- simplify-code
- node-inspect-debugger
- astro-vercel-content-site
- subagent-driven-development
- react-multi-step-wizard
- phased-engineering-plan
```

**细分建议**:
- Vue.js 相关: `brand: Vue`
- React 相关: `brand: React`
- Python 相关: `brand: Python`
- Node.js 相关: `brand: Node.js`

---

### 3️⃣ ML/AI 工具 (24 个技能) → `brand: ML/AI`

```
- dspy
- llm-api-proxy-stack
- huggingface-hub
- vision-model-testing-local-images
- trl-fine-tuning
- grpo-rl-training
- peft
- axolotl
- pytorch-fsdp
- unsloth
- audiocraft
- segment-anything
- clip
- stable-diffusion
- whisper
- modal
- guidance
- gguf
- vllm
- obliteratus
- llama-cpp
- outlines
- lm-evaluation-harness
- weights-and-biases
```

**细分建议**:
- HuggingFace 相关: `brand: HuggingFace`
- PyTorch 相关: `brand: PyTorch`
- OpenAI 相关: `brand: OpenAI`
- Anthropic 相关: `brand: Anthropic`

---

### 4️⃣ 创意工具 (16 个技能) → `brand: Creative`

```
- creative-ideation
- comfyui
- baoyu-infographic
- songwriting-and-ai-music
- ascii-video
- touchdesigner-mcp
- excalidraw
- ascii-art
- design-md
- popular-web-designs
- manim-video
- pretext
- humanizer
- p5js
- architecture-diagram
- sketch
```

**细分建议**:
- ComfyUI: `brand: ComfyUI`
- TouchDesigner: `brand: TouchDesigner`
- Excalidraw: `brand: Excalidraw`
- Manim: `brand: Manim`
- p5.js: `brand: p5.js`

---

### 5️⃣ 生产力工具 (12 个技能) → `brand: Productivity`

```
- nano-pdf
- maps
- teams-meeting-pipeline
- work-report-generation
- research-and-validation
- linear
- notion
- airtable
- powerpoint
- google-workspace
- clash-verge-config-management
- ocr-and-documents
```

**细分建议**:
- Notion: `brand: Notion`
- Airtable: `brand: Airtable`
- Linear: `brand: Linear`
- Microsoft: `brand: Microsoft (Teams/PowerPoint)`
- Google: `brand: Google`

---

### 6️⃣ Apple 生态 (7 个技能) → `brand: Apple`

```
- apple-reminders
- macos-computer-use
- imessage
- findmy
- apple-notes
- macos-startup-cleanup
- macos-application-forensics
```

**操作**: 全部使用 `brand: Apple`

---

### 7️⃣ 研究工具 (5 个技能) → `brand: Research`

```
- blogwatcher
- research-report-discipline
- network-protocol-research
- llm-wiki
- research-paper-writing
```

**细分建议**:
- arXiv: `brand: arXiv`
- Discourse: `brand: Discourse`
- 其他: `brand: Research`

---

### 8️⃣ 媒体工具 (4 个技能) → `brand: Media`

```
- youtube-content
- heartmula
- songsee
- gif-search
```

**细分建议**:
- YouTube: `brand: YouTube`
- 音乐: `brand: Music`
- GIF: `brand: Media`

---

### 9️⃣ Anthropic (3 个技能) → `brand: Anthropic`

```
- anthropic-api-integration
- claude-code
- claude-design
```

**操作**: 全部使用 `brand: Anthropic`

---

### 🔟 其他小类 (28 个技能)

#### Gaming (2 个技能) → `brand: Gaming`
- minecraft-modpack-server
- pokemon-player

#### Docker (2 个技能) → `brand: Docker`
- docker-image-cleanup
- docker-compose-stacks

#### MCP (2 个技能) → `brand: MCP`
- mcporter
- native-mcp

#### Red-Teaming (2 个技能) → `brand: Security`
- godmode
- prompt-injection-defense

#### 档案 (2 个技能) → `brand: Archive`
- yuanbao
- dogfood

#### 其他单一技能
- jupyter-live-kernel → `brand: Jupyter`
- himalaya (email) → `brand: Email`
- discourse-community-scan → `brand: Discourse`
- polymarket → `brand: Polymarket`
- github-pr-workflow → `brand: GitHub`
- find-nearby → `brand: Maps`
- obsidian → `brand: Obsidian`
- openhue (smart home) → `brand: Philips Hue`
- aicloudrule → `brand: System`
- xitter (Twitter/X) → `brand: X`
- linux-service-recovery → `brand: Linux`
- hermes-agent → `brand: Hermes`
- arXiv → `brand: arXiv`

---

## 执行步骤

### Step 1: 备份所有 SKILL.md
```bash
cp -r ~/.hermes/skills ~/.hermes/skills.backup.$(date +%s)
```

### Step 2: 批量添加 brand 字段 (示例脚本)

```bash
#!/bin/bash
# 为 Apple 类技能添加 brand

for skill in ~/.hermes/skills/apple/*/SKILL.md; do
  if ! grep -q "^brand:" "$skill"; then
    # 在 version 行之后插入 brand 字段
    sed -i '' '/^version:/a\
brand: Apple\
' "$skill"
    echo "✓ Added brand to $(basename $(dirname $skill))"
  fi
done
```

### Step 3: 验证完整性

```bash
# 运行诊断脚本验证
python3 /tmp/analyze_skills.py
```

### Step 4: 目标验证

```
预期结果:
- 有 brand 的技能: 116+
- 完整性: 80%+
- Top brands: DevOps(25), Development(25), ML/AI(24), ...
```

---

## 品牌字段格式规范

### SKILL.md frontmatter 示例

```yaml
---
name: apple-reminders
description: "Apple Reminders via remindctl: add, list, complete."
version: 1.0.0
author: Hermes Agent
license: MIT
brand: Apple
platforms: [macos]
metadata:
  hermes:
    tags: [Reminders, tasks, todo, macOS, Apple]
---
```

### 位置要求
- 字段位置: frontmatter 中 (在 --- 和 --- 之间)
- 推荐位置: 在 `version` 字段之后
- 格式: `brand: <BrandName>`

---

## 验证清单

- [ ] 备份所有 SKILL.md (保存到 .backup)
- [ ] 执行批量 brand 字段添加
- [ ] 验证 YAML 语法正确
- [ ] 运行诊断脚本确认完整性
- [ ] 检查所有技能都有合理的 brand 值
- [ ] 完整性达到 80%+ 目标

---

## 预期时间线

| 阶段 | 任务 | 预计时间 |
|------|------|---------|
| P1 | 脚本开发与测试 | 15 分钟 |
| P2 | 批量添加 brand 字段 | 10 分钟 |
| P3 | 手动审查和修正 | 30-60 分钟 |
| P4 | 验证与报告 | 10 分钟 |
| **总计** | | **65-85 分钟** |

---

## 问题排查

### Q: 如何检查特定技能是否有 brand?
```bash
grep "^brand:" ~/.hermes/skills/apple/apple-reminders/SKILL.md
```

### Q: 如何获取所有缺 brand 的技能?
```bash
for f in ~/.hermes/skills/*/*/SKILL.md; do
  if ! grep -q "^brand:" "$f"; then
    echo "$f"
  fi
done | wc -l
```

### Q: 如何统计各 brand 的技能数?
```bash
grep "^brand:" ~/.hermes/skills/*/*/SKILL.md | cut -d: -f2 | sort | uniq -c | sort -rn
```

---

## 相关文档

- 诊断报告: `DIAGNOSTIC_REPORT.md`
- Hermes 技能指南: https://hermes-agent.nousresearch.com/docs
- SKILL.md 规范: (参考现有技能文件)

---

**文档版本**: 1.0  
**最后更新**: 2026-06-29 10:15 UTC  
**状态**: 待执行
