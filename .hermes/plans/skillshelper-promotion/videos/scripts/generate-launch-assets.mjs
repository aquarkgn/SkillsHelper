#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import YAML from "yaml";

const root = resolve(new URL("../../../../..", import.meta.url).pathname);
const promoRoot = join(root, ".hermes/plans/skillshelper-promotion");
const videoRoot = join(promoRoot, "videos");
const catalogPath = join(promoRoot, "assets/shot-catalog.yaml");
const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const fontfile = [
  "/System/Library/Fonts/PingFang.ttc",
  "/System/Library/Fonts/STHeiti Light.ttc",
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
].find((candidate) => existsSync(candidate));

if (!fontfile) {
  throw new Error("找不到可用于中文渲染的系统字体。");
}

const catalog = YAML.parse(readFileSync(catalogPath, "utf8"));
const shots = catalog.shots ?? [];
const generatedAt = new Date().toISOString();
const productionKitRoot = join(videoRoot, "00-production-kit");
const scratchRoot = join(productionKitRoot, ".scratch");
const coverRoot = join(videoRoot, "05-cover");
const evidenceRoot = join(productionKitRoot, "evidence");
const subtitleRoot = join(productionKitRoot, "subtitles");
const edlRoot = join(videoRoot, "03-edit");
const supportsDrawtext = execFileSync("ffmpeg", ["-hide_banner", "-filters"], { encoding: "utf8" }).includes(" drawtext");

for (const dir of [productionKitRoot, scratchRoot, coverRoot, evidenceRoot, subtitleRoot, edlRoot]) {
  mkdirSync(dir, { recursive: true });
}

function resolveAsset(pathTemplate) {
  return join(root, pathTemplate.replace("YYYYMMDD", today));
}

function ensureParent(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function shellQuote(value) {
  return String(value).replaceAll("'", "'\\''");
}

function filterValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll(":", "\\:").replaceAll(" ", "\\ ");
}

function wrapText(value, limit = 26) {
  const text = String(value).replace(/\s+/g, " ").trim();
  const lines = [];
  let current = "";
  let width = 0;
  for (const char of text) {
    const charWidth = /[\u0000-\u00ff]/.test(char) ? 0.6 : 1;
    if (width + charWidth > limit && current) {
      lines.push(current);
      current = char;
      width = charWidth;
    } else {
      current += char;
      width += charWidth;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4).join("\n");
}

function writeTextFile(fileName, text) {
  const filePath = join(scratchRoot, fileName);
  writeFileSync(filePath, text, "utf8");
  return filePath;
}

function ratioFromPath(filePath) {
  if (filePath.includes("_9x16_")) return "9x16";
  if (filePath.includes("_1x1_")) return "1x1";
  return "16x9";
}

function dimensionsForRatio(ratio) {
  if (ratio === "9x16") return { width: 1080, height: 1920 };
  if (ratio === "1x1") return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 };
}

function drawTextFilter({ textFile, x, y, size, color = "white", lineSpacing = 12 }) {
  return [
    `drawtext=fontfile=${filterValue(fontfile)}`,
    `textfile=${filterValue(textFile)}`,
    `x=${x}`,
    `y=${y}`,
    `fontsize=${size}`,
    `fontcolor=${color}`,
    `line_spacing=${lineSpacing}`,
  ].join(":");
}

