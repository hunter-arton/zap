// src/commands/auth_commands.rs

use crate::models::SessionInfo;
use crate::states::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn initialize_app(app_state: State<'_, Arc<AppState>>) -> Result<bool, String> {
    app_state.initialize().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn unlock_vault(
    password: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<bool, String> {
    app_state.unlock(&password).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lock_vault(app_state: State<'_, Arc<AppState>>) -> Result<(), String> {
    app_state.lock();
    Ok(())
}

#[tauri::command]
pub async fn is_vault_locked(app_state: State<'_, Arc<AppState>>) -> Result<bool, String> {
    Ok(app_state.is_locked())
}

#[tauri::command]
pub async fn verify_master_password(
    password: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    app_state
        .verify_password(&password)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_session_info(app_state: State<'_, Arc<AppState>>) -> Result<SessionInfo, String> {
    Ok(app_state.get_session_info())
}
