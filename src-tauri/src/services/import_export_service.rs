// src/services/import_export_service.rs

use crate::models::{Box, BoxExport, ImportResult, Secret, SecretExport, VaultExport, ZapError};
use crate::services::{CryptoService, StorageService};
use std::sync::Arc;

pub struct ImportExportService {
    storage: Arc<StorageService>,
    crypto: CryptoService,
}

impl ImportExportService {
    pub fn new(storage: Arc<StorageService>) -> Self {
        Self {
            storage,
            crypto: CryptoService::new(),
        }
    }

    // VAULT EXPORT (JSON)

    /// Export entire vault as JSON using session master key
    pub fn export_vault(&self, master_key: &[u8; 32]) -> Result<String, ZapError> {
        // Get all boxes and their secrets
        let all_boxes = self.storage.get_all_boxes()?;
        let mut export_boxes = Vec::new();
        let mut total_secrets = 0;

        for box_item in all_boxes {
            let box_secrets = self.storage.get_secrets_by_box_id(&box_item.id)?;
            let mut export_secrets = Vec::new();

            // Decrypt secrets for export using session master key
            for secret in box_secrets {
                let decrypted_value = self.crypto.decrypt(&secret.encrypted_value, master_key)?;

                export_secrets.push(SecretExport {
                    name: secret.name,
                    value: decrypted_value,
                });
            }

            total_secrets += export_secrets.len();

            export_boxes.push(BoxExport {
                name: box_item.name,
                description: box_item.description,
                tags: box_item.tags,

                dev_mode: box_item.dev_mode,
                secrets: export_secrets,
            });
        }

        let vault_export = VaultExport {
            version: "1.0".to_string(),
            total_boxes: export_boxes.len(),
            total_secrets,
            boxes: export_boxes,
        };

        serde_json::to_string_pretty(&vault_export).map_err(|e| ZapError::SerializationError(e))
    }

    // BOX EXPORT (.ENV)

    /// Export single box as .ENV file using session master key
    pub fn export_box_as_env(
        &self,
        box_id: &str,
        master_key: &[u8; 32],
        prefix: Option<&str>,
    ) -> Result<String, ZapError> {
        // Get box and its secrets
        let box_item = self.storage.get_box(box_id)?;
        let box_secrets = self.storage.get_secrets_by_box_id(box_id)?;

        if box_secrets.is_empty() {
            return Err(ZapError::StorageError(
                "Box has no secrets to export".to_string(),
            ));
        }

        // Build .ENV content
        let mut env_content = String::new();

        // Header comment
        env_content.push_str(&format!("# Box: {}\n", box_item.name));
        if let Some(desc) = &box_item.description {
            env_content.push_str(&format!("# Description: {}\n", desc));
        }
        if !box_item.tags.is_empty() {
            env_content.push_str(&format!("# Tags: {}\n", box_item.tags.join(", ")));
        }
        env_content.push_str(&format!(
            "# Exported: {}\n",
            chrono::Utc::now().format("%Y-%m-%d %H:%M UTC")
        ));
        env_content.push_str("\n");

        // Export secrets as environment variables using session master key
        for secret in &box_secrets {
            let decrypted_value = self.crypto.decrypt(&secret.encrypted_value, master_key)?;
            let env_var_name = secret.to_env_var_name(prefix);

            // Escape value if it contains spaces or special characters
            let escaped_value = if decrypted_value.contains(' ')
                || decrypted_value.contains('"')
                || decrypted_value.contains('\'')
            {
                format!("\"{}\"", decrypted_value.replace('"', "\\\""))
            } else {
                decrypted_value
            };

            env_content.push_str(&format!("{}={}\n", env_var_name, escaped_value));
        }

        Ok(env_content)
    }

    //  IMPORT (JSON) 

    /// Import vault from JSON format using session master key
    pub fn import_vault(
        &self,
        json_data: &str,
        master_key: &[u8; 32],
    ) -> Result<ImportResult, ZapError> {
        // Parse JSON
        let vault_import: VaultExport =
            serde_json::from_str(json_data).map_err(|e| ZapError::SerializationError(e))?;

        if vault_import.boxes.is_empty() {
            return Err(ZapError::StorageError(
                "No boxes found in import file".to_string(),
            ));
        }

        let mut result = ImportResult::new();

        // Process each box
        for box_data in vault_import.boxes {
            let box_name = box_data.name.clone();

            match self.import_single_box(box_data, master_key) {
                Ok((box_imported, secrets_imported)) => {
                    if box_imported {
                        result.boxes_imported += 1;
                    }
                    result.secrets_imported += secrets_imported;
                }
                Err(e) => {
                    result.add_error(format!("Failed to import box '{}': {}", box_name, e));
                }
            }
        }

        Ok(result)
    }

    // .ENV IMPORT 

