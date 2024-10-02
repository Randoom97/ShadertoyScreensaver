// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use shadertoy_api::ShadertoyAPI;
use tauri::{PhysicalPosition, Position};
use windows::Win32::{
    Foundation::{HWND, RECT},
    UI::WindowsAndMessaging::{
        GetClientRect, GetWindowLongA, SetParent, SetWindowLongA, GWL_STYLE, WS_CHILD,
    },
};

mod secret;
mod shadertoy_api;
mod tauri_commands;

fn build_config_window(app: &tauri::App) -> tauri::Window {
    return tauri::WindowBuilder::new(app, "config", tauri::WindowUrl::App("config.html".into()))
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

    screensaver_window.set_fullscreen(true).unwrap();

    return screensaver_window;
}

fn main() {
    let app = tauri::Builder::default()
        .manage(ShadertoyAPI::new())
        .invoke_handler(tauri::generate_handler![
            tauri_commands::get_shaders,
            tauri_commands::get_shader,
            tauri_commands::get_media_path,
        ])
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
            serde_json::Value::String(string) => Some(
                str::parse::<isize>(string.as_str()).expect("hwnd must be parseable to an isize"),
            ),
            _ => None,
        });

    match mode.as_str() {
        // Preview mode
        "/p" => {
            let screensaver_window = build_screensaver_window(&app);

            let preview_window_handle =
                HWND(hwnd_option.expect("hwnd must be present for preview mode"));
            let window_handle = screensaver_window.hwnd().unwrap();

            unsafe {
                // set the preview window as the parent of this window
                SetParent(window_handle, preview_window_handle);

                // make this a child window so it will close when the parent dialog closes
                SetWindowLongA(
                    window_handle,
                    GWL_STYLE,
                    GetWindowLongA(window_handle, GWL_STYLE) | WS_CHILD.0 as i32,
                );

                // place our window inside the parent
                let mut parent_rectangle: RECT = RECT::default();
                GetClientRect(preview_window_handle, &mut parent_rectangle);
                screensaver_window
                    .set_position(Position::Physical(PhysicalPosition::new(
                        parent_rectangle.right - parent_rectangle.left,
                        parent_rectangle.bottom - parent_rectangle.top,
                    )))
                    .unwrap();
            }
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
