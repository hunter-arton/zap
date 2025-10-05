// src/commands/settings_commands.rs

use crate::models::Settings;
use crate::states::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_settings(app_state: State<'_, Arc<AppState>>) -> Result<Settings, String> {
    app_state.get_settings().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_settings(
    new_settings: Settings,
    app_state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    app_state
        .update_settings(new_settings)
        .await
        .map_err(|e| e.to_string())
}