    /// Import .ENV file into specific box
    pub fn import_env_to_box(
        &self,
        env_content: &str,
        target_box_id: &str,
        master_key: &[u8; 32], 
    ) -> Result<ImportResult, ZapError> {
        // Verify target box exists
        let _target_box = self.storage.get_box(target_box_id)?;

        // Parse .ENV content
        let env_vars = self.parse_env_content(env_content)?;

        if env_vars.is_empty() {
            return Err(ZapError::StorageError(
                "No valid environment variables found".to_string(),
            ));
        }

        let mut result = ImportResult::new();

        // Check capacity
        let current_secrets = self.storage.get_secrets_by_box_id(target_box_id)?;
        if current_secrets.len() + env_vars.len() > 75 {
            return Err(ZapError::BoxCapacityExceeded);
        }

        // Import each environment variable as secret
        for (env_name, env_value) in env_vars {
            let secret_name = self.env_var_to_secret_name(&env_name);

            // Check if secret already exists in box
            if self
                .storage
                .get_secret_by_name_in_box(&secret_name, target_box_id)?
                .is_some()
            {
                result.add_error(format!("Secret '{}' already exists in box", secret_name));
                continue;
            }

            // Validate secret name
            if let Err(e) = Secret::validate_name(&secret_name) {
                result.add_error(format!("Invalid secret name '{}': {}", secret_name, e));
                continue;
            }

            // Create and save secret using session master key
            match self.create_secret_from_env(&secret_name, &env_value, target_box_id, master_key) {
                Ok(()) => {
                    result.secrets_imported += 1;
                }
                Err(e) => {
                    result.add_error(format!("Failed to import '{}': {}", secret_name, e));
                }
            }
        }

        Ok(result)
    }

    // PRIVATE HELPERS

    /// Import single box with all its secrets
    fn import_single_box(
        &self,
        box_data: BoxExport,
        master_key: &[u8; 32],
    ) -> Result<(bool, usize), ZapError> {
        // Skip if box already exists
        if self.storage.get_box_id_by_name(&box_data.name)?.is_some() {
            return Ok((false, 0));
        }

        // Create new box
        let new_box = Box::new(
            box_data.name,
            box_data.description,
            box_data.tags,
            box_data.dev_mode,
        )?;

        self.storage.save_box(&new_box)?;

        // Import secrets
        let mut secrets_imported = 0;
        for secret_data in box_data.secrets {
            match self.create_secret_from_import(&secret_data, &new_box.id, master_key) {
                Ok(()) => {
                    secrets_imported += 1;
                }
                Err(_) => {
                    continue;
                }
            }
        }

        Ok((true, secrets_imported))
    }

    /// Create secret from import data
    fn create_secret_from_import(
        &self,
        secret_data: &SecretExport,
        box_id: &str,
        master_key: &[u8; 32],
    ) -> Result<(), ZapError> {
        Secret::validate_name(&secret_data.name)?;

        if secret_data.value.trim().is_empty() {
            return Err(ZapError::ValidationError(
                "Secret value cannot be empty".to_string(),
            ));
        }

        // Encrypt with session master key
        let encrypted_value = self.crypto.encrypt(&secret_data.value, master_key)?;
        let secret = Secret::new(
            box_id.to_string(),
            secret_data.name.clone(),
            encrypted_value,
        )?;

        self.storage.save_secret(&secret)?;
        Ok(())
    }

    /// Create secret from environment variable
    fn create_secret_from_env(
        &self,
        name: &str,
        value: &str,
        box_id: &str,
        master_key: &[u8; 32],
    ) -> Result<(), ZapError> {
        let encrypted_value = self.crypto.encrypt(value, master_key)?;
        let secret = Secret::new(box_id.to_string(), name.to_string(), encrypted_value)?;

        self.storage.save_secret(&secret)?;
        Ok(())
    }

    /// Parse .ENV content into key-value pairs
    fn parse_env_content(&self, content: &str) -> Result<Vec<(String, String)>, ZapError> {
        let mut env_vars = Vec::new();

        for line in content.lines() {
            let line = line.trim();

            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            if let Some(eq_pos) = line.find('=') {
                let key = line[..eq_pos].trim().to_string();
                let value = line[eq_pos + 1..].trim();

                let value = if (value.starts_with('"') && value.ends_with('"'))
                    || (value.starts_with('\'') && value.ends_with('\''))
                {
                    value[1..value.len() - 1].replace("\\\"", "\"")
                } else {
                    value.to_string()
                };

                if !key.is_empty() {
                    env_vars.push((key, value));
                }
            }
        }

        Ok(env_vars)
    }

    /// Convert environment variable name to readable secret name
    fn env_var_to_secret_name(&self, env_name: &str) -> String {
        env_name
            .split('_')
            .map(|part| {
                let mut chars = part.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => {
                        first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase()
                    }
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
    }
}

impl Default for ImportExportService {
    fn default() -> Self {
        panic!("ImportExportService requires StorageService dependency");
    }
}
