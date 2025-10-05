// src/commands/secret_commands.rs

use crate::models::Secret;
use crate::states::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_all_secrets(app_state: State<'_, Arc<AppState>>) -> Result<Vec<Secret>, String> {
    app_state.get_all_secrets().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_secrets_by_box_id(
    box_id: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<Vec<Secret>, String> {
    app_state
        .get_secrets_by_box_id(&box_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_secret(
    box_id: String,
    name: String,
    value: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<String, String> {
    app_state
        .create_secret(box_id, name, value)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_secret(
    secret_id: String,
    name: Option<String>,
    value: Option<String>,
    app_state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    app_state
        .update_secret(&secret_id, name, value)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_secret(
    secret_id: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    app_state
        .delete_secret(&secret_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_selected_secrets(
    secret_ids: Vec<String>,
    app_state: State<'_, Arc<AppState>>,
) -> Result<Vec<String>, String> {
    app_state
        .delete_selected_secrets(secret_ids)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn copy_secrets_to_box(
    secret_ids: Vec<String>,
    target_box_id: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<Vec<String>, String> {
    app_state
        .copy_secrets_to_box(secret_ids, target_box_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reveal_secret_value(
    secret_id: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<String, String> {
    app_state
        .reveal_secret_value(&secret_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_secrets_in_box(
    box_id: String,
    query: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<Vec<Secret>, String> {
    app_state
        .search_secrets_in_box(box_id, query)
        .await
        .map_err(|e| e.to_string())
}
