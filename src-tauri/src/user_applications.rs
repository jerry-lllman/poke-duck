use serde::Serialize;

// --------------- app start ---------------
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Application {
    name: String,
    path: String,
    icon: String,
    #[serde(rename = "executeName")]
    execute_name: String,
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

    // 从 Contents/Info.plist 文件中获取应用程序
    // let info_plist_path = format!("{}/Contents/Info.plist", app_dir);
    // let info_plist = plist::Value::from_file(info_plist_path)?;
    // let execute_name = info_plist
    //     .as_dictionary()
    //     .and_then(|dict| dict.get("CFBundleName"))
    //     .and_then(|value| value.as_string())
    //     .unwrap_or(&app_name);

    Ok(Application {
        name: app_name.clone(),
        path: app_dir.clone(),
        icon: "".to_string(),
        execute_name: app_name.clone(),
    })
}

// fn add_app_icon(path: &String) -> anyhow::Result<String> {
//     unimplemented!()
// }
// --------------- app end ---------------
