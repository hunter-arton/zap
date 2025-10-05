// src/services/auth_service.rs

use crate::models::{AuthConfig, SessionState, ZapError}; // Use unified error
use crate::services::CryptoService;
use std::sync::Mutex;

pub struct AuthService {
    session: Mutex<SessionState>,
    config: Mutex<Option<AuthConfig>>,
    crypto: CryptoService,
}

impl AuthService {
    pub fn new() -> Self {
        Self {
            session: Mutex::new(SessionState::new()),
            config: Mutex::new(None),
            crypto: CryptoService::new(),
        }
    }

    // Initialize auth system with config
    pub fn initialize(&self, config: Option<AuthConfig>) -> Result<bool, ZapError> {
        let mut config_guard = self.config.lock().unwrap();

        match config {
            Some(config) => {
                let is_first_time = config.is_first_time_setup();
                *config_guard = Some(config);
                Ok(is_first_time)
            }
            None => {
                // First time setup - generate new salt
                let salt = self.crypto.generate_salt(); // Use crypto service method
                let new_config = AuthConfig::new(salt);
                *config_guard = Some(new_config);
                Ok(true)
            }
        }
    }

    // Unlock with password - handles both first-time setup and login
    pub fn unlock(&self, password: &str) -> Result<bool, ZapError> {
        if password.trim().is_empty() {
            return Err(ZapError::AuthError("Password cannot be empty".to_string()));
        }

        let mut config_guard = self.config.lock().unwrap();
        let config = config_guard
            .as_mut()
            .ok_or(ZapError::AuthError("Auth not initialized".to_string()))?;

        let timeout_minutes = config.session_timeout_minutes as u32;

        // DEBUG: Log the timeout being used
        println!(
            "Unlocking with timeout: {} minutes ({} seconds)",
            timeout_minutes,
            timeout_minutes * 60
        );

        if config.is_first_time_setup() {
            // First-time setup
            if password.len() < 8 {
                return Err(ZapError::AuthError(
                    "Password must be at least 8 characters".to_string(),
                ));
            }

            let password_hash = self.crypto.hash_password(password)?;
            config.master_password_hash = Some(password_hash);

            let master_key = self.crypto.derive_key(password, &config.salt)?;

            let mut session = self.session.lock().unwrap();
            session.unlock(master_key, timeout_minutes);

            Ok(true) // First-time setup completed
        } else {
            // Existing user login
            let stored_hash = config.master_password_hash.as_ref().unwrap();

            if !self.crypto.verify_password(password, stored_hash)? {
                return Err(ZapError::IncorrectPassword);
            }

            let master_key = self.crypto.derive_key(password, &config.salt)?;

            let mut session = self.session.lock().unwrap();
            session.unlock(master_key, timeout_minutes);

            Ok(false) // Regular login
        }
    }

    // Lock the session
    pub fn lock(&self) {
        let mut session = self.session.lock().unwrap();
        session.lock();
    }

    // Check if unlocked
    pub fn is_unlocked(&self) -> bool {
        let session = self.session.lock().unwrap();
        session.is_unlocked
    }

    // Get session time left
    pub fn get_session_time_left(&self) -> u32 {
        let session = self.session.lock().unwrap();
        session.time_left_seconds
    }

    // Tick session timer (called every second)
    pub fn tick_session(&self) {
        let mut session = self.session.lock().unwrap();
        session.tick();
    }

    // Get master key for encryption operations
    pub fn get_master_key(&self) -> Option<[u8; 32]> {
        let session = self.session.lock().unwrap();
        session.master_key
    }

    // Get current auth config
    pub fn get_config(&self) -> Option<AuthConfig> {
        let config_guard = self.config.lock().unwrap();
        config_guard.clone()
    }

    // Update session timeout
    pub fn set_timeout_minutes(&self, minutes: u8) -> Result<(), ZapError> {
        if !(5..=60).contains(&minutes) {
            return Err(ZapError::AuthError(
                "Timeout must be between 5 and 60 minutes".to_string(),
            ));
        }

        let mut config_guard = self.config.lock().unwrap();
        if let Some(config) = config_guard.as_mut() {
            config.session_timeout_minutes = minutes;

            // Update current session if active
            let mut session = self.session.lock().unwrap();
            if session.is_unlocked {
                session.reset_timer(minutes as u32);
            }
        }

        Ok(())
    }
}

impl Default for AuthService {
    fn default() -> Self {
        Self::new()
    }
}
