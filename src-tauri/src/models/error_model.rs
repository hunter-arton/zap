// src/models/error_model.rs

use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ZapError {
    // Storage errors
    #[error("Storage operation failed: {0}")]
    StorageError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sled::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    // Validation errors
    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Invalid tags: {0}")]
    InvalidTags(String),

    // Box errors
    #[error("Box with id '{0}' not found")]
    BoxNotFound(String),

    #[error("Box with name '{0}' already exists")]
    BoxAlreadyExists(String),

    #[error("Box has reached maximum capacity")]
    BoxCapacityExceeded,

    #[error("Box cannot be used as dev session: {0}")]
    InvalidDevBox(String),

    // Secret errors
    #[error("Secret with id '{0}' not found")]
    SecretNotFound(String),

    #[error("Secret with name '{0}' already exists in this box")]
    SecretAlreadyExistsInBox(String),

    // Authentication errors (unchanged)
    #[error("Authentication failed: {0}")]
    AuthError(String),

    #[error("Incorrect password provided")]
    IncorrectPassword,

    #[error("Session has expired")]
    SessionExpired,

    // Crypto errors (unchanged)
    #[error("Cryptographic operation failed: {0}")]
    CryptoError(String),

    // Session management errors
    #[error("Session '{0}' not found")]
    SessionNotFound(String),

    #[error("Session '{0}' already exists")]
    SessionAlreadyExists(String),

    #[error("No sessions found. Create a session first.")]
    NoSessionsExist,

    #[error("Invalid session name: {0}")]
    InvalidSessionName(String),

    #[error("Invalid session key")]
    InvalidSessionKey,

    // CLI-specific errors
    #[error("No current session set. Use 'zap use <session-name>' first.")]
    NoCurrentSession,

    #[error("Invalid zap.json format in current directory")]
    InvalidProjectContext,

    #[error("Sessions database not found")]
    SessionsDatabaseNotFound,

    // Serialization errors (unchanged)
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("UTF-8 conversion error: {0}")]
    Utf8Error(#[from] std::string::FromUtf8Error),
}

// Make it compatible with Tauri's error system
impl Serialize for ZapError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Convenience result type
pub type ZapResult<T> = Result<T, ZapError>;

// Helper implementations
impl ZapError {
    pub fn box_not_found(id: &str) -> Self {
        Self::BoxNotFound(id.to_string())
    }

    pub fn box_already_exists(name: &str) -> Self {
        Self::BoxAlreadyExists(name.to_string())
    }

    pub fn secret_not_found(id: &str) -> Self {
        Self::SecretNotFound(id.to_string())
    }

    pub fn secret_already_exists_in_box(name: &str) -> Self {
        Self::SecretAlreadyExistsInBox(name.to_string())
    }
    pub fn session_not_found(name: &str) -> Self {
        Self::SessionNotFound(name.to_string())
    }

    pub fn session_already_exists(name: &str) -> Self {
        Self::SessionAlreadyExists(name.to_string())
    }

    pub fn invalid_session_name(reason: &str) -> Self {
        Self::InvalidSessionName(reason.to_string())
    }
}

// Convert from hex decode errors
impl From<hex::FromHexError> for ZapError {
    fn from(err: hex::FromHexError) -> Self {
        ZapError::CryptoError(format!("Hex decode error: {}", err))
    }
}
