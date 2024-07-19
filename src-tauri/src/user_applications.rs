use serde::Serialize;

// --------------- app start ---------------
#[derive(Debug, Serialize, Clone)]
pub struct Application {
    name: String,
    path: String,
    icon: String,
    execute_path: String,
}

pub async fn get_applications_by_names(name_list: Vec<&str>) -> anyhow::Result<Vec<Application>> {
    let results = get_applications().await?;
    let mut target_applications = Vec::new();

    name_list.iter().for_each(|name| {
        let app = results.iter().find(|app| app.name == *name);
        if let Some(app) = app {
            target_applications.push(app.clone());
        };
    });

    Ok(target_applications)
}
// 通过 get_applications 获取到的是应用程序的根目录，即 /Applications/XXXX.app，执行应用程序的路径需要在后面 添加上 /Contents/MacOS/XXXX
// /Applications/NeteaseMusic.app/Contents/MacOS/NeteaseMusic

pub async fn get_applications() -> anyhow::Result<Vec<Application>> {
    let results = get_applications_dirs().await?;

    let results = results
        .iter()
        .map(|app_dir| -> anyhow::Result<Application> {
            Ok(transform_app_dir_to_application(app_dir)?)
        })
        .collect::<anyhow::Result<Vec<Application>>>()?;

    Ok(results)
}

async fn get_applications_dirs() -> anyhow::Result<Vec<String>> {
    let handle = tokio::task::spawn_blocking(|| -> anyhow::Result<Vec<String>> {
        let apps_path = [
            "/Applications",
            // &format!("{}/Applications", std::env::var("HOME").unwrap()),
            "/System/Applications",
            "/System/Applications/Utilities",
        ];

        let mut apps_dirs = Vec::new();
        for app_path in &apps_path {
            if std::path::Path::new(app_path).exists() {
                let entries = std::fs::read_dir(app_path)?;
                for entry in entries {
                    if let Ok(entry) = entry {
                        if entry
                            .path()
                            .extension()
                            .map(|s| s == "app")
                            .unwrap_or(false)
                        {
                            let path_str = entry.path().to_string_lossy().to_string();
                            apps_dirs.push(path_str);
                        }
                    }
                }
            }
        }
        Ok(apps_dirs)
    });

    let apps_dirs = handle.await??;
    Ok(apps_dirs)
}

// 将应用程序的根目录转换为 Application 结构体
fn transform_app_dir_to_application(app_dir: &String) -> anyhow::Result<Application> {
    // Ok(applications)
    let app_name = app_dir
        .split("/")
        .last()
        .ok_or(anyhow::anyhow!("Invalid application directory"))?
        .replace(".app", "");
    // let icon = format!("{}/Contents/Resources/AppIcon.icns", app_dir);

    Ok(Application {
        name: app_name.clone(),
        path: app_dir.clone(),
        icon: "".to_string(),
        execute_path: format!("{}/Contents/MacOS/{}", app_dir, app_name),
    })
}

// fn add_app_icon(path: &String) -> anyhow::Result<String> {
//     unimplemented!()
// }
// --------------- app end ---------------
