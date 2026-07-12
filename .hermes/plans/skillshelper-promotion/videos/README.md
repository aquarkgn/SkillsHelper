# SkillsHelper 视频资产工作区

本目录用于管理呼哈哈-技能助手的推广视频、录屏、剪辑工程和导出物。大视频和剪辑工程文件默认被 `.gitignore` 排除；镜头清单、说明、索引和复盘数据仍放在 `.hermes/plans/skillshelper-promotion/` 版本化管理。

## 目录

```text
01-capture/   原始录屏，只追加
02-selects/   精选片段
03-edit/      剪辑工程
04-export/    平台导出文件
05-cover/     封面源文件与导出图
```

文件命名遵循 `镜头资产管理规范.md` 中的 `{campaign}_{shot}_{variant}_{ratio}_{date}_v{n}.{ext}`。

## 一键生成首发素材包

如果需要快速准备 SH-001 到 SH-008 的首发素材底稿，运行：

```bash
node .hermes/plans/skillshelper-promotion/videos/scripts/generate-launch-assets.mjs
```

生成内容：

- `01-capture/`、`02-selects/`、`04-export/`：本地自动预览视频，默认不进入 Git。
- `05-cover/`：每条镜头的封面 SVG，可进入 Git。
- `03-edit/`：每条镜头的剪辑卡，说明主张、节奏、素材路径和验收点。
- `00-production-kit/`：素材索引、字幕和 SH-003 的 npm 安装/扫描证据。
- `04-export/SHL-LAUNCH_auto-preview_16x9_YYYYMMDD_v01.mp4`：8 条镜头拼接后的本地首发合集预览，默认不进入 Git。

当前机器的 ffmpeg 如果不支持 `drawtext`，生成器会自动降级为“视频占位 + SRT 字幕 + SVG 封面”；正式发布前仍以真实录屏或 `evidence/` 证据为准。
