// src/models/log_model.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub id: String,
    pub action: String,
    pub message: String,
    pub content: Option<String>, // Extra details if needed
    #[serde(with = "chrono::serde::ts_seconds")]
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl LogEntry {
    pub fn new(action: String, message: String, content: Option<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            action,
            message,
            content,
            timestamp: chrono::Utc::now(),
        }
    }
}
