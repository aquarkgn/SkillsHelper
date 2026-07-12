# SH-003 安装与扫描证据

生成时间：2026-07-12T10:50:45.892Z

```text
$ npm view skillshelper version dist-tags.latest --json
{
  "version": "0.4.1",
  "dist-tags.latest": "0.4.1"
}
$ npm install --prefix <tmp>/install --cache <tmp>/npm-cache --prefer-online --omit=dev skillshelper@latest
$ <tmp>/install/node_modules/.bin/skillshelper --version
skillshelper v0.4.1
$ SKILLSHELPER_HOME=<tmp>/config HOME=<tmp>/home skillshelper scan --json > skills.json 2> scan.stderr.txt
JSON OK: true / 0 item(s)
[scan] Tier 1: scanning editor tools...
[scan] Tier 1: found 0 skills
[scan] Tier 2: scanning user skills library...
[scan] Tier 2: found 0 skills
[scan] 0 item(s)
```

结论：

- npm latest：0.4.1 / 0.4.1
- CLI：skillshelper v0.4.1
- stdout 含 `[scan]`：false
- stderr 含 `[scan]`：true
- JSON 可解析：true
