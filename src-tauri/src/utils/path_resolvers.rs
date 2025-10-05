// src-tauri/src/utils/path_resolvers.rs

use std::path::PathBuf;
use thiserror::Error;

// ================================
// CONSTANTS
// ================================
pub const APP_IDENTIFIER: &str = "com.devtool.zap";
pub const DATA_DIR: &str = "data";
pub const SESSIONS_DIR: &str = "sessions";

// ================================
// ERRORS
// ================================
#[derive(Debug, Error)]
pub enum PathError {
    #[error("Environment variable not found: {0}")]
    EnvVarNotFound(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Path resolution error: {0}")]
    PathResolution(String),
}

// ================================
// CORE PATH FUNCTIONS
// ================================

/// Get the base application directory
/// Returns: ~/.config/com.devtool.zap (Linux), ~/Library/Application Support/com.devtool.zap (macOS), %APPDATA%/com.devtool.zap (Windows)
pub fn get_app_base_directory() -> Result<PathBuf, PathError> {
    let base_dir = match std::env::consts::OS {
        "windows" => std::env::var("APPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(r"C:\Users\Default\AppData\Roaming")),
        "macos" => {
            let home =
                std::env::var("HOME").map_err(|_| PathError::EnvVarNotFound("HOME".to_string()))?;
            PathBuf::from(home)
                .join("Library")
                .join("Application Support")
        }
        _ => {
            let home =
                std::env::var("HOME").map_err(|_| PathError::EnvVarNotFound("HOME".to_string()))?;
            PathBuf::from(home).join(".config")
        }
    };

    Ok(base_dir.join(APP_IDENTIFIER))
}

/// Get the data directory for databases
/// Returns: com.devtool.zap/data/
pub fn get_data_directory() -> Result<PathBuf, PathError> {
    Ok(get_app_base_directory()?.join(DATA_DIR))
}

/// Get the sessions directory for CLI session files  
/// Returns: com.devtool.zap/sessions/
pub fn get_sessions_directory() -> Result<PathBuf, PathError> {
    Ok(get_app_base_directory()?.join(SESSIONS_DIR))
}

// ================================
// DATABASE SPECIFIC PATHS
// ================================

/// Get vault database path
pub fn get_vault_db_path() -> Result<PathBuf, PathError> {
    Ok(get_data_directory()?.join("vault.db"))
}

/// Get sessions database path  
pub fn get_sessions_db_path() -> Result<PathBuf, PathError> {
    Ok(get_data_directory()?.join("sessions.db"))
}

/// Get logs database path
pub fn get_logs_db_path() -> Result<PathBuf, PathError> {
    Ok(get_data_directory()?.join("logs.db"))
}

// ================================
// DIRECTORY MANAGEMENT
// ================================

/// Ensure all necessary directories exist
pub fn ensure_directories_exist() -> Result<(), PathError> {
    let dirs = [
        get_app_base_directory()?,
        get_data_directory()?,
        get_sessions_directory()?,
    ];

    for dir in &dirs {
        if !dir.exists() {
            std::fs::create_dir_all(dir)?;
            println!("📁 Created directory: {}", dir.display());
        }
    }

    Ok(())
}

/// Get app data directory (legacy function for compatibility)
/// This replaces the old get_app_data_dir function in lib.rs
pub fn get_app_data_dir_legacy() -> Result<PathBuf, PathError> {
    let app_dir = get_app_base_directory()?;
    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir)?;
    }
    Ok(app_dir)
}

// ================================
// UTILITY FUNCTIONS
// ================================

/// Get all important paths for debugging
pub fn get_all_paths() -> Result<Vec<(String, PathBuf)>, PathError> {
    Ok(vec![
        ("Base Directory".to_string(), get_app_base_directory()?),
        ("Data Directory".to_string(), get_data_directory()?),
        ("Sessions Directory".to_string(), get_sessions_directory()?),
        ("Vault DB".to_string(), get_vault_db_path()?),
        ("Sessions DB".to_string(), get_sessions_db_path()?),
        ("Logs DB".to_string(), get_logs_db_path()?),
    ])
}

/// Print all paths for debugging
pub fn debug_print_paths() {
    println!("🔧 Zap Path Configuration:");
    match get_all_paths() {
        Ok(paths) => {
            for (name, path) in paths {
                let exists = if path.exists() { "✅" } else { "❌" };
                println!("   {} {}: {}", exists, name, path.display());
            }
        }
        Err(e) => {
            println!("Error getting paths: {}", e);
        }
    }
}
