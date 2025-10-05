// src/commands/stats_commands.rs

use crate::services::VaultStats;
use crate::states::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_vault_stats(app_state: State<'_, Arc<AppState>>) -> Result<VaultStats, String> {
    app_state.get_vault_stats().await.map_err(|e| e.to_string())
}
