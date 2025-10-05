// src/models/auth_model.rs

use crate::models::ZapError;
use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone)]
pub struct SessionState {
    pub is_unlocked: bool,
    pub time_left_seconds: u32,
    pub master_key: Option<[u8; 32]>,
    pub last_activity: Option<Instant>,
}

impl SessionState {
    pub fn new() -> Self {
        Self {
            is_unlocked: false,
            time_left_seconds: 0,
            master_key: None,
            last_activity: None,
        }
    }

    pub fn unlock(&mut self, master_key: [u8; 32], timeout_minutes: u32) {
        self.is_unlocked = true;
        self.master_key = Some(master_key);
        self.time_left_seconds = timeout_minutes * 60;
        self.last_activity = Some(Instant::now());
    }

    pub fn lock(&mut self) {
        self.is_unlocked = false;
        self.time_left_seconds = 0;
        self.master_key = None;
        self.last_activity = None;
    }

    pub fn tick(&mut self) {
        if self.is_unlocked && self.time_left_seconds > 0 {
            self.time_left_seconds -= 1;
            if self.time_left_seconds == 0 {
                self.lock();
            }
        }
    }

    pub fn reset_timer(&mut self, timeout_minutes: u32) {
        if self.is_unlocked {
            self.time_left_seconds = timeout_minutes * 60;
            self.last_activity = Some(Instant::now());
        }
    }
}

impl Default for SessionState {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub session_timeout_minutes: u8,
    pub master_password_hash: Option<String>,
    pub salt: [u8; 32],
}

impl AuthConfig {
    pub fn new(salt: [u8; 32]) -> Self {
        Self {
            session_timeout_minutes: 5,
            master_password_hash: None,
            salt,
        }
    }

    pub fn is_first_time_setup(&self) -> bool {
        self.master_password_hash.is_none()
    }

    pub fn set_timeout_minutes(&mut self, minutes: u8) -> Result<(), ZapError> {
        if !(5..=60).contains(&minutes) {
            return Err(ZapError::AuthError(
                "Session timeout must be between 5 and 60 minutes".to_string(),
            ));
        }
        self.session_timeout_minutes = minutes;
        Ok(())
    }
}

#[derive(Debug, Serialize)]
pub struct SessionInfo {
    pub is_locked: bool,
    pub time_left_seconds: u32,
}
