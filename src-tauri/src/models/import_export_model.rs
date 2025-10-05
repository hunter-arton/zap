// src/models/import_export_model.rs 

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct VaultExport {
    pub version: String, // "1.0" - for future compatibility
    pub total_boxes: usize,
    pub total_secrets: usize,
    pub boxes: Vec<BoxExport>,
}

#[derive(Serialize, Deserialize)]
pub struct BoxExport {
    pub name: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub dev_mode: bool,
    pub secrets: Vec<SecretExport>,
}

#[derive(Serialize, Deserialize)]
pub struct SecretExport {
    pub name: String,
    pub value: String, // Decrypted value for export
}

// Keep ImportResult unchanged
#[derive(Serialize)]
pub struct ImportResult {
    pub boxes_imported: usize,
    pub secrets_imported: usize,
    pub errors: Vec<String>,
}

impl ImportResult {
    pub fn new() -> Self {
        Self {
            boxes_imported: 0,
            secrets_imported: 0,
            errors: Vec::new(),
        }
    }

    pub fn has_errors(&self) -> bool {
        !self.errors.is_empty()
    }

    pub fn add_error(&mut self, error: String) {
        self.errors.push(error);
    }

    pub fn success_summary(&self) -> String {
        format!(
            "Imported {} boxes with {} secrets",
            self.boxes_imported, self.secrets_imported
        )
    }
}