function renderPreview({ shot, outputPath, ratio }) {
  ensureParent(outputPath);
  const { width, height } = dimensionsForRatio(ratio);
  const isVertical = ratio === "9x16";
  const duration = Math.max(Number(shot.duration_seconds ?? 8), 5);
  const left = isVertical ? 84 : 130;
  const top = isVertical ? 190 : 132;
  const baseFilters = [
    `drawbox=x=0:y=0:w=iw:h=ih:color=0x0B1020@1:t=fill`,
    `drawbox=x=${left}:y=${top - 58}:w=${isVertical ? 170 : 220}:h=10:color=0x7C3AED@1:t=fill`,
    `drawbox=x=${left}:y=${top + (isVertical ? 120 : 118)}:w=${width - left * 2}:h=${isVertical ? 520 : 280}:color=0x1E1B4B@0.78:t=fill`,
    `drawbox=x=${left + 34}:y=${top + (isVertical ? 160 : 156)}:w=${width - left * 2 - 68}:h=${isVertical ? 40 : 34}:color=0xA78BFA@0.95:t=fill`,
    `drawbox=x=${left + 34}:y=${top + (isVertical ? 240 : 224)}:w=${Math.round((width - left * 2 - 68) * 0.74)}:h=${isVertical ? 40 : 34}:color=0x34D399@0.95:t=fill`,
    `drawbox=x=${left + 34}:y=${top + (isVertical ? 320 : 292)}:w=${Math.round((width - left * 2 - 68) * 0.52)}:h=${isVertical ? 40 : 34}:color=0x60A5FA@0.95:t=fill`,
    `drawbox=x=${left}:y=${height - (isVertical ? 360 : 250)}:w=${width - left * 2}:h=${isVertical ? 160 : 112}:color=0x111827@0.86:t=fill`,
  ];
  const filterParts = [...baseFilters];

  if (supportsDrawtext) {
    const titleFile = writeTextFile(`${shot.id}-title.txt`, `${shot.id} · ${shot.title}`);
    const claimFile = writeTextFile(`${shot.id}-claim.txt`, wrapText(shot.claim, isVertical ? 18 : 34));
    const footerFile = writeTextFile(
      `${shot.id}-footer.txt`,
      "呼哈哈-技能助手 / SkillsHelper\n素材类型：自动预览，可直接进剪辑"
    );
    const ctaFile = writeTextFile(`${shot.id}-cta.txt`, "npm install -g skillshelper@latest");
    filterParts.push(
      drawTextFilter({
        textFile: titleFile,
        x: left,
        y: top,
        size: isVertical ? 48 : 54,
        color: "0xF8FAFC",
      }),
      drawTextFilter({
        textFile: claimFile,
        x: left,
        y: top + (isVertical ? 120 : 118),
        size: isVertical ? 64 : 72,
        color: "0xE2E8F0",
        lineSpacing: isVertical ? 22 : 18,
      }),
      drawTextFilter({
        textFile: ctaFile,
        x: left + 32,
        y: height - (isVertical ? 320 : 218),
        size: isVertical ? 44 : 42,
        color: "0xA7F3D0",
      }),
      drawTextFilter({
        textFile: footerFile,
        x: left,
        y: height - (isVertical ? 145 : 105),
        size: isVertical ? 30 : 28,
        color: "0x94A3B8",
        lineSpacing: 8,
      })
    );
  }

  const filter = filterParts.join(",");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `color=c=0x0B1020:s=${width}x${height}:r=30:d=${duration}`,
      "-vf",
      filter,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { stdio: "pipe" }
  );
}

function writeSubtitle({ shot, outputPath }) {
  ensureParent(outputPath);
  const duration = Math.max(Number(shot.duration_seconds ?? 8), 5);
  const endSecond = String(duration).padStart(2, "0");
  writeFileSync(
    outputPath,
    `1
00:00:00,000 --> 00:00:02,000
${shot.id} · ${shot.title}

2
00:00:02,000 --> 00:00:${endSecond},000
${shot.claim}

3
00:00:${String(Math.max(duration - 2, 3)).padStart(2, "0")},000 --> 00:00:${endSecond},000
npm install -g skillshelper@latest
`,
    "utf8"
  );
}

function remux(inputPath, outputPath) {
  ensureParent(outputPath);
  execFileSync("ffmpeg", ["-y", "-i", inputPath, "-c", "copy", outputPath], { stdio: "pipe" });
}

function svgEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function writeCover({ shot, outputPath, ratio }) {
  ensureParent(outputPath);
  const { width, height } = dimensionsForRatio(ratio);
  const isVertical = ratio === "9x16";
  const titleLines = wrapText(shot.title, isVertical ? 10 : 18).split("\n");
  const claimLines = wrapText(shot.claim, isVertical ? 15 : 30).split("\n");
  const titleY = isVertical ? 360 : 230;
  const claimY = titleY + (isVertical ? 210 : 160);
  const titleSize = isVertical ? 104 : 96;
  const claimSize = isVertical ? 54 : 50;
  const lineSvg = (lines, x, y, size, fill, weight = 600, step = Math.round(size * 1.3)) =>
    lines
      .map(
        (line, index) =>
          `<text x="${x}" y="${y + index * step}" font-size="${size}" font-weight="${weight}" fill="${fill}">${svgEscape(line)}</text>`
      )
      .join("\n  ");

  writeFileSync(
    outputPath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1020"/>
      <stop offset="0.48" stop-color="#1E1B4B"/>
      <stop offset="1" stop-color="#312E81"/>
    </linearGradient>
    <radialGradient id="glow" cx="74%" cy="26%" r="58%">
      <stop offset="0" stop-color="#A78BFA" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#0B1020" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <rect x="${isVertical ? 72 : 118}" y="${isVertical ? 132 : 104}" width="${isVertical ? 196 : 246}" height="14" rx="7" fill="#34D399"/>
  <text x="${isVertical ? 72 : 118}" y="${isVertical ? 245 : 185}" font-size="${isVertical ? 42 : 38}" font-weight="700" fill="#A7F3D0">${shot.id} · 呼哈哈-技能助手</text>
  ${lineSvg(titleLines, isVertical ? 72 : 118, titleY, titleSize, "#F8FAFC", 800)}
  ${lineSvg(claimLines, isVertical ? 72 : 118, claimY, claimSize, "#CBD5E1", 500)}
  <rect x="${isVertical ? 72 : 118}" y="${height - (isVertical ? 310 : 220)}" width="${width - (isVertical ? 144 : 236)}" height="${isVertical ? 152 : 108}" rx="28" fill="#020617" opacity="0.72"/>
  <text x="${isVertical ? 112 : 158}" y="${height - (isVertical ? 220 : 154)}" font-size="${isVertical ? 44 : 40}" font-weight="700" fill="#A7F3D0">npm install -g skillshelper@latest</text>
  <text x="${isVertical ? 72 : 118}" y="${height - (isVertical ? 88 : 70)}" font-size="${isVertical ? 30 : 28}" fill="#94A3B8">SkillsHelper launch asset · ${today}</text>
</svg>
`,
    "utf8"
  );
}

function writeEditDecision({ shot, outputPath, assets }) {
  ensureParent(outputPath);
  writeFileSync(
    outputPath,
    `# ${shot.id} ${shot.title} 剪辑卡

生成时间：${generatedAt}
素材类型：自动预览素材。可用于粗剪、字幕、封面和节奏占位；涉及真实产品声明时，以 evidence 和真实录屏为最终发布依据。

## 主张

${shot.claim}

## 建议剪辑

1. 0–2 秒：展示镜头标题和场景定位。
2. 2–${Math.max(Number(shot.duration_seconds ?? 8) - 2, 4)} 秒：保留主张文案，叠加产品 UI 或命令行画面。
3. 结尾 2 秒：固定 CTA \`npm install -g skillshelper@latest\`。

## 资产

- capture: \`${assets.capture}\`
- selects: \`${assets.selects}\`
- export: \`${assets.export}\`
- cover: \`${assets.cover}\`
- subtitle: \`${assets.subtitle}\`

## 验收

${(shot.production?.acceptance ?? []).map((item) => `- ${item}`).join("\n")}
`,
    "utf8"
  );
}

function runCommand(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options });
}

function collectSh003Evidence() {
  const npmView = JSON.parse(runCommand("npm", ["view", "skillshelper", "version", "dist-tags.latest", "--json"]));
  const tmp = runCommand("mktemp", ["-d"]).trim();
  const prefix = join(tmp, "install");
  const home = join(tmp, "config");
  const cache = join(tmp, "npm-cache");
  mkdirSync(home, { recursive: true });
  writeFileSync(join(home, "sources.yaml"), "limits:\n  maxFiles: 100\n  maxFileBytes: 1048576\n", "utf8");
  runCommand("npm", ["install", "--prefix", prefix, "--cache", cache, "--prefer-online", "--omit=dev", "skillshelper@latest"]);
  const version = runCommand(join(prefix, "node_modules/.bin/skillshelper"), ["--version"]).trim();
  const stdoutPath = join(tmp, "skills.json");
  const stderrPath = join(tmp, "scan.stderr.txt");
  const scanWithRedirect = execFileSync(
    "bash",
    [
      "-lc",
      `'${shellQuote(join(prefix, "node_modules/.bin/skillshelper"))}' scan --json > '${shellQuote(stdoutPath)}' 2> '${shellQuote(stderrPath)}'`,
    ],
    {
      encoding: "utf8",
      env: { ...process.env, SKILLSHELPER_HOME: home, HOME: join(tmp, "home") },
    }
  );
  void scanWithRedirect;
  const stdout = readFileSync(stdoutPath, "utf8");
  const stderr = readFileSync(stderrPath, "utf8");
  const parsed = JSON.parse(stdout);
  const evidence = {
    generatedAt,
    npm: npmView,
    cliVersion: version,
    jsonOk: Array.isArray(parsed),
    itemCount: parsed.length,
    stdoutHasScan: stdout.includes("[scan]"),
    stderrHasScan: stderr.includes("[scan]"),
    transcript: [
      "$ npm view skillshelper version dist-tags.latest --json",
      JSON.stringify(npmView, null, 2),
      "$ npm install --prefix <tmp>/install --cache <tmp>/npm-cache --prefer-online --omit=dev skillshelper@latest",
      "$ <tmp>/install/node_modules/.bin/skillshelper --version",
      version,
      "$ SKILLSHELPER_HOME=<tmp>/config HOME=<tmp>/home skillshelper scan --json > skills.json 2> scan.stderr.txt",
      `JSON OK: ${Array.isArray(parsed)} / ${parsed.length} item(s)`,
      stderr.trim(),
    ].join("\n"),
  };
  const jsonPath = join(evidenceRoot, `SH-003_install-scan_${today}.json`);
  const mdPath = join(evidenceRoot, `SH-003_install-scan_${today}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  writeFileSync(
    mdPath,
    `# SH-003 安装与扫描证据

生成时间：${generatedAt}

\`\`\`text
${evidence.transcript}
\`\`\`

结论：

- npm latest：${npmView.version} / ${npmView["dist-tags.latest"]}
- CLI：${version}
- stdout 含 \`[scan]\`：${evidence.stdoutHasScan}
- stderr 含 \`[scan]\`：${evidence.stderrHasScan}
- JSON 可解析：${evidence.jsonOk}
`,
    "utf8"
  );
  return { jsonPath, mdPath, evidence };
}

