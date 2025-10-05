// src/services/storage_service.rs

use crate::models::{AuthConfig, Box, DevSession, LogEntry, Secret, Settings, ZapError};
use crate::utils::path_resolvers::{get_logs_db_path, get_sessions_db_path, get_vault_db_path};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub struct StorageService {
    db: Option<sled::Db>,
    session_db: Option<sled::Db>,
    logs_db: Option<sled::Db>,
}

impl StorageService {
    pub fn new() -> Self {
        Self {
            db: None,
            session_db: None,
            logs_db: None,
        }
    }

    // Initialize databases
    pub fn initialize(&mut self) -> Result<(), ZapError> {
        // Use organized paths from path_resolvers (no db_path parameter needed)
        let vault_db_path = get_vault_db_path()
            .map_err(|e| ZapError::StorageError(format!("Failed to get vault DB path: {}", e)))?;
        let sessions_db_path = get_sessions_db_path().map_err(|e| {
            ZapError::StorageError(format!("Failed to get sessions DB path: {}", e))
        })?;
        let logs_db_path = get_logs_db_path()
            .map_err(|e| ZapError::StorageError(format!("Failed to get logs DB path: {}", e)))?;

        // Open databases in organized data/ folder
        self.db = Some(sled::open(&vault_db_path)?);
        self.session_db = Some(sled::open(&sessions_db_path)?);
        self.logs_db = Some(sled::open(&logs_db_path)?);

        println!("📁 Databases initialized:");
        println!("   Vault: {}", vault_db_path.display());
        println!("   Sessions: {}", sessions_db_path.display());
        println!("   Logs: {}", logs_db_path.display());

        Ok(())
    }

    pub fn is_initialized(&self) -> bool {
        self.db.is_some() && self.session_db.is_some() && self.logs_db.is_some()
    }

    // Database getters
    fn get_db(&self) -> Result<&sled::Db, ZapError> {
        self.db.as_ref().ok_or(ZapError::StorageError(
            "Database not initialized".to_string(),
        ))
    }

    fn get_sessions_db(&self) -> Result<&sled::Db, ZapError> {
        self.session_db.as_ref().ok_or(ZapError::StorageError(
            "Sessions database not initialized".to_string(),
        ))
    }

    fn get_logs_db(&self) -> Result<&sled::Db, ZapError> {
        self.logs_db.as_ref().ok_or(ZapError::StorageError(
            "Logs database not initialized".to_string(),
        ))
    }
}

// GENERIC CRUD OPERATIONS
impl StorageService {
    fn save_entity<T: Serialize>(
        &self,
        db: &sled::Db,
        prefix: &str,
        id: &str,
        entity: &T,
        name_mapping: Option<(&str, &str)>,
    ) -> Result<(), ZapError> {
        let entity_key = format!("{}:{}", prefix, id);
        let serialized = serde_json::to_vec(entity)?;

        let mut batch = sled::Batch::default();
        batch.insert(entity_key.as_bytes(), serialized);

        if let Some((name_key, _name)) = name_mapping {
            batch.insert(name_key.as_bytes(), id.as_bytes());
        }

        db.apply_batch(batch)?;
        db.flush()?;
        Ok(())
    }

    fn get_entity<T: for<'a> Deserialize<'a>>(
        &self,
        db: &sled::Db,
        prefix: &str,
        id: &str,
    ) -> Result<Option<T>, ZapError> {
        let key = format!("{}:{}", prefix, id);
        match db.get(key.as_bytes())? {
            Some(data) => Ok(Some(serde_json::from_slice(&data)?)),
            None => Ok(None),
        }
    }

    fn get_all_entities<T: for<'a> Deserialize<'a>>(
        &self,
        db: &sled::Db,
        prefix: &str,
    ) -> Result<Vec<T>, ZapError> {
        let mut entities = Vec::new();
        for result in db.scan_prefix(format!("{}:", prefix)) {
            let (_, value) = result?;
            entities.push(serde_json::from_slice(&value)?);
        }
        Ok(entities)
    }

