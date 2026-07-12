# SH-003 本地安装与扫描录制 Runbook

镜头 ID：SH-003  
目标：证明用户从 npm 安装的公开版本可以在干净环境中运行，并且 `scan --json` 的 stdout 可直接保存为 JSON。

## 录制定位

- 画幅：16:9 优先；短视频可二裁 9:16。
- 时长：8 秒母版镜头，长视频可扩展到 30–45 秒。
- 重点画面：安装、版本、隔离配置、JSON 输出重定向。

## 录制前检查

- [ ] 关闭系统通知、即时通讯、邮箱和日历弹窗。
- [ ] 使用干净终端主题，字号不低于 16。
- [ ] 使用临时目录，不录真实 `~/.config/skillshelper`。
- [ ] 不展示 Token、私有路径、账号、浏览器个人资料。
- [ ] 确认 npm latest：

  ```bash
  npm view skillshelper version dist-tags.latest --json
  ```

  期望：`version` 和 `dist-tags.latest` 均为 `0.4.1`。

## 推荐录制命令

```bash
tmp="$(mktemp -d)"
prefix="$tmp/install"
home="$tmp/config"
cache="$tmp/npm-cache"

npm install --prefix "$prefix" --cache "$cache" --prefer-online --omit=dev skillshelper@latest
"$prefix/node_modules/.bin/skillshelper" --version

mkdir -p "$home"
printf 'limits:\n  maxFiles: 100\n  maxFileBytes: 1048576\n' > "$home/sources.yaml"

SKILLSHELPER_HOME="$home" HOME="$tmp/home" \
  "$prefix/node_modules/.bin/skillshelper" scan --json \
  > "$tmp/skills.json" \
  2> "$tmp/scan.log"

node -e 'const fs=require("node:fs"); const data=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(`JSON OK: ${Array.isArray(data)} / ${data.length} item(s)`)' "$tmp/skills.json"
sed -n '1,6p' "$tmp/scan.log"
```

## 期望画面

1. `npm install ... skillshelper@latest` 成功。
2. `skillshelper --version` 输出 `skillshelper v0.4.1`。
3. `scan --json` 重定向到 `skills.json`，进度重定向到 `scan.log`。
4. `JSON OK: true / ... item(s)` 证明 stdout 可机器读取。
5. `scan.log` 展示 `[scan] Tier ...` 进度，证明人类可读日志仍存在。

## 字幕建议

- “公开 npm 包，不是本地源码。”
- “stdout 给脚本，stderr 给人看。”
- “录制当天的扫描数量只作画面证据，不写进固定卖点。”

## 录后验收

- [ ] 画面能看清 `skillshelper v0.4.1`。
- [ ] 没有暴露个人目录、账号、Token、通知。
- [ ] `skills.json` 可被 JSON 解析。
- [ ] `scan.log` 能看到进度日志。
- [ ] 素材文件按 `shot-catalog.yaml` 中 SH-003 的 `asset_paths.capture` 命名。
