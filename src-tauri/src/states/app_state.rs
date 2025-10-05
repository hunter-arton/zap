// src/states/app_state.rs

use crate::models::{Box, LogEntry, Secret, SessionInfo, Settings, ZapError};
use crate::services::{
    AuthService, CryptoService, ImportExportService, StorageService, VaultStats,
};
use std::sync::{Arc, Mutex};
use std::time::Duration;

pub struct AppState {
    pub storage: Arc<StorageService>,
    crypto: CryptoService,
    auth: Arc<Mutex<AuthService>>,
    import_export: ImportExportService,
    session_timer: Mutex<Option<tokio::task::JoinHandle<()>>>,
}

impl AppState {
    pub fn new() -> Self {
        let mut storage = StorageService::new();
        if let Err(e) = storage.initialize() {
            // No parameters needed now!
            eprintln!("Failed to initialize storage: {}", e);
        }

        let storage = Arc::new(storage);
        let import_export = ImportExportService::new(Arc::clone(&storage));

        Self {
            storage,
            crypto: CryptoService::new(),
            auth: Arc::new(Mutex::new(AuthService::new())),
            import_export,
            session_timer: Mutex::new(None),
        }
    }
    // INITIALIZATION

    pub async fn initialize(&self) -> Result<bool, ZapError> {
        // Log app start
        let _ = self.storage.log(
            "App_Start".to_string(),
            "Application started".to_string(),
            None,
        );

        let auth_config = self.storage.load_auth_config()?;
        let auth = self.auth.lock().unwrap();
        let is_first_time = auth.initialize(auth_config)?;

        println!("Initializing app...");
        Ok(is_first_time)
    }

    // AUTHENTICATION

    pub async fn unlock(&self, password: &str) -> Result<bool, ZapError> {
        let auth = self.auth.lock().unwrap();
        let is_first_time = auth.unlock(password)?;

        if is_first_time {
            if let Some(config) = auth.get_config() {
                drop(auth);
                self.storage.save_auth_config(&config)?;
            }
        }

        let _ = self.storage.log(
            "Session_Unlock".to_string(),
            "User session unlocked".to_string(),
            None,
        );

        println!("Session unlocked");
        self.start_session_timer();
        Ok(is_first_time)
    }

    pub fn lock(&self) {
        let auth = self.auth.lock().unwrap();
        auth.lock();
        drop(auth);

        let _ = self.storage.log(
            "Session_Lock".to_string(),
            "User session locked".to_string(),
            None,
        );

        self.stop_session_timer();
    }

    pub fn is_locked(&self) -> bool {
        let auth = self.auth.lock().unwrap();
        !auth.is_unlocked()
    }

    pub fn verify_password(&self, password: &str) -> Result<(), ZapError> {
        if password.trim().is_empty() {
            return Err(ZapError::AuthError("Password cannot be empty".to_string()));
        }

        let auth = self.auth.lock().unwrap();
        let config = auth
            .get_config()
            .ok_or(ZapError::AuthError("Auth not initialized".to_string()))?;

        if let Some(stored_hash) = &config.master_password_hash {
            if !self.crypto.verify_password(password, stored_hash)? {
                return Err(ZapError::IncorrectPassword);
            }
        }

        Ok(())
    }

    // BOX OPERATIONS - PASSWORDLESS

