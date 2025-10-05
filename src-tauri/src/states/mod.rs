// src/states/mod.rs
//! Application state management

pub mod app_state;
pub mod dev_state;

// Re-export the main states
pub use app_state::AppState;
pub use dev_state::{DevBoxInfo, DevState};
