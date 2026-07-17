//! SkillHelper 桌面壳。
//!
//! 保留 cc-switch 的 Tauri 2 桌面基座，但产品运行时只暴露 SkillHelper
//! 的本地扫描与中文翻译命令，不初始化代理、Provider 或配置接管服务。

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan_skillhelper_catalog,
            commands::translate_skillhelper_text,
        ])
        .run(tauri::generate_context!())
        .expect("启动 SkillHelper 桌面应用失败");
}
