//! SkillHelper 本地资产目录扫描。
//!
//! 首期只读地发现 Claude 的技能、Agent、插件、MCP 名称和 CLI，
//! 并确认 ChatGPT Desktop 的本地数据目录。扫描结果不返回 MCP 配置内容，
//! 避免将令牌或环境变量带到前端。

use serde::Serialize;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

const MAX_SCAN_DEPTH: usize = 8;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogItem {
    pub id: String,
    pub app: String,
    pub kind: String,
    pub name: String,
    pub description: Option<String>,
    pub path: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogScanResult {
    pub items: Vec<CatalogItem>,
    pub issues: Vec<String>,
}

#[tauri::command]
pub fn scan_catalog() -> Result<CatalogScanResult, String> {
    let home = dirs::home_dir().ok_or_else(|| "无法确定当前用户目录".to_string())?;
    let mut items = Vec::new();
    let mut issues = Vec::new();

    scan_claude(&home, &mut items, &mut issues);
    scan_chatgpt(&home, &mut items, &mut issues);
    scan_claude_cli(&mut items);

    items.sort_by(|left, right| left.kind.cmp(&right.kind).then(left.name.cmp(&right.name)));
    Ok(CatalogScanResult { items, issues })
}

fn scan_claude(home: &Path, items: &mut Vec<CatalogItem>, issues: &mut Vec<String>) {
    let claude_dir = home.join(".claude");
    if !claude_dir.is_dir() {
        issues.push("未发现 Claude Code 配置目录 ~/.claude".to_string());
        return;
    }

    let skills_dir = claude_dir.join("skills");
    for skill_file in collect_named_files(&skills_dir, "SKILL.md", MAX_SCAN_DEPTH) {
        let name = skill_file
            .parent()
            .and_then(Path::file_name)
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_else(|| "未命名技能".to_string());
        items.push(CatalogItem {
            id: format!("claude:skill:{}", skill_file.display()),
            app: "claude".to_string(),
            kind: "skill".to_string(),
            name,
            description: read_frontmatter_description(&skill_file),
            path: skill_file.to_string_lossy().to_string(),
            status: "discovered".to_string(),
        });
    }

    let agents_dir = claude_dir.join("agents");
    for agent_file in collect_markdown_files(&agents_dir, MAX_SCAN_DEPTH) {
        let name = agent_file
            .file_stem()
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_else(|| "未命名 Agent".to_string());
        items.push(CatalogItem {
            id: format!("claude:agent:{}", agent_file.display()),
            app: "claude".to_string(),
            kind: "plugin".to_string(),
            name,
            description: read_frontmatter_description(&agent_file),
            path: agent_file.to_string_lossy().to_string(),
            status: "discovered".to_string(),
        });
    }

    let plugins_dir = claude_dir.join("plugins").join("cache");
    for manifest in collect_named_files(&plugins_dir, "plugin.json", MAX_SCAN_DEPTH) {
        if manifest
            .parent()
            .and_then(Path::file_name)
            .is_none_or(|name| name != ".claude-plugin")
        {
            continue;
        }
        let metadata = fs::read_to_string(&manifest)
            .ok()
            .and_then(|content| serde_json::from_str::<serde_json::Value>(&content).ok());
        let name = metadata
            .as_ref()
            .and_then(|value| value.get("name"))
            .and_then(serde_json::Value::as_str)
            .map(ToString::to_string)
            .or_else(|| {
                manifest
                    .parent()
                    .and_then(Path::parent)
                    .and_then(Path::file_name)
                    .map(|value| value.to_string_lossy().to_string())
            })
            .unwrap_or_else(|| "未命名插件".to_string());
        let description = metadata
            .as_ref()
            .and_then(|value| value.get("description"))
            .and_then(serde_json::Value::as_str)
            .map(ToString::to_string);
        items.push(CatalogItem {
            id: format!("claude:plugin:{}", manifest.display()),
            app: "claude".to_string(),
            kind: "plugin".to_string(),
            name,
            description,
            path: manifest.to_string_lossy().to_string(),
            status: "discovered".to_string(),
        });
    }

    let claude_config = home.join(".claude.json");
    if let Ok(content) = fs::read_to_string(&claude_config) {
        match serde_json::from_str::<serde_json::Value>(&content) {
            Ok(config) => {
                if let Some(servers) = config.get("mcpServers").and_then(serde_json::Value::as_object) {
                    for name in servers.keys() {
                        items.push(CatalogItem {
                            id: format!("claude:mcp:{name}"),
                            app: "claude".to_string(),
                            kind: "mcp".to_string(),
                            name: name.to_string(),
                            description: None,
                            path: claude_config.to_string_lossy().to_string(),
                            status: "discovered".to_string(),
                        });
                    }
                }
            }
            Err(_) => issues.push("Claude MCP 配置无法解析，已跳过内容读取".to_string()),
        }
    }
}

fn scan_chatgpt(home: &Path, items: &mut Vec<CatalogItem>, issues: &mut Vec<String>) {
    let app_support = home
        .join("Library")
        .join("Application Support")
        .join("com.openai.chat");
    if app_support.exists() {
        items.push(CatalogItem {
            id: "chatgpt:desktop".to_string(),
            app: "chatgpt".to_string(),
            kind: "app".to_string(),
            name: "ChatGPT Desktop".to_string(),
            description: Some("已发现本地数据目录；技能、MCP 和插件格式等待适配器确认".to_string()),
            path: app_support.to_string_lossy().to_string(),
            status: "pending_format".to_string(),
        });
    } else {
        issues.push("未发现 ChatGPT Desktop 数据目录".to_string());
    }
}

fn scan_claude_cli(items: &mut Vec<CatalogItem>) {
    if let Some(path) = find_executable("claude") {
        items.push(CatalogItem {
            id: "claude:cli".to_string(),
            app: "claude".to_string(),
            kind: "cli".to_string(),
            name: "claude".to_string(),
            description: Some("已在 PATH 中发现 Claude CLI；未执行任何命令".to_string()),
            path: path.to_string_lossy().to_string(),
            status: "available".to_string(),
        });
    }
}

fn collect_named_files(root: &Path, target_name: &str, depth: usize) -> Vec<PathBuf> {
    collect_files(root, depth, &|path| {
        path.file_name().is_some_and(|name| name == target_name)
    })
}

fn collect_markdown_files(root: &Path, depth: usize) -> Vec<PathBuf> {
    collect_files(root, depth, &|path| {
        path.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("md"))
    })
}

