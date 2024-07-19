// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::Command;

use serde::Deserialize;
use user_applications::{get_applications_by_names, Application};

mod user_applications;

#[tauri::command]
fn validate_project_path(project_path: &str) -> anyhow_tauri::TAResult<bool> {
    let path = std::path::Path::new(project_path);
    Ok(path.exists() && path.is_dir())
}

#[tauri::command]
fn open_vscode(path: &str) {
    let _ = Command::new("code").arg(path).spawn();
    println!("Opening VSCode at {}", path);
}

const TERMINALS: [&str; 4] = ["Terminal", "iTerm", "Hyper", "Warp"];

#[tauri::command]
async fn get_terminal_applications() -> anyhow_tauri::TAResult<Vec<Application>> {
    let applications = get_applications_by_names(TERMINALS.to_vec()).await?;
    Ok(applications)
}

const EDITORS: [&str; 1] = ["Visual Studio Code"];

#[tauri::command]
async fn get_editor_applications() -> anyhow_tauri::TAResult<Vec<Application>> {
    let applications = get_applications_by_names(EDITORS.to_vec()).await?;
    Ok(applications)
}

#[derive(Debug, Deserialize)]
struct ProjectInfo {
    id: String,
    #[serde(rename = "projectName")]
    project_name: String,
    #[serde(rename = "projectPath")]
    project_path: String,
    editor_exec_path: String,
    terminal_exec_path: String,
}

#[tauri::command]
async fn add_project(project_info: ProjectInfo) -> anyhow_tauri::TAResult<()> {
    // 将这条数据存储到 home_dir/.poke-duck/projects.json 中
    // 这里需要先读取文件，然后将新的数据添加到文件中
    // 但是文件可能不存在，所以需要先判断文件是否存在，如果不存在则创建文件
    // 如果文件存在，则读取文件内容，然后将新的数据添加到文件中
    unimplemented!()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            validate_project_path,
            open_vscode,
            get_terminal_applications,
            get_editor_applications,
            add_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
