// src/window_manager.rs - CLEAN AUTOMATIC APPROACH

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, Runtime};

#[derive(Debug, Serialize, Deserialize)]
pub struct WindowState {
    pub is_visible: bool,
    pub current_position: (i32, i32),
    pub window_size: (u32, u32),
}

#[derive(Debug, Clone)]
pub struct ScreenInfo {
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
}

pub struct WindowManager;

impl WindowManager {
    /// Get screen information with DPI awareness
    pub fn get_screen_info<R: Runtime>(app: &AppHandle<R>) -> ScreenInfo {
        let window = app.get_webview_window("main");

        if let Some(window) = window {
            if let Ok(Some(monitor)) = window.current_monitor() {
                let size = monitor.size();
                return ScreenInfo {
                    width: size.width,
                    height: size.height,
                    scale_factor: monitor.scale_factor(),
                };
            }
        }

        // Fallback
        ScreenInfo {
            width: 1920,
            height: 1080,
            scale_factor: 1.0,
        }
    }

    /// Calculate sidebar dimensions (30% width, 90% height)
    pub fn calculate_sidebar_layout(screen: &ScreenInfo) -> (u32, u32, i32, i32) {
        // 30% of screen width, 90% of screen height
        let window_width = (screen.width as f64 * 0.25) as u32;
        let window_height = (screen.height as f64 * 0.90) as u32;

        // Position on the right side with small margin
        let margin = (10.0 * screen.scale_factor) as u32;
        let x = (screen.width - window_width - margin) as i32;
        let y = ((screen.height - window_height) / 2) as i32; // Vertically centered

        println!(
            "Sidebar layout: {}x{} at ({}, {}) for screen {}x{}",
            window_width, window_height, x, y, screen.width, screen.height
        );

        (window_width, window_height, x, y)
    }

    /// Set window to initial sidebar mode (30% width, 90% height, right-aligned)
    pub fn initialize_sidebar_window<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
        let window = app
            .get_webview_window("main")
            .ok_or("Main window not found")?;

        let screen = Self::get_screen_info(app);
        let (width, height, x, y) = Self::calculate_sidebar_layout(&screen);

        // Apply size and position
        window
            .set_size(PhysicalSize::new(width, height))
            .and_then(|_| window.set_position(PhysicalPosition::new(x, y)))
            .and_then(|_| window.set_always_on_top(false))
            .and_then(|_| window.set_skip_taskbar(false))
            .map_err(|e| format!("Failed to initialize window: {}", e))?;

        // Show and focus
        window.show().ok();
        window.set_focus().ok();

        println!(
            "Window initialized in sidebar mode: {}x{} at ({}, {})",
            width, height, x, y
        );
        Ok(())
    }

    /// Toggle visibility only (for global shortcut)
    pub fn toggle_visibility<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
        let window = app
            .get_webview_window("main")
            .ok_or("Main window not found")?;

        let is_visible = window.is_visible().unwrap_or(false);

        if is_visible {
            window
                .hide()
                .map_err(|e| format!("Failed to hide: {}", e))?;
        } else {
            // Just show, don't reposition - let OS handle window state
            window
                .show()
                .and_then(|_| window.set_focus())
                .map_err(|e| format!("Failed to show: {}", e))?;
        }

        Ok(())
    }

    /// Get basic window state
    pub fn get_window_state<R: Runtime>(app: &AppHandle<R>) -> Result<WindowState, String> {
        let window = app
            .get_webview_window("main")
            .ok_or("Main window not found")?;

        let is_visible = window.is_visible().unwrap_or(false);
        let position = window
            .outer_position()
            .unwrap_or(PhysicalPosition::new(0, 0));
        let size = window.outer_size().unwrap_or(PhysicalSize::new(800, 600));

        Ok(WindowState {
            is_visible,
            current_position: (position.x, position.y),
            window_size: (size.width, size.height),
        })
    }

    // Backward compatibility
    pub fn initialize_right_edge<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
        Self::initialize_sidebar_window(app)
    }
}

// Simple command handlers
pub fn handle_toggle_visibility<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    WindowManager::toggle_visibility(&app)
}

pub fn handle_get_window_state<R: Runtime>(app: AppHandle<R>) -> Result<WindowState, String> {
    WindowManager::get_window_state(&app)
}

pub fn handle_initialize_right_edge<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    WindowManager::initialize_sidebar_window(&app)
}