    fn delete_entity(
        &self,
        db: &sled::Db,
        prefix: &str,
        id: &str,
        cleanup_keys: Vec<String>,
    ) -> Result<(), ZapError> {
        let entity_key = format!("{}:{}", prefix, id);

        let mut batch = sled::Batch::default();
        batch.remove(entity_key.as_bytes());

        for key in cleanup_keys {
            batch.remove(key.as_bytes());
        }

        db.apply_batch(batch)?;
        db.flush()?;
        Ok(())
    }

    fn get_entity_id_by_name(
        &self,
        db: &sled::Db,
        name: &str,
        name_prefix: &str,
    ) -> Result<Option<String>, ZapError> {
        let name_key = format!("{}:{}", name_prefix, name);
        match db.get(name_key.as_bytes())? {
            Some(id_bytes) => Ok(Some(String::from_utf8(id_bytes.to_vec())?)),
            None => Ok(None),
        }
    }
}

// BOX OPERATIONS
impl StorageService {
    pub fn save_box(&self, box_item: &Box) -> Result<(), ZapError> {
        let db = self.get_db()?;

        // Check name uniqueness
        if let Some(existing_id) = self.get_entity_id_by_name(db, &box_item.name, "box_name")? {
            if existing_id != box_item.id {
                return Err(ZapError::BoxAlreadyExists(box_item.name.clone()));
            }
        }

        self.save_entity(
            db,
            "box",
            &box_item.id,
            box_item,
            Some((&format!("box_name:{}", box_item.name), &box_item.id)),
        )
    }

    pub fn get_box(&self, box_id: &str) -> Result<Box, ZapError> {
        let db = self.get_db()?;
        let mut box_item: Box = self
            .get_entity(db, "box", box_id)?
            .ok_or_else(|| ZapError::BoxNotFound(box_id.to_string()))?;

        let secrets_count = self.count_secrets_in_box(&box_item.id)?;
        box_item.update_secrets_count(secrets_count);
        Ok(box_item)
    }

    pub fn get_box_id_by_name(&self, name: &str) -> Result<Option<String>, ZapError> {
        let db = self.get_db()?;
        self.get_entity_id_by_name(db, name, "box_name")
    }

    pub fn get_all_boxes(&self) -> Result<Vec<Box>, ZapError> {
        let db = self.get_db()?;
        let mut boxes: Vec<Box> = self.get_all_entities(db, "box")?;

        // Update secrets counts
        for box_item in &mut boxes {
            let count = self.count_secrets_in_box(&box_item.id)?;
            box_item.update_secrets_count(count);
        }

        boxes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(boxes)
    }

    pub fn update_box(&self, box_item: &Box) -> Result<(), ZapError> {
        let db = self.get_db()?;
        let existing_box = self
            .get_entity::<Box>(db, "box", &box_item.id)?
            .ok_or_else(|| ZapError::BoxNotFound(box_item.id.clone()))?;

        // Remove old name mapping if changed
        if existing_box.name != box_item.name {
            let old_name_key = format!("box_name:{}", existing_box.name);
            db.remove(old_name_key.as_bytes())?;
        }

        self.save_box(box_item)
    }

    pub fn delete_box(&self, box_id: &str) -> Result<(), ZapError> {
        let box_item = self.get_box(box_id)?;
        let db = self.get_db()?;

        let cleanup_keys = vec![format!("box_name:{}", box_item.name)];
        self.delete_entity(db, "box", box_id, cleanup_keys)
    }

    pub fn delete_selected_boxes(&self, box_ids: &[String]) -> Result<Vec<String>, ZapError> {
        let mut deleted_names = Vec::new();

        for box_id in box_ids {
            let box_item = self.get_box(box_id)?;
            self.delete_box(box_id)?;
            deleted_names.push(box_item.name);
        }

        Ok(deleted_names)
    }
}

// SECRET OPERATIONS
impl StorageService {
    pub fn save_secret(&self, secret: &Secret) -> Result<(), ZapError> {
        let db = self.get_db()?;

        // Check if box exists
        self.get_box(&secret.box_id)?;

        // Check name uniqueness within box
        let name_key = format!("secret_name:{}:{}", secret.box_id, secret.name);
        if let Some(_existing_id) =
            self.get_entity_id_by_name(db, &secret.name, &format!("secret_name:{}", secret.box_id))?
        {
            return Err(ZapError::SecretAlreadyExistsInBox(secret.name.clone()));
        }

        self.save_entity(
            db,
            "secret",
            &secret.id,
            secret,
            Some((&name_key, &secret.id)),
        )?;

        self.update_box_count_after_secret_change(&secret.box_id)?;
        Ok(())
    }

