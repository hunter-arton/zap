// src/services/dev_service.rs
use crate::models::{Box, DevSession, EncryptedData, Secret, ZapError};
use crate::services::CryptoService;
use std::collections::HashMap;

pub struct DevService {
    crypto: CryptoService,
}

impl DevService {
    pub fn new() -> Self {
        Self {
            crypto: CryptoService::new(),
        }
    }

    // === Session Creation ===

    /// Create a new dev session
    pub fn create_session_from_box(
        &self,
        session_name: String,
        box_item: &Box,
        box_secrets: &[Secret],
        master_key: &[u8; 32],
    ) -> Result<DevSession, ZapError> {
        // Make sure session name is valid format
        self.validate_session_name(&session_name)?;

        // Make sure box can be used for dev session
        self.validate_dev_box(box_item)?;

        // Generate unique session key for CLI
        let session_key = self.generate_session_key();

        // Re-encrypt all secrets with session key 
        let encrypted_secrets =
            self.prepare_box_for_session(box_secrets, master_key, &session_key)?;

        // Create the session object
        let session = DevSession::new(
            session_name,
            box_item.id.clone(),
            box_item.name.clone(),
            session_key,
            encrypted_secrets,
        );

        Ok(session)
    }

    // Validation

    /// Validate session name format (lowercase, numbers, hyphens only)
    pub fn validate_session_name(&self, name: &str) -> Result<(), ZapError> {
        if name.trim().is_empty() {
            return Err(ZapError::InvalidSessionName(
                "Session name cannot be empty".to_string(),
            ));
        }

        let regex = regex::Regex::new(r"^[a-z0-9\-]{1,30}$").unwrap();
        if !regex.is_match(name) {
            return Err(ZapError::InvalidSessionName(
                "Session name must be 1-30 characters, lowercase letters, numbers, and hyphens only".to_string()
            ));
        }

        Ok(())
    }

    /// Validate box can be used as dev session
    pub fn validate_dev_box(&self, box_item: &Box) -> Result<(), ZapError> {
        // Use dev_mode instead of dev_box (updated field name)
        if !box_item.dev_mode {
            return Err(ZapError::InvalidDevBox(
                "Box is not enabled for dev mode".to_string(),
            ));
        }

        if box_item.is_empty() {
            return Err(ZapError::InvalidDevBox(
                "Box has no secrets to use as dev session".to_string(),
            ));
        }

        Ok(())
    }

    // Session Key Operations

    /// Generate cryptographically secure session key for CLI
    pub fn generate_session_key(&self) -> [u8; 32] {
        use rand::RngCore;
        let mut key = [0u8; 32];
        rand::rng().fill_bytes(&mut key);
        key
    }

    /// Validate session key format (hex string -> bytes) for CLI
    pub fn validate_session_key(&self, session_key_hex: &str) -> Result<[u8; 32], ZapError> {
        let key_bytes = hex::decode(session_key_hex).map_err(|_| ZapError::InvalidSessionKey)?;

        if key_bytes.len() != 32 {
            return Err(ZapError::InvalidSessionKey);
        }

        let mut key = [0u8; 32];
        key.copy_from_slice(&key_bytes);
        Ok(key)
    }

    // Secret Operations

    /// Prepare box secrets for dev session
    pub fn prepare_box_for_session(
        &self,
        box_secrets: &[Secret],
        master_key: &[u8; 32],
        session_key: &[u8; 32],
    ) -> Result<HashMap<String, EncryptedData>, ZapError> {
        let mut session_secrets = HashMap::new();

        for secret in box_secrets {
            // Decrypt with master key (from session)
            let decrypted_value = self.crypto.decrypt(&secret.encrypted_value, master_key)?;

            // Re-encrypt with session key (for CLI usage)
            let session_encrypted = self.crypto.encrypt(&decrypted_value, session_key)?;

            session_secrets.insert(secret.name.clone(), session_encrypted);
        }

        Ok(session_secrets)
    }

    /// Serialize encrypted data for storage
    pub fn serialize_encrypted_data(
        &self,
        encrypted_data: &EncryptedData,
    ) -> Result<String, ZapError> {
        let serialized = serde_json::to_vec(encrypted_data).map_err(|e| {
            ZapError::StorageError(format!("Failed to serialize encrypted data: {}", e))
        })?;
        Ok(hex::encode(serialized))
    }

    // CLI Helpers

    /// Decrypt secret for CLI usage
    pub fn decrypt_secret_for_cli(
        &self,
        encrypted_data: &EncryptedData,
        session_key: &[u8; 32],
    ) -> Result<String, ZapError> {
        self.crypto.decrypt(encrypted_data, session_key)
    }
}

impl Default for DevService {
    fn default() -> Self {
        Self::new()
    }
}
