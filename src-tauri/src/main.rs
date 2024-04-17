// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn build_config_window(app: &tauri::App) -> tauri::Window {
    return tauri::WindowBuilder::new(app, "config", tauri::WindowUrl::App("index.html".into()))
        .build()
        .unwrap();
}

fn build_screensaver_window(app: &tauri::App) -> tauri::Window {
    let screensaver_window = tauri::WindowBuilder::new(
        app,
        "screensaver",
        tauri::WindowUrl::App("screensaver.html".into()),
    )
    .build()
    .unwrap();

    // screensaver_window.set_fullscreen(true).unwrap();

    return screensaver_window;
}

fn main() {
    let app = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    let mode = &app
        .get_cli_matches()
        .unwrap()
        .args
        .get("mode")
        .and_then(|argument| match argument.value.clone() {
            serde_json::Value::String(string) => Some(string),
            _ => None,
        })
        .unwrap_or("/c".to_owned());
    let hwnd_option = &app
        .get_cli_matches()
        .unwrap()
        .args
        .get("hwnd")
        .and_then(|argument| match argument.value.clone() {
            serde_json::Value::String(string) => {
                Some(str::parse::<i32>(string.as_str()).expect("hwnd must be an integer"))
            }
            _ => None,
        });

    match mode.as_str() {
        // Preview mode
        "/p" => {
            let preview_window_handle = hwnd_option.expect("hwnd must be present for preview mode");
            let screensaver_window = build_screensaver_window(&app);
            let hwnd = screensaver_window.hwnd();
            // TODO: figure out what crate this HWND is from, and if it exposes the api from user32
        }
        // Normal running mode
        "/s" => {
            build_screensaver_window(&app);
        }
        // "/c" Configuration mode
        _ => {
            build_config_window(&app);
        }
    }

    app.run(|_, _| {});
}
