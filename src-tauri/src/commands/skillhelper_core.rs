//! SkillHelper 核心桥接：桌面壳通过随包 sidecar 调用既有扫描与翻译模块。
//!
//! sidecar 在构建期由 Bun 编译为目标平台单文件可执行程序；运行时不依赖
//! 用户机器安装 Node、Bun 或 Fastify。

use serde_json::{json, Value};
use tauri_plugin_shell::ShellExt;

async fn invoke_worker(app: tauri::AppHandle, request: Value) -> Result<Value, String> {
    let output = app
        .shell()
        .sidecar("skillhelper-core")
        .map_err(|error| format!("无法定位 SkillHelper sidecar：{error}"))?
        .arg(request.to_string())
        .output()
        .await
        .map_err(|error| format!("无法启动 SkillHelper sidecar：{error}"))?;

    let stdout = String::from_utf8(output.stdout)
        .map_err(|error| format!("SkillHelper 核心输出不是 UTF-8：{error}"))?;
    let response = parse_worker_response(&stdout)?;

    if response.get("ok").and_then(Value::as_bool) == Some(true) {
        return response
            .get("result")
            .cloned()
            .ok_or_else(|| "SkillHelper 核心缺少结果".to_string());
    }

    Err(response
        .get("error")
        .and_then(Value::as_str)
        .unwrap_or("SkillHelper 核心执行失败")
        .to_string())
}

fn parse_worker_response(stdout: &str) -> Result<Value, String> {
    serde_json::from_str(stdout.trim())
        .map_err(|error| format!("SkillHelper 核心返回格式错误：{error}"))
}

#[tauri::command]
pub async fn scan_skillhelper_catalog(app: tauri::AppHandle) -> Result<Value, String> {
    invoke_worker(app, json!({ "operation": "scan" })).await
}

#[tauri::command]
pub async fn translate_skillhelper_text(app: tauri::AppHandle, text: String) -> Result<Value, String> {
    invoke_worker(app, json!({ "operation": "translate", "text": text })).await
}

#[cfg(test)]
mod tests {
    use super::parse_worker_response;

    #[test]
    fn parses_single_json_line_from_sidecar() {
        let response = parse_worker_response("{\"ok\":true,\"result\":{\"items\":[]}}\n")
            .expect("应解析 sidecar JSON 响应");
        assert_eq!(response["ok"], true);
        assert_eq!(response["result"]["items"], serde_json::json!([]));
    }
}