    pub fn get_secret(&self, secret_id: &str) -> Result<Secret, ZapError> {
        let db = self.get_db()?;
        self.get_entity(db, "secret", secret_id)?
            .ok_or_else(|| ZapError::SecretNotFound(secret_id.to_string()))
    }

    pub fn get_secret_by_name_in_box(
        &self,
        name: &str,
        box_id: &str,
    ) -> Result<Option<Secret>, ZapError> {
        let db = self.get_db()?;
        let name_prefix = format!("secret_name:{}", box_id);

        if let Some(secret_id) = self.get_entity_id_by_name(db, name, &name_prefix)? {
            let secret = self.get_secret(&secret_id)?;
            Ok(Some(secret))
        } else {
            Ok(None)
        }
    }

    pub fn get_secrets_by_box_id(&self, box_id: &str) -> Result<Vec<Secret>, ZapError> {
        let db = self.get_db()?;
        let mut secrets: Vec<Secret> = self.get_all_entities(db, "secret")?;

        secrets.retain(|s| s.box_id == box_id);
        secrets.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(secrets)
    }

    pub fn get_all_secrets(&self) -> Result<Vec<Secret>, ZapError> {
        let db = self.get_db()?;
        let mut secrets: Vec<Secret> = self.get_all_entities(db, "secret")?;
        secrets.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(secrets)
    }

    pub fn update_secret(&self, secret: &Secret) -> Result<(), ZapError> {
        let db = self.get_db()?;
        let existing_secret = self.get_secret(&secret.id)?;

        // Remove old name mapping if changed
        if existing_secret.name != secret.name {
            let old_name_key = format!(
                "secret_name:{}:{}",
                existing_secret.box_id, existing_secret.name
            );
            db.remove(old_name_key.as_bytes())?;

            // Check new name uniqueness
            if self
                .get_secret_by_name_in_box(&secret.name, &secret.box_id)?
                .is_some()
            {
                return Err(ZapError::SecretAlreadyExistsInBox(secret.name.clone()));
            }
        }

        let name_key = format!("secret_name:{}:{}", secret.box_id, secret.name);
        self.save_entity(
            db,
            "secret",
            &secret.id,
            secret,
            Some((&name_key, &secret.id)),
        )
    }

    pub fn delete_secret(&self, secret_id: &str) -> Result<(), ZapError> {
        let secret = self.get_secret(secret_id)?;
        let box_id = secret.box_id.clone();
        let db = self.get_db()?;

        let cleanup_keys = vec![format!("secret_name:{}:{}", secret.box_id, secret.name)];
        self.delete_entity(db, "secret", secret_id, cleanup_keys)?;

        self.update_box_count_after_secret_change(&box_id)?;
        Ok(())
    }

    pub fn delete_selected_secrets(&self, secret_ids: &[String]) -> Result<Vec<String>, ZapError> {
        let mut affected_boxes = std::collections::HashSet::new();
        let mut deleted_names = Vec::new();

        for secret_id in secret_ids {
            let secret = self.get_secret(secret_id)?;
            affected_boxes.insert(secret.box_id.clone());
            deleted_names.push(secret.name.clone());

            let db = self.get_db()?;
            let cleanup_keys = vec![format!("secret_name:{}:{}", secret.box_id, secret.name)];
            self.delete_entity(db, "secret", secret_id, cleanup_keys)?;
        }

        for box_id in affected_boxes {
            self.update_box_count_after_secret_change(&box_id)?;
        }

        Ok(deleted_names)
    }

