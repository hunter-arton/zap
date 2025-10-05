// src-tauri/src/lib.rs
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Manager;

pub mod commands;
pub mod models;
pub mod services;
pub mod states;
pub mod utils;
pub mod window_manager;

use crate::states::{AppState, DevState};
use crate::utils::path_resolvers::{ensure_directories_exist, get_app_data_dir_legacy};
use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(setup_desktop)
        .invoke_handler(tauri::generate_handler![
            // Auth Commands
            initialize_app,
            unlock_vault,
            lock_vault,
            is_vault_locked,
            verify_master_password,
            get_session_info,
            // Box Commands
            get_all_boxes,
            get_box,
            create_box,
            update_box,
            delete_box,
            delete_selected_boxes,
            search_boxes_global,
            // Secret Commands
            get_all_secrets,
            get_secrets_by_box_id,
            create_secret,
            update_secret,
            delete_secret,
            delete_selected_secrets,
            copy_secrets_to_box,
            reveal_secret_value,
            search_secrets_in_box,
            // Import/Export Commands
            export_vault,
            export_box_as_env,
            import_vault,
            import_env_to_box,
            // Dev Commands
            create_session,
            get_all_sessions,
            get_dev_session_info,
            stop_session,
            clear_all_sessions,
            has_any_sessions,
            get_available_dev_boxes,
            get_dev_stats,
            validate_session_name,
            validate_session_key,
            // Log Commands
            get_all_logs,
            clear_all_logs,
            export_logs,
            // Stats Commands
            get_vault_stats,
            // Settings Commands
            get_settings,
            update_settings,
            // Window Commands
            toggle_visibility,
            get_window_state,
            initialize_right_edge_position,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_desktop(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Ensure directory structure exists
    ensure_directories_exist().map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

    // Get app data directory
    let _app_data_dir = get_app_data_dir()?;

    // Initialize AppState
    let app_state = Arc::new(AppState::new());
    app.manage(app_state.clone());

    // Initialize DevState
    let dev_state = DevState::new(Arc::clone(&app_state));
    app.manage(tokio::sync::Mutex::new(dev_state));

    // Setup global shortcuts and window management
    setup_global_shortcuts(app)?;
    setup_window_positioning(app)?;

    Ok(())
}

fn setup_global_shortcuts(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{
        Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
    };

    let toggle_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyZ);
    let app_handle = app.handle().clone();

    app.handle().plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |_app, shortcut, event| {
                if shortcut == &toggle_shortcut && event.state() == ShortcutState::Pressed {
                    let app_clone = app_handle.clone();
                    tauri::async_runtime::spawn(async move {
                        let _ = window_manager::handle_toggle_visibility(app_clone);
                    });
                }
            })
            .build(),
    )?;

    app.global_shortcut().register(toggle_shortcut)?;
    Ok(())
}

fn setup_window_positioning(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    window_manager::WindowManager::initialize_right_edge(&app.handle())?;
    Ok(())
}

fn get_app_data_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_data_dir =
        get_app_data_dir_legacy().map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
    Ok(app_data_dir)
}

// Window Commands
#[tauri::command]
fn toggle_visibility(app: tauri::AppHandle) -> Result<(), String> {
    window_manager::handle_toggle_visibility(app)
}

#[tauri::command]
fn get_window_state(app: tauri::AppHandle) -> Result<window_manager::WindowState, String> {
    window_manager::handle_get_window_state(app)
}

#[tauri::command]
fn initialize_right_edge_position(app: tauri::AppHandle) -> Result<(), String> {
    window_manager::handle_initialize_right_edge(app)
}
