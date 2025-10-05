// src/commands/log_commands.r

use crate::models::LogEntry;
use crate::states::AppState;
use std::sync::Arc;
use tauri::State;

/// Get all logs
#[tauri::command]
pub async fn get_all_logs(app_state: State<'_, Arc<AppState>>) -> Result<Vec<LogEntry>, String> {
    app_state.get_all_logs().await.map_err(|e| e.to_string())
}

/// Clear all logs
#[tauri::command]
pub async fn clear_all_logs(
    password: String,
    app_state: State<'_, Arc<AppState>>,
) -> Result<usize, String> {
    app_state
        .clear_all_logs(&password)
        .await
        .map_err(|e| e.to_string())
}

/// Export logs
#[tauri::command]
pub async fn export_logs(app_state: State<'_, Arc<AppState>>) -> Result<String, String> {
    app_state.export_logs().await.map_err(|e| e.to_string())
}
