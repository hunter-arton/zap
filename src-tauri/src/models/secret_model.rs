// src/models/secret_model.rs

use crate::models::ZapError;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Secret {
    pub id: String,
    pub box_id: String, // Foreign key to box
    pub name: String,   // 75 chars max, minimum 2 chars for .ENV
    pub encrypted_value: EncryptedData,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: chrono::DateTime<chrono::Utc>,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl Secret {
    pub fn new(
        box_id: String,
        name: String,
        encrypted_value: EncryptedData,
    ) -> Result<Self, ZapError> {
        Self::validate_name(&name)?;

        let now = chrono::Utc::now();
        Ok(Self {
            id: uuid::Uuid::new_v4().to_string(),
            box_id,
            name,
            encrypted_value,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_fields(
        &mut self,
        name: Option<String>,
        encrypted_value: Option<EncryptedData>,
    ) -> Result<(), ZapError> {
        let mut updated = false;

        if let Some(new_name) = name {
            Self::validate_name(&new_name)?;
            self.name = new_name;
            updated = true;
        }

        if let Some(new_encrypted_value) = encrypted_value {
            self.encrypted_value = new_encrypted_value;
            updated = true;
        }

        if updated {
            self.updated_at = chrono::Utc::now();
        }

        Ok(())
    }

    // Keep existing validation methods unchanged
    pub fn validate_name(name: &str) -> Result<(), ZapError> {
        let trimmed = name.trim();
        if trimmed.len() < 2 {
            return Err(ZapError::ValidationError(
                "Secret name must be at least 2 characters for .ENV compatibility".to_string(),
            ));
        }
        if trimmed.len() > 75 {
            return Err(ZapError::ValidationError(
                "Secret name cannot exceed 75 characters".to_string(),
            ));
        }
        if trimmed.chars().any(|c| c.is_control() && c != '\t') {
            return Err(ZapError::ValidationError(
                "Secret name cannot contain control characters".to_string(),
            ));
        }
        Ok(())
    }

    pub fn to_env_var_name(&self, prefix: Option<&str>) -> String {
        let clean_name = self
            .name
            .to_uppercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '_' })
            .collect::<String>();

        let clean_name = clean_name
            .split('_')
            .filter(|s| !s.is_empty())
            .collect::<Vec<&str>>()
            .join("_");

        match prefix {
            Some(p) => {
                let clean_prefix = p
                    .to_uppercase()
                    .chars()
                    .map(|c| if c.is_alphanumeric() { c } else { '_' })
                    .collect::<String>();
                format!("{}_{}", clean_prefix, clean_name)
            }
            None => clean_name,
        }
    }
}

// Keep EncryptedData unchanged
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedData {
    pub cipher: Vec<u8>,
    pub nonce: Vec<u8>,
    pub tag: Vec<u8>,
}

impl EncryptedData {
    pub fn new(cipher: Vec<u8>, nonce: Vec<u8>, tag: Vec<u8>) -> Self {
        Self { cipher, nonce, tag }
    }

    pub fn empty() -> Self {
        Self {
            cipher: Vec::new(),
            nonce: Vec::new(),
            tag: Vec::new(),
        }
    }

    pub fn is_valid(&self) -> bool {
        !self.cipher.is_empty() && self.nonce.len() == 12 && self.tag.len() == 16
    }
}

impl Default for EncryptedData {
    fn default() -> Self {
        Self::empty()
    }
}
