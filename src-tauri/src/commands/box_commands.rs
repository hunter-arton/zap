// src/commands/box_commands.rs

use crate::models::Box;
use crate::states::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_all_boxes(app_state: State<'_, Arc<AppState>>) -> Result<Vec<Box>, String> {
    app_state.get_all_boxes().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_box(box_id: String, app_state: State<'_, Arc<AppState>>) -> Result<Box, String> {
    app_state.get_box(&box_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_box(
    name: String,
    description: Option<String>,
    tags: Vec<String>,
    dev_mode: bool, 
    app_state: State<'_, Arc<AppState>>,
) -> Result<String, String> {
    app_state
        .create_box(name, description, tags, dev_mode)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_box(
    box_id: String,
    name: Option<String>,
    description: Option<Option<String>>,
    tags: Option<Vec<String>>,
    dev_mode: Option<bool>,
    app_state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    app_state
        .update_box(&box_id, name, description, tags, dev_mode)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_box(
    box_id: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    app_state
        .delete_box(&box_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_selected_boxes(
    box_ids: Vec<String>,
    app_state: State<'_, Arc<AppState>>,
) -> Result<Vec<String>, String> {
    app_state
        .delete_selected_boxes(box_ids)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_boxes_global(
    query: String,
    tags: Vec<String>,
    app_state: State<'_, Arc<AppState>>,
) -> Result<Vec<Box>, String> {
    app_state
        .search_boxes_global(query, tags)
        .await
        .map_err(|e| e.to_string())
}
