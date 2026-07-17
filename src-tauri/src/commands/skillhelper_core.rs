//! SkillHelper 核心桥接：桌面壳通过本地 Node 进程调用既有扫描与翻译模块。
//!
//! 此阶段只用于 Tauri 开发运行；发布版需要将 Node 运行时和此脚本打包为 sidecar，
//! 该工作会在发布工程切片完成前保持显式未完成状态。

use serde_json::{json, Value};
use std::path::PathBuf;
use std::process::Command;

fn worker_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("src-tauri 必须位于项目根目录下")
        .join("scripts")
        .join("desktop-core.mjs")
}

fn invoke_worker(request: Value) -> Result<Value, String> {
    let output = Command::new("node")
        .arg(worker_path())
        .arg(request.to_string())
        .output()
        .map_err(|error| format!("无法启动本地 SkillHelper 核心：{error}"))?;

    let stdout = String::from_utf8(output.stdout)
        .map_err(|error| format!("SkillHelper 核心输出不是 UTF-8：{error}"))?;
    let response: Value = serde_json::from_str(stdout.trim())
        .map_err(|error| format!("SkillHelper 核心返回格式错误：{error}"))?;

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

#[tauri::command]
pub fn scan_skillhelper_catalog() -> Result<Value, String> {
    invoke_worker(json!({ "operation": "scan" }))
}

#[tauri::command]
pub fn translate_skillhelper_text(text: String) -> Result<Value, String> {
    invoke_worker(json!({ "operation": "translate", "text": text }))
}
