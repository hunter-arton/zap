// src/states/dev_state.rs

use crate::models::{ActiveSessionInfo, DevSession, DevStats, ZapError};
use crate::services::DevService;
use crate::states::AppState;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use crate::utils::path_resolvers::get_sessions_directory as get_shared_sessions_directory;


pub struct DevState {
    dev_service: DevService,
    pub(crate) app_state: Arc<AppState>,
}

#[derive(Serialize, Deserialize)]
struct CliSessionFile {
    pub session_name: String,
    pub box_name: String,
    pub session_key: String,
    pub encrypted_secrets: HashMap<String, String>,
    pub created_at: DateTime<Utc>,
}

impl DevState {
    pub fn new(app_state: Arc<AppState>) -> Self {
        Self {
            dev_service: DevService::new(),
            app_state,
        }
    }

    // Create session - writes to both database and session file for CLI
    pub async fn create_session(
        &self,
        session_name: String,
        box_id: String,
    ) -> Result<(), ZapError> {
        let master_key = self.app_state.get_master_key()?;
        let box_item = self.app_state.storage.get_box(&box_id)?;
        let box_secrets = self.app_state.storage.get_secrets_by_box_id(&box_id)?;

        let session = self.dev_service.create_session_from_box(
            session_name.clone(),
            &box_item,
            &box_secrets,
            &master_key,
        )?;

        // Save to database first
        self.app_state
            .storage
            .save_dev_session_by_name(&session_name, &session)?;

        // Then write the session file that CLI can read
        self.write_session_file_for_cli(&session)?;

        let _ = self.app_state.storage.log(
            "Create_Dev_Session".to_string(),
            format!(
                "Dev session '{}' created from box '{}'",
                session_name, box_item.name
            ),
            None,
        );

        Ok(())
    }

    // Stop session - removes from both database and session file
    pub async fn stop_session(&self, session_name: String) -> Result<(), ZapError> {
        // Get box name first to avoid borrow issues later
        let box_name = if let Some(session) = self
            .app_state
            .storage
            .get_dev_session_by_name(&session_name)?
        {
            Some(session.box_name.clone())
        } else {
            None
        };

        // Remove from database
        self.app_state
            .storage
            .delete_dev_session_by_name(&session_name)?;

        // Remove the CLI session file
        self.remove_session_file_for_cli(&session_name)?;

        let _ = self.app_state.storage.log(
            "Stop_Dev_Session".to_string(),
            format!("Dev session '{}' stopped", session_name),
            box_name,
        );

        Ok(())
    }

    // Clear all sessions - removes from both database and all session files
    pub async fn clear_all_sessions(&self) -> Result<(), ZapError> {
        let sessions = self.app_state.storage.get_all_dev_sessions()?;
        let session_count = sessions.len();
        let session_names: Vec<String> = sessions.keys().cloned().collect();

        // Clear from database
        self.app_state.storage.clear_all_dev_sessions()?;

        // Clear all CLI session files
        self.clear_all_session_files()?;

        let _ = self.app_state.storage.log(
            "Clear_All_Dev_Sessions".to_string(),
            format!("Cleared {} dev sessions", session_count),
            Some(session_names.join(", ")),
        );

        Ok(())
    }

    // Smart session listing - checks both database and file existence
    pub async fn get_all_sessions(&self) -> Result<Vec<ActiveSessionInfo>, ZapError> {
        let db_sessions = self.app_state.storage.get_all_dev_sessions()?;
        let mut active_sessions = Vec::new();
        let mut cleanup_needed = Vec::new();

        for (session_name, session) in db_sessions {
            // Check if the session file actually exists on disk
            let file_exists = self.session_file_exists(&session_name);

            if file_exists {
                // Session is truly active (both DB entry and file exist)
                active_sessions.push(ActiveSessionInfo {
                    session_name: session.session_name.clone(), // Clone to avoid move issues
                    box_name: session.box_name.clone(),         // Clone to avoid move issues
                    secrets_count: session.secrets_count(),
                    is_active: true,
                });
            } else {
                // Session file missing - CLI must have deleted it, mark for cleanup
                cleanup_needed.push(session_name);
            }
        }

        // Clean up orphaned database entries where files were deleted by CLI
        for session_name in cleanup_needed {
            println!("Cleaning up orphaned session: {}", session_name);
            let _ = self
                .app_state
                .storage
                .delete_dev_session_by_name(&session_name);
        }

        Ok(active_sessions)
    }

