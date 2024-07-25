// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{process::Command, thread, time};

use serde::{Deserialize, Serialize};
use user_applications::{get_applications_by_names, Application};

mod user_applications;

#[tauri::command]
fn validate_project_path(project_path: &str) -> anyhow_tauri::TAResult<bool> {
    let path = std::path::Path::new(project_path);
    Ok(path.exists() && path.is_dir())
}

#[tauri::command]
fn run_command(command: &str, args: Vec<String>) -> anyhow_tauri::TAResult<u32> {
    let mut cmd = Command::new("open");
    cmd.arg("-a");
    cmd.arg(command);
    cmd.args(args);

    println!("{:?}", cmd);
    let child = cmd.spawn().expect("Failed to execute command"); // TODO: handle error
    let pid = child.id();
    Ok(pid)
}

#[tauri::command]
fn open_terminal_by_project_id(id: &str) -> anyhow_tauri::TAResult<()> {
    let projects = read_projects()?;
    let project = projects.iter().find(|project| project.id == id);
    if let Some(project) = project {
        // 打开终端
        let _pid = run_command(&project.terminal, vec![project.project_path.clone()])?;
        // 执行 apple script
        if !project.start_command.is_empty() {
            let apple_script = format!(
                r#"
                tell application "{}"
                    delay 1
                    tell application "System Events"
                        keystroke "{}"
                        key code 36 -- Enter key
                    end tell
                end tell
            "#,
                project.terminal, project.start_command
            );

            let output = Command::new("osascript")
                .arg("-e")
                .arg(apple_script)
                .output()
                .expect("Failed to execute AppleScript"); // TODO: handle error

            println!("Output: {:?}", output);
        }
    }
    Ok(())
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

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectInfo {
    id: String,
    #[serde(rename = "projectName")]
    project_name: String,
    #[serde(rename = "projectPath")]
    project_path: String,
    // #[serde(rename = "editor")]
    editor: String,
    // #[serde(rename = "terminal")]
    terminal: String,
    #[serde(rename = "startCommand")]
    start_command: String,
}

const DEFAULT_HOME_DIR: &str = "/Users";
const POKE_DUCK_DIR: &str = ".poke-duck";
const PROJECTS_FILE: &str = "projects.json";

pub fn get_home_dir() -> std::path::PathBuf {
    dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from(DEFAULT_HOME_DIR))
}

pub fn get_poke_duck_dir() -> std::path::PathBuf {
    get_home_dir().join(POKE_DUCK_DIR)
}

fn project_file_ready() -> anyhow::Result<()> {
    // 判断 home_dir/.poke-duck/projects.json 文件是否存在，这里的问题是，.poke-duck 文件夹可能都不存在
    let poke_duck_dir = get_poke_duck_dir();

    if !poke_duck_dir.exists() {
        std::fs::create_dir(&poke_duck_dir)?;
    }

    let projects_file = poke_duck_dir.join(PROJECTS_FILE);
    if !projects_file.exists() {
        std::fs::write(&projects_file, "[]")?;
    }
    Ok(())
}

fn read_projects() -> anyhow::Result<Vec<ProjectInfo>> {
    project_file_ready()?;

    let projects_file = get_poke_duck_dir().join(PROJECTS_FILE);
    let content = std::fs::read_to_string(&projects_file)?;
    let projects: Vec<ProjectInfo> = serde_json::from_str(&content)?;
    Ok(projects)
}

fn write_projects(projects: Vec<ProjectInfo>) -> anyhow::Result<()> {
    let projects_file = get_poke_duck_dir().join(PROJECTS_FILE);
    let content = serde_json::to_string(&projects)?;
    std::fs::write(&projects_file, content)?;
    Ok(())
}

#[tauri::command]
async fn add_project(project_info: ProjectInfo) -> anyhow_tauri::TAResult<()> {
    let mut projects = read_projects()?;
    projects.push(project_info);
    write_projects(projects)?;
    Ok(())
}

#[tauri::command]
async fn update_project(project_info: ProjectInfo) -> anyhow_tauri::TAResult<()> {
    let mut projects = read_projects()?;
    let index = projects
        .iter()
        .position(|project| project.id == project_info.id);
    if let Some(index) = index {
        projects[index] = project_info;
        write_projects(projects)?;
    }
    Ok(())
    // TODO: handle error
}

#[derive(Debug, Deserialize, Serialize)]
struct ProjectData {
    data: Vec<ProjectInfo>,
    total: usize,
    current: usize,
    page_size: usize,
}

#[tauri::command]
fn get_projects() -> anyhow_tauri::TAResult<ProjectData> {
    let projects = read_projects()?;
    let project_data = ProjectData {
        current: 0,
        total: projects.len(),
        page_size: projects.len(),
        data: projects,
    };
    Ok(project_data)
}

#[tauri::command]
fn remove_projects(ids: Vec<String>) -> anyhow_tauri::TAResult<()> {
    let mut projects = read_projects()?;
    projects.retain(|project| !ids.contains(&project.id));
    write_projects(projects)?;
    Ok(())
}

#[tauri::command]
fn clear_data() -> anyhow_tauri::TAResult<()> {
    let poke_duck_dir = get_poke_duck_dir();
    if poke_duck_dir.exists() {
        let _ = std::fs::remove_dir_all(&poke_duck_dir);
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            validate_project_path,
            run_command,
            get_terminal_applications,
            get_editor_applications,
            add_project,
            update_project,
            get_projects,
            remove_projects,
            clear_data,
            open_terminal_by_project_id,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
