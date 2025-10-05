// src/commands/import_export_commands.rs 
use crate::models::ImportResult;
use crate::states::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn export_vault(
    app_state: State<'_, Arc<AppState>>,
) -> Result<String, String> {
    app_state.export_vault().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_box_as_env(
    box_id: String,
    prefix: Option<String>,
    app_state: State<'_, Arc<AppState>>,
) -> Result<String, String> {
    app_state
        .export_box_as_env(box_id, prefix)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_vault(
    json_data: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<ImportResult, String> {
    app_state
        .import_vault(&json_data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_env_to_box(
    env_content: String,
    target_box_id: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<ImportResult, String> {
    app_state
        .import_env_to_box(&env_content, target_box_id)
        .await
        .map_err(|e| e.to_string())
}