    // Smart session info - checks both database and file
    pub async fn get_session_info(
        &self,
        session_name: &str,
    ) -> Result<Option<ActiveSessionInfo>, ZapError> {
        if let Some(session) = self
            .app_state
            .storage
            .get_dev_session_by_name(session_name)?
        {
            // Check if session file actually exists on disk
            if self.session_file_exists(session_name) {
                // Clone fields instead of moving them so we can still call methods on session
                Ok(Some(ActiveSessionInfo {
                    session_name: session.session_name.clone(),
                    box_name: session.box_name.clone(),
                    secrets_count: session.secrets_count(),
                    is_active: true,
                }))
            } else {
                // Session file missing - clean up the database entry
                println!("Cleaning up orphaned session: {}", session_name);
                let _ = self
                    .app_state
                    .storage
                    .delete_dev_session_by_name(session_name);
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    // Smart session count - only counts sessions with both DB entry and file
    pub async fn has_any_sessions(&self) -> Result<bool, ZapError> {
        let sessions = self.get_all_sessions().await?;
        Ok(!sessions.is_empty())
    }

    // Check if specific session is truly active (both DB and file exist)
    pub async fn is_session_active(&self, session_name: &str) -> Result<bool, ZapError> {
        // Check database first
        if self
            .app_state
            .storage
            .get_dev_session_by_name(session_name)?
            .is_some()
        {
            // Then check if file also exists
            Ok(self.session_file_exists(session_name))
        } else {
            Ok(false)
        }
    }

    // Get available boxes that can be used for dev sessions
    pub async fn get_available_dev_boxes(&self) -> Result<Vec<DevBoxInfo>, ZapError> {
        let all_boxes = self.app_state.storage.get_all_boxes()?;
        let mut dev_boxes = Vec::new();

        for box_item in all_boxes {
            if box_item.dev_mode && !box_item.is_empty() {
                dev_boxes.push(DevBoxInfo {
                    id: box_item.id,
                    name: box_item.name,
                    description: box_item.description,
                    secrets_count: box_item.secrets_count,
                });
            }
        }

        Ok(dev_boxes)
    }

    // Get development statistics
    pub async fn get_dev_stats(&self) -> Result<DevStats, ZapError> {
        let vault_stats = self.app_state.storage.get_vault_stats()?;
        let active_sessions = self.get_all_sessions().await?; // Uses smart checking

        Ok(DevStats {
            total_boxes: vault_stats.total_boxes,
            dev_boxes: vault_stats.dev_boxes,
            secure_boxes: vault_stats.secure_boxes,
            total_secrets: vault_stats.total_secrets,
            active_sessions_count: active_sessions.len(), // Real active count
        })
    }

    // Validate session name format
    pub fn validate_session_name(&self, session_name: &str) -> Result<(), ZapError> {
        self.dev_service.validate_session_name(session_name)
    }

    // Check if session name is available for use
    pub async fn is_session_name_available(&self, session_name: &str) -> Result<bool, ZapError> {
        self.validate_session_name(session_name)?;
        let session_exists = self.app_state.storage.session_exists(session_name)?;
        Ok(!session_exists)
    }

    // Validate session key format for CLI
    pub fn validate_session_key(&self, session_key_hex: &str) -> Result<[u8; 32], ZapError> {
        self.dev_service.validate_session_key(session_key_hex)
    }

    // Session File Operations for CLI

    fn write_session_file_for_cli(&self, session: &DevSession) -> Result<(), ZapError> {
        let sessions_dir = self.get_sessions_directory()?;
        std::fs::create_dir_all(&sessions_dir)?;

        // Convert encrypted secrets to hex format for CLI
        let mut hex_secrets = HashMap::new();
        for (name, encrypted_data) in &session.encrypted_secrets {
            let serialized = serde_json::to_vec(encrypted_data)?;
            hex_secrets.insert(name.clone(), hex::encode(serialized));
        }

        let cli_session = CliSessionFile {
            session_name: session.session_name.clone(),
            box_name: session.box_name.clone(),
            session_key: hex::encode(session.session_key),
            encrypted_secrets: hex_secrets,
            created_at: chrono::Utc::now(),
        };

        let file_path = sessions_dir.join(format!("{}.json", session.session_name));
        let json_content = serde_json::to_string_pretty(&cli_session)?;

        // Write to temp file first, then rename for atomic operation
        let temp_path = file_path.with_extension("tmp");
        std::fs::write(&temp_path, json_content)?;

        // Set proper file permissions on Unix systems
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = std::fs::metadata(&temp_path)?.permissions();
            perms.set_mode(0o600); // Only owner can read/write
            std::fs::set_permissions(&temp_path, perms)?;
        }

        std::fs::rename(temp_path, file_path)?;
        Ok(())
    }

    fn remove_session_file_for_cli(&self, session_name: &str) -> Result<(), ZapError> {
        let sessions_dir = self.get_sessions_directory()?;
        let file_path = sessions_dir.join(format!("{}.json", session_name));

        if file_path.exists() {
            std::fs::remove_file(file_path)?;
        }

        Ok(())
    }

    fn clear_all_session_files(&self) -> Result<(), ZapError> {
        let sessions_dir = self.get_sessions_directory()?;

        if sessions_dir.exists() {
            for entry in std::fs::read_dir(sessions_dir)? {
                let entry = entry?;
                if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
                    let _ = std::fs::remove_file(entry.path());
                }
            }
        }

        Ok(())
    }

    // Check if session file exists on disk (for sync checking)
    fn session_file_exists(&self, session_name: &str) -> bool {
        match self.get_sessions_directory() {
            Ok(sessions_dir) => {
                let file_path = sessions_dir.join(format!("{}.json", session_name));
                file_path.exists()
            }
            Err(_) => false,
        }
    }

    fn get_sessions_directory(&self) -> Result<PathBuf, ZapError> {
        get_shared_sessions_directory()
            .map_err(|e| ZapError::StorageError(format!("Failed to get sessions directory: {}", e)))
    }
}

#[derive(Debug, serde::Serialize)]
pub struct DevBoxInfo {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub secrets_count: usize,
}