    pub fn copy_secrets_to_box(
        &self,
        secret_ids: &[String],
        target_box_id: &str,
        _master_key: &[u8; 32],
    ) -> Result<Vec<String>, ZapError> {
        let _target_box = self.get_box(target_box_id)?;
        let target_secrets_count = self.count_secrets_in_box(target_box_id)?;

        if target_secrets_count + secret_ids.len() > 75 {
            return Err(ZapError::BoxCapacityExceeded);
        }

        let mut copied_names = Vec::new();

        for secret_id in secret_ids {
            let source_secret = self.get_secret(secret_id)?;

            // Skip if name already exists in target
            if self
                .get_secret_by_name_in_box(&source_secret.name, target_box_id)?
                .is_some()
            {
                continue; // Skip duplicates
            }

            let new_secret = Secret::new(
                target_box_id.to_string(),
                source_secret.name.clone(),
                source_secret.encrypted_value.clone(),
            )?;

            let db = self.get_db()?;
            let name_key = format!("secret_name:{}:{}", new_secret.box_id, new_secret.name);
            self.save_entity(
                db,
                "secret",
                &new_secret.id,
                &new_secret,
                Some((&name_key, &new_secret.id)),
            )?;

            copied_names.push(new_secret.name);
        }

        self.update_box_count_after_secret_change(target_box_id)?;

        Ok(copied_names)
    }
}

// SEARCH OPERATIONS
impl StorageService {
    pub fn search_boxes_global(&self, query: &str, tags: &[String]) -> Result<Vec<Box>, ZapError> {
        let all_boxes = self.get_all_boxes()?;

        if query.trim().is_empty() && tags.is_empty() {
            return Ok(all_boxes);
        }

        let query_lower = query.to_lowercase();
        Ok(all_boxes
            .into_iter()
            .filter(|box_item| {
                let name_match =
                    query.trim().is_empty() || box_item.name.to_lowercase().contains(&query_lower);
                let tag_match =
                    tags.is_empty() || tags.iter().any(|tag| box_item.tags.contains(tag));

                if query.trim().is_empty() && !tags.is_empty() {
                    tag_match
                } else {
                    name_match || tag_match
                }
            })
            .collect())
    }

    pub fn search_secrets_in_box(
        &self,
        box_id: &str,
        query: &str,
    ) -> Result<Vec<Secret>, ZapError> {
        let box_secrets = self.get_secrets_by_box_id(box_id)?;

        if query.trim().is_empty() {
            return Ok(box_secrets);
        }

        let query_lower = query.to_lowercase();
        Ok(box_secrets
            .into_iter()
            .filter(|secret| secret.name.to_lowercase().contains(&query_lower))
            .collect())
    }
}

// LOG OPERATIONS
impl StorageService {
    /// Add a log entry
    pub fn log(
        &self,
        action: String,
        message: String,
        content: Option<String>,
    ) -> Result<(), ZapError> {
        let entry = LogEntry::new(action, message, content);
        let logs_db = self.get_logs_db()?; // 🔥 Use separate logs database
        self.save_entity(logs_db, "log", &entry.id, &entry, None)?;

        // Optional: Print to console
        println!("📋 {}", entry.message);
        Ok(())
    }

    /// Get all logs (newest first)
    pub fn get_all_logs(&self) -> Result<Vec<LogEntry>, ZapError> {
        let logs_db = self.get_logs_db()?;
        let mut entries: Vec<LogEntry> = self.get_all_entities(logs_db, "log")?;
        entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        Ok(entries)
    }

    /// Clear all log entries
    pub fn clear_all_logs(&self) -> Result<usize, ZapError> {
        let count = self.count_log_entries()?;
        let logs_db = self.get_logs_db()?;

        for result in logs_db.scan_prefix("log:") {
            let (key, _) = result?;
            logs_db.remove(&key)?;
        }

        logs_db.flush()?;
        Ok(count)
    }

    /// Count log entries
    pub fn count_log_entries(&self) -> Result<usize, ZapError> {
        let logs_db = self.get_logs_db()?;
        let mut count = 0;
        for result in logs_db.scan_prefix("log:") {
            let _ = result?;
            count += 1;
        }
        Ok(count)
    }

    /// Export logs as JSON string
    pub fn export_logs(&self) -> Result<String, ZapError> {
        let entries = self.get_all_logs()?;
        serde_json::to_string_pretty(&entries).map_err(|e| ZapError::SerializationError(e))
    }
}

// DEV SESSION OPERATIONS
impl StorageService {
    // ... Keep existing dev session methods unchanged ...
    pub fn save_dev_session_by_name(
        &self,
        session_name: &str,
        session: &DevSession,
    ) -> Result<(), ZapError> {
        let db = self.get_sessions_db()?;
        self.save_entity(db, "session", session_name, session, None)
    }

