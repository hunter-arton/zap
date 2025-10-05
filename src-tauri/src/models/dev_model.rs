// src/models/dev_model.rs 

use crate::models::EncryptedData;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevSession {
    pub session_name: String,  // User-provided unique name (e.g., "backend-dev")
    pub box_id: String,        // Source box ID
    pub box_name: String,      // Source box name for display
    pub session_key: [u8; 32], // Unique encryption key for this session
    pub encrypted_secrets: HashMap<String, EncryptedData>, // secret_name -> encrypted_data
}

impl DevSession {
    pub fn new(
        session_name: String,
        box_id: String,
        box_name: String,
        session_key: [u8; 32],
        encrypted_secrets: HashMap<String, EncryptedData>,
    ) -> Self {
        Self {
            session_name,
            box_id,
            box_name,
            session_key,
            encrypted_secrets,
        }
    }

    pub fn secrets_count(&self) -> usize {
        self.encrypted_secrets.len()
    }
}

// Response struct for UI - list of active sessions
#[derive(Debug, Serialize)]
pub struct ActiveSessionInfo {
    pub session_name: String,
    pub box_name: String,
    pub secrets_count: usize,
    pub is_active: bool, // Whether session is still running (not stopped)
}

// Stats for dev mode UI
#[derive(Debug, Serialize)]
pub struct DevStats {
    pub total_boxes: usize,
    pub dev_boxes: usize,
    pub secure_boxes: usize,
    pub total_secrets: usize,
    pub active_sessions_count: usize,
}