fn collect_files(root: &Path, depth: usize, predicate: &dyn Fn(&Path) -> bool) -> Vec<PathBuf> {
    if depth == 0 || !root.is_dir() {
        return Vec::new();
    }

    let mut files = Vec::new();
    let Ok(entries) = fs::read_dir(root) else {
        return files;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_symlink() {
            continue;
        }
        if path.is_dir() {
            files.extend(collect_files(&path, depth - 1, predicate));
        } else if path.is_file() && predicate(&path) {
            files.push(path);
        }
    }
    files
}

fn read_frontmatter_description(path: &Path) -> Option<String> {
    let content = fs::read_to_string(path).ok()?;
    let frontmatter = content.strip_prefix("---")?.splitn(2, "---").next()?;
    frontmatter.lines().find_map(|line| {
        let (key, value) = line.split_once(':')?;
        (key.trim() == "description").then(|| value.trim().trim_matches('"').trim_matches('\'').to_string())
    })
}

fn find_executable(name: &str) -> Option<PathBuf> {
    let paths = env::var_os("PATH")?;
    env::split_paths(&paths)
        .map(|directory| directory.join(name))
        .find(|candidate| candidate.is_file())
}

#[cfg(test)]
mod tests {
    use super::read_frontmatter_description;
    use std::fs;

    #[test]
    fn reads_a_skill_frontmatter_description() {
        let directory = tempfile::tempdir().expect("创建临时目录");
        let skill = directory.path().join("SKILL.md");
        fs::write(&skill, "---\nname: demo\ndescription: 说明文本\n---\n正文")
            .expect("写入测试技能");

        assert_eq!(read_frontmatter_description(&skill).as_deref(), Some("说明文本"));
    }
}
