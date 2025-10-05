// src/commands/dev_commands.rs

use crate::models::{ActiveSessionInfo, DevStats};
use crate::states::{DevBoxInfo, DevState};
use tauri::State;

#[tauri::command]
pub async fn create_session(
    session_name: String,
    box_id: String,
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<(), String> {
    let dev_state_guard = dev_state.lock().await;
    dev_state_guard
        .create_session(session_name, box_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_sessions(
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<Vec<ActiveSessionInfo>, String> {
    let dev_state_guard = dev_state.lock().await;
    dev_state_guard
        .get_all_sessions()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_dev_session_info(
    session_name: String,
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<Option<ActiveSessionInfo>, String> {
    let dev_state_guard = dev_state.lock().await;
    dev_state_guard
        .get_session_info(&session_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_session(
    session_name: String,
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<(), String> {
    let dev_state_guard = dev_state.lock().await;
    dev_state_guard
        .stop_session(session_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_all_sessions(
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<(), String> {
    let dev_state_guard = dev_state.lock().await;
    dev_state_guard
        .clear_all_sessions()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn has_any_sessions(
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<bool, String> {
    let dev_state_guard = dev_state.lock().await;
    dev_state_guard
        .has_any_sessions()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_available_dev_boxes(
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<Vec<DevBoxInfo>, String> {
    let dev_state_guard = dev_state.lock().await;
    dev_state_guard
        .get_available_dev_boxes()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_dev_stats(
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<DevStats, String> {
    let dev_state_guard = dev_state.lock().await;
    dev_state_guard
        .get_dev_stats()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn validate_session_name(
    session_name: String,
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<bool, String> {
    let dev_state_guard = dev_state.lock().await;

    // Use the dedicated public method which handles both validation and the database check.
    dev_state_guard
        .is_session_name_available(&session_name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn validate_session_key(
    session_key_hex: String,
    dev_state: State<'_, tokio::sync::Mutex<DevState>>,
) -> Result<bool, String> {
    let dev_state_guard = dev_state.lock().await;
    match dev_state_guard.validate_session_key(&session_key_hex) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