const generated = [];

for (const shot of shots) {
  const paths = shot.production?.asset_paths ?? {};
  const capturePath = resolveAsset(paths.capture);
  const selectPath = resolveAsset(paths.selects);
  const exportPath = resolveAsset(paths.export);
  const ratio = ratioFromPath(capturePath);
  const coverPath = join(coverRoot, `${shot.id}_${shot.title.replace(/[\\s、，。/]+/g, "-")}_${ratio}_${today}_v01.svg`);
  const edlPath = join(edlRoot, `${shot.id}_edit-decision-list_${today}_v01.md`);
  const subtitlePath = join(subtitleRoot, `${shot.id}_${ratio}_${today}_v01.srt`);

  renderPreview({ shot, outputPath: capturePath, ratio });
  remux(capturePath, selectPath);
  remux(capturePath, exportPath);
  writeCover({ shot, outputPath: coverPath, ratio });
  writeSubtitle({ shot, outputPath: subtitlePath });
  writeEditDecision({
    shot,
    outputPath: edlPath,
    assets: {
      capture: capturePath.replace(`${root}/`, ""),
      selects: selectPath.replace(`${root}/`, ""),
      export: exportPath.replace(`${root}/`, ""),
      cover: coverPath.replace(`${root}/`, ""),
      subtitle: subtitlePath.replace(`${root}/`, ""),
    },
  });

  generated.push({
    id: shot.id,
    title: shot.title,
    ratio,
    durationSeconds: Number(shot.duration_seconds ?? 8),
    assetType: "auto-preview",
    capture: capturePath.replace(`${root}/`, ""),
    selects: selectPath.replace(`${root}/`, ""),
    export: exportPath.replace(`${root}/`, ""),
    cover: coverPath.replace(`${root}/`, ""),
    subtitle: subtitlePath.replace(`${root}/`, ""),
    editDecisionList: edlPath.replace(`${root}/`, ""),
  });
}

const sh003 = collectSh003Evidence();
const index = {
  generatedAt,
  date: today,
  brand: catalog.brand,
  campaign: catalog.campaign,
  note: "自动生成的首发素材包：MP4/MOV 用于粗剪和占位，证据 JSON/Markdown 与封面 SVG 可版本化。",
  renderer: {
    ffmpegDrawtext: supportsDrawtext,
    videoTextMode: supportsDrawtext ? "burned-in" : "subtitle-and-cover",
  },
  shots: generated,
  evidence: {
    SH003: {
      json: sh003.jsonPath.replace(`${root}/`, ""),
      markdown: sh003.mdPath.replace(`${root}/`, ""),
      jsonOk: sh003.evidence.jsonOk,
      stdoutHasScan: sh003.evidence.stdoutHasScan,
      stderrHasScan: sh003.evidence.stderrHasScan,
      cliVersion: sh003.evidence.cliVersion,
      npm: sh003.evidence.npm,
    },
  },
};

const indexPath = join(productionKitRoot, `launch-asset-index_${today}.json`);
writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

writeFileSync(
  join(productionKitRoot, `launch-asset-index_${today}.md`),
  `# SkillsHelper 首发素材包索引

生成时间：${generatedAt}

本素材包一次性覆盖 SH-001 到 SH-008。视频文件用于粗剪、节奏占位和封面/字幕预演；正式发布前，涉及真实产品运行的镜头仍以真实录屏或本目录 evidence 为准。

## 镜头素材

| 镜头 | 标题 | 比例 | capture | export | 封面 |
| --- | --- | --- | --- | --- | --- |
${generated
  .map((item) => `| ${item.id} | ${item.title} | ${item.ratio} | \`${item.capture}\` | \`${item.export}\` | \`${item.cover}\` |`)
  .join("\n")}

## 真实证据

- SH-003 证据 JSON：\`${index.evidence.SH003.json}\`
- SH-003 证据说明：\`${index.evidence.SH003.markdown}\`
- CLI 版本：${index.evidence.SH003.cliVersion}
- stdout 含 \`[scan]\`：${index.evidence.SH003.stdoutHasScan}
- stderr 含 \`[scan]\`：${index.evidence.SH003.stderrHasScan}
`,
  "utf8"
);

writeFileSync(join(productionKitRoot, "latest.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(JSON.stringify(index, null, 2));
