// src/models/settings_model.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub password_timeout_minutes: u32,
    pub theme: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            password_timeout_minutes: 5,
            theme: "dark".to_string(),
        }
    }
}