    pub fn get_dev_session_by_name(
        &self,
        session_name: &str,
    ) -> Result<Option<DevSession>, ZapError> {
        let db = self.get_sessions_db()?;
        self.get_entity(db, "session", session_name)
    }

    pub fn get_all_dev_sessions(&self) -> Result<HashMap<String, DevSession>, ZapError> {
        let db = self.get_sessions_db()?;
        let mut sessions = HashMap::new();

        for result in db.scan_prefix("session:") {
            let (key, value) = result?;
            let session_name = String::from_utf8(key.to_vec())?
                .strip_prefix("session:")
                .unwrap()
                .to_string();
            let session: DevSession = serde_json::from_slice(&value)?;
            sessions.insert(session_name, session);
        }

        Ok(sessions)
    }

    pub fn delete_dev_session_by_name(&self, session_name: &str) -> Result<(), ZapError> {
        let db = self.get_sessions_db()?;
        self.delete_entity(db, "session", session_name, vec![])
    }

    pub fn clear_all_dev_sessions(&self) -> Result<(), ZapError> {
        let db = self.get_sessions_db()?;

        for result in db.scan_prefix("session:") {
            let (key, _) = result?;
            db.remove(&key)?;
        }

        db.flush()?;
        Ok(())
    }

    pub fn session_exists(&self, session_name: &str) -> Result<bool, ZapError> {
        let db = self.get_sessions_db()?;
        Ok(self
            .get_entity::<DevSession>(db, "session", session_name)?
            .is_some())
    }
}

// SETTINGS & AUTH
impl StorageService {
    pub fn load_settings(&self) -> Result<Settings, ZapError> {
        let db = self.get_db()?;
        match db.get("settings")? {
            Some(data) => Ok(serde_json::from_slice(&data)?),
            None => {
                let default_settings = Settings::default();
                self.save_settings(&default_settings)?;
                Ok(default_settings)
            }
        }
    }

    pub fn save_settings(&self, settings: &Settings) -> Result<(), ZapError> {
        let db = self.get_db()?;
        let serialized = serde_json::to_vec(settings)?;
        db.insert("settings", serialized)?;
        db.flush()?;
        Ok(())
    }

    pub fn load_auth_config(&self) -> Result<Option<AuthConfig>, ZapError> {
        let db = self.get_db()?;
        match db.get("auth_config")? {
            Some(data) => Ok(Some(serde_json::from_slice(&data)?)),
            None => Ok(None),
        }
    }

    pub fn save_auth_config(&self, config: &AuthConfig) -> Result<(), ZapError> {
        let db = self.get_db()?;
        let serialized = serde_json::to_vec(config)?;
        db.insert("auth_config", serialized)?;
        db.flush()?;
        Ok(())
    }
}

// STATISTICS & HELPERS
impl StorageService {
    pub fn get_vault_stats(&self) -> Result<VaultStats, ZapError> {
        let boxes = self.get_all_boxes()?;
        let all_secrets = self.get_all_secrets()?;

        Ok(VaultStats {
            total_boxes: boxes.len(),
            dev_boxes: boxes.iter().filter(|b| b.dev_mode).count(),
            secure_boxes: 0,
            total_secrets: all_secrets.len(),
            sensitive_secrets: 0,
            last_updated: all_secrets
                .iter()
                .map(|s| s.updated_at)
                .max()
                .unwrap_or_else(chrono::Utc::now),
        })
    }

    fn count_secrets_in_box(&self, box_id: &str) -> Result<usize, ZapError> {
        let secrets = self.get_secrets_by_box_id(box_id)?;
        Ok(secrets.len())
    }

    fn update_box_count_after_secret_change(&self, box_id: &str) -> Result<(), ZapError> {
        let mut box_item = self.get_box(box_id)?;
        let actual_count = self.count_secrets_in_box(box_id)?;

        if box_item.secrets_count != actual_count {
            box_item.update_secrets_count(actual_count);
            self.update_box(&box_item)?;
        }
        Ok(())
    }
}

impl Default for StorageService {
    fn default() -> Self {
        Self::new()
    }
}

// Statistics struct
#[derive(serde::Serialize)]
pub struct VaultStats {
    pub total_boxes: usize,
    pub dev_boxes: usize,
    pub secure_boxes: usize,
    pub total_secrets: usize,
    pub sensitive_secrets: usize,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}