    pub async fn get_all_boxes(&self) -> Result<Vec<Box>, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        self.storage.get_all_boxes()
    }

    pub async fn get_box(&self, box_id: &str) -> Result<Box, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        self.storage.get_box(box_id)
    }

    pub async fn create_box(
        &self,
        name: String,
        description: Option<String>,
        tags: Vec<String>,
        dev_mode: bool,
    ) -> Result<String, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }
        let new_box = Box::new(name.clone(), description, tags, dev_mode)?;
        let box_id = new_box.id.clone();

        self.storage.save_box(&new_box)?;

        let _ = self.storage.log(
            "Create_Box".to_string(),
            format!("Box '{}' created", name),
            None,
        );

        Ok(box_id)
    }

    pub async fn update_box(
        &self,
        box_id: &str,
        name: Option<String>,
        description: Option<Option<String>>,
        tags: Option<Vec<String>>,
        dev_mode: Option<bool>,
    ) -> Result<(), ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let mut box_item = self.storage.get_box(box_id)?;
        let old_name = box_item.name.clone();

        // Track changes for logging
        let mut changes = Vec::new();
        if let Some(ref new_name) = name {
            if new_name != &box_item.name {
                changes.push(format!("name: '{}' -> '{}'", box_item.name, new_name));
            }
        }
        if let Some(new_dev_mode) = dev_mode {
            if new_dev_mode != box_item.dev_mode {
                changes.push(format!(
                    "dev_mode: {} -> {}",
                    box_item.dev_mode, new_dev_mode
                ));
            }
        }

        box_item.update_fields(name, description, tags, dev_mode)?;
        self.storage.update_box(&box_item)?;

        let _ = self.storage.log(
            "Update_Box".to_string(),
            format!("Box '{}' updated", old_name),
            if changes.is_empty() {
                None
            } else {
                Some(changes.join(", "))
            },
        );

        Ok(())
    }

    pub async fn delete_box(&self, box_id: &str) -> Result<(), ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let box_item = self.storage.get_box(box_id)?;
        let box_name = box_item.name.clone();

        self.storage.delete_box(box_id)?;

        let _ = self.storage.log(
            "Delete_Box".to_string(),
            format!("Box '{}' deleted", box_name),
            None,
        );

        Ok(())
    }

    pub async fn delete_selected_boxes(
        &self,
        box_ids: Vec<String>,
    ) -> Result<Vec<String>, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let deleted_names = self.storage.delete_selected_boxes(&box_ids)?;

        let _ = self.storage.log(
            "Delete_Boxes_Bulk".to_string(),
            format!("Bulk deleted {} boxes", deleted_names.len()),
            Some(deleted_names.join(", ")),
        );

        Ok(deleted_names)
    }

    // SECRET OPERATIONS - PASSWORDLESS

    pub async fn get_secrets_by_box_id(&self, box_id: &str) -> Result<Vec<Secret>, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        self.storage.get_secrets_by_box_id(box_id)
    }

    pub async fn get_all_secrets(&self) -> Result<Vec<Secret>, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        self.storage.get_all_secrets()
    }

    pub async fn create_secret(
        &self,
        box_id: String,
        name: String,
        value: String,
    ) -> Result<String, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let box_item = self.storage.get_box(&box_id)?;
        box_item.can_add_secret()?;

        let master_key = self.get_master_key()?;
        let encrypted_value = self.crypto.encrypt(&value, &master_key)?;

        let new_secret = Secret::new(box_id, name.clone(), encrypted_value)?;
        let secret_id = new_secret.id.clone();

        self.storage.save_secret(&new_secret)?;

        let _ = self.storage.log(
            "Create_Secret".to_string(),
            format!("Secret '{}' created in box '{}'", name, box_item.name),
            None,
        );

        Ok(secret_id)
    }

    pub async fn update_secret(
        &self,
        secret_id: &str,
        name: Option<String>,
        value: Option<String>,
    ) -> Result<(), ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let mut secret = self.storage.get_secret(secret_id)?;
        let box_item = self.storage.get_box(&secret.box_id)?;
        let old_name = secret.name.clone();

        // Track changes for logging
        let mut changes = Vec::new();
        if let Some(ref new_name) = name {
            if new_name != &secret.name {
                changes.push(format!("name: '{}' -> '{}'", secret.name, new_name));
            }
        }
        if value.is_some() {
            changes.push("value updated".to_string());
        }

        // Encrypt new value if provided
        let encrypted_value = if let Some(new_value) = value {
            let master_key = self.get_master_key()?;
            Some(self.crypto.encrypt(&new_value, &master_key)?)
        } else {
            None
        };

        secret.update_fields(name, encrypted_value)?;
        self.storage.update_secret(&secret)?;

        let _ = self.storage.log(
            "Update_Secret".to_string(),
            format!("Secret '{}' updated in box '{}'", old_name, box_item.name),
            if changes.is_empty() {
                None
            } else {
                Some(changes.join(", "))
            },
        );

        Ok(())
    }

    pub async fn delete_secret(&self, secret_id: &str) -> Result<(), ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let secret = self.storage.get_secret(secret_id)?;
        let box_item = self.storage.get_box(&secret.box_id)?;
        let secret_name = secret.name.clone();

        self.storage.delete_secret(secret_id)?;

        let _ = self.storage.log(
            "Delete_Secret".to_string(),
            format!(
                "Secret '{}' deleted from box '{}'",
                secret_name, box_item.name
            ),
            None,
        );

        Ok(())
    }

    pub async fn delete_selected_secrets(
        &self,
        secret_ids: Vec<String>,
    ) -> Result<Vec<String>, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let deleted_names = self.storage.delete_selected_secrets(&secret_ids)?;

        let _ = self.storage.log(
            "Delete_Secrets_Bulk".to_string(),
            format!("Bulk deleted {} secrets", deleted_names.len()),
            Some(deleted_names.join(", ")),
        );

        Ok(deleted_names)
    }

    pub async fn copy_secrets_to_box(
        &self,
        secret_ids: Vec<String>,
        target_box_id: String,
    ) -> Result<Vec<String>, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        // Check 75 secrets per box limit
        let target_box = self.storage.get_box(&target_box_id)?;
        if target_box.secrets_count + secret_ids.len() > 75 {
            return Err(ZapError::ValidationError(
                "Target box would exceed 75 secrets limit".to_string(),
            ));
        }

        let master_key = self.get_master_key()?;
        let copied_names =
            self.storage
                .copy_secrets_to_box(&secret_ids, &target_box_id, &master_key)?;

        let _ = self.storage.log(
            "Copy_Secrets".to_string(),
            format!(
                "Copied {} secrets to box '{}'",
                copied_names.len(),
                target_box.name
            ),
            Some(copied_names.join(", ")),
        );

        Ok(copied_names)
    }

    pub async fn reveal_secret_value(&self, secret_id: &str) -> Result<String, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let secret = self.storage.get_secret(secret_id)?;
        let box_item = self.storage.get_box(&secret.box_id)?;
        let master_key = self.get_master_key()?;
        let decrypted_value = self.crypto.decrypt(&secret.encrypted_value, &master_key)?;

        let _ = self.storage.log(
            "Reveal_Secret".to_string(),
            format!(
                "Secret '{}' revealed from box '{}'",
                secret.name, box_item.name
            ),
            None,
        );

        Ok(decrypted_value)
    }

    // SEARCH OPERATIONS

    pub async fn search_boxes_global(
        &self,
        query: String,
        tags: Vec<String>,
    ) -> Result<Vec<Box>, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        self.storage.search_boxes_global(&query, &tags)
    }

    pub async fn search_secrets_in_box(
        &self,
        box_id: String,
        query: String,
    ) -> Result<Vec<Secret>, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        self.storage.search_secrets_in_box(&box_id, &query)
    }

    // IMPORT/EXPORT

    pub async fn export_vault(&self) -> Result<String, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let master_key = self.get_master_key()?;
        let result = self.import_export.export_vault(&master_key)?;

        let vault_stats = self.storage.get_vault_stats()?;
        let _ = self.storage.log(
            "Export_Vault".to_string(),
            format!(
                "Exported vault ({} boxes, {} secrets)",
                vault_stats.total_boxes, vault_stats.total_secrets
            ),
            None,
        );

        Ok(result)
    }

    pub async fn export_box_as_env(
        &self,
        box_id: String,
        prefix: Option<String>,
    ) -> Result<String, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let box_item = self.storage.get_box(&box_id)?;
        let master_key = self.get_master_key()?;
        let result =
            self.import_export
                .export_box_as_env(&box_id, &master_key, prefix.as_deref())?;

        let _ = self.storage.log(
            "Export_Box".to_string(),
            format!(
                "Exported box '{}' as .env ({} secrets)",
                box_item.name, box_item.secrets_count
            ),
            prefix,
        );

        Ok(result)
    }

    pub async fn import_vault(
        &self,
        json_data: &str,
    ) -> Result<crate::models::ImportResult, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let master_key = self.get_master_key()?;
        let result = self.import_export.import_vault(json_data, &master_key)?;

        let _ = self.storage.log(
            "Import_Vault".to_string(),
            format!(
                "Imported vault ({} boxes, {} secrets)",
                result.boxes_imported, result.secrets_imported
            ),
            if result.has_errors() {
                Some(format!("{} errors", result.errors.len()))
            } else {
                None
            },
        );

        Ok(result)
    }

    pub async fn import_env_to_box(
        &self,
        env_content: &str,
        target_box_id: String,
    ) -> Result<crate::models::ImportResult, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        let target_box = self.storage.get_box(&target_box_id)?;
        let master_key = self.get_master_key()?;
        let result =
            self.import_export
                .import_env_to_box(env_content, &target_box_id, &master_key)?;

        let _ = self.storage.log(
            "Import_Env".to_string(),
            format!(
                "Imported {} env variables to box '{}'",
                result.secrets_imported, target_box.name
            ),
            if result.has_errors() {
                Some(format!("{} errors", result.errors.len()))
            } else {
                None
            },
        );

        Ok(result)
    }

    // LOG OPERATIONS

    /// Get all logs (no password required)
    pub async fn get_all_logs(&self) -> Result<Vec<LogEntry>, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        // Auto-log that someone viewed logs
        let _ = self.storage.log(
            "View_Logs".to_string(),
            "Viewed audit logs".to_string(),
            None,
        );

        self.storage.get_all_logs()
    }

    /// Clear all logs
    pub async fn clear_all_logs(&self, password: &str) -> Result<usize, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        self.verify_password(password)?;

        let count = self.storage.clear_all_logs()?;

        // Note: clearing action is already logged in storage.clear_all_logs()

        Ok(count)
    }

    /// Export logs (no password required)
    pub async fn export_logs(&self) -> Result<String, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        // Auto-log the export
        let _ = self.storage.log(
            "Export_Logs".to_string(),
            "Exported audit logs".to_string(),
            None,
        );

        self.storage.export_logs()
    }

    // STATISTICS & UTILITIES

    pub async fn get_vault_stats(&self) -> Result<VaultStats, ZapError> {
        if self.is_locked() {
            return Err(ZapError::SessionExpired);
        }

        self.storage.get_vault_stats()
    }

    pub fn get_settings(&self) -> Result<Settings, ZapError> {
        self.storage.load_settings()
    }

    pub async fn update_settings(&self, settings: Settings) -> Result<(), ZapError> {
        self.storage.save_settings(&settings)?;

        // Update auth timeout in memory AND save to AuthConfig
        {
            let auth = self.auth.lock().unwrap();
            auth.set_timeout_minutes(settings.password_timeout_minutes as u8)?;

            if let Some(mut config) = auth.get_config() {
                config.session_timeout_minutes = settings.password_timeout_minutes as u8;
                drop(auth);
                self.storage.save_auth_config(&config)?;
            }
        }

        let _ = self.storage.log(
            "Update_Settings".to_string(),
            "Settings updated".to_string(),
            Some(format!(
                "timeout: {} minutes",
                settings.password_timeout_minutes
            )),
        );

        Ok(())
    }

    pub fn get_session_info(&self) -> SessionInfo {
        SessionInfo {
            is_locked: self.is_locked(),
            time_left_seconds: self.get_session_time_left(),
        }
    }

    // PRIVATE HELPERS

    pub fn get_master_key(&self) -> Result<[u8; 32], ZapError> {
        let auth = self.auth.lock().unwrap();
        auth.get_master_key().ok_or(ZapError::SessionExpired)
    }

    pub fn get_session_time_left(&self) -> u32 {
        let auth = self.auth.lock().unwrap();
        auth.get_session_time_left()
    }

    fn start_session_timer(&self) {
        let mut timer_guard = self.session_timer.lock().unwrap();

        if let Some(handle) = timer_guard.take() {
            handle.abort();
        }

        let auth_clone = Arc::clone(&self.auth);
        let storage_clone = Arc::clone(&self.storage);

        let handle = tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(1));
            loop {
                interval.tick().await;

                if let Ok(auth) = auth_clone.try_lock() {
                    let was_unlocked = auth.is_unlocked();
                    auth.tick_session();
                    let still_unlocked = auth.is_unlocked();

                    if was_unlocked && !still_unlocked {
                        let _ = storage_clone.log(
                            "Session_Expired".to_string(),
                            "Session expired due to inactivity".to_string(),
                            None,
                        );
                        break;
                    }

                    if !still_unlocked {
                        break;
                    }
                } else {
                    continue;
                }
            }
        });

        *timer_guard = Some(handle);
    }

    fn stop_session_timer(&self) {
        let mut timer_guard = self.session_timer.lock().unwrap();
        if let Some(handle) = timer_guard.take() {
            handle.abort();
        }
    }
}

unsafe impl Send for AppState {}
unsafe impl Sync for AppState {}

impl Drop for AppState {
    fn drop(&mut self) {
        self.stop_session_timer();

        // Log app shutdown
        let _ = self.storage.log(
            "App_Shutdown".to_string(),
            "Application shutdown".to_string(),
            None,
        );
    }
}
