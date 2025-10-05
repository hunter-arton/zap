// src/models/mod.rs

pub mod auth_model;
pub mod box_model;
pub mod dev_model;
pub mod error_model;
pub mod import_export_model;
pub mod log_model;
pub mod secret_model;
pub mod settings_model;

// Re-export all public types
pub use auth_model::{AuthConfig, SessionInfo, SessionState};
pub use box_model::Box;
pub use dev_model::{ActiveSessionInfo, DevSession, DevStats};
pub use error_model::ZapError;
pub use import_export_model::{BoxExport, ImportResult, SecretExport, VaultExport};
pub use log_model::LogEntry;
pub use secret_model::{EncryptedData, Secret};
pub use settings_model::Settings;

// Type aliases
pub type BoxId = String;
pub type SecretId = String;
pub type LogId = String;

// Result types for convenience
pub type BoxResult<T> = Result<T, ZapError>;
pub type SecretResult<T> = Result<T, ZapError>;
pub type AuthResult<T> = Result<T, ZapError>;
