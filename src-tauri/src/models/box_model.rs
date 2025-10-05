// src/models/box_model.rs

use crate::models::ZapError;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

static TAG_REGEX: OnceLock<Regex> = OnceLock::new();

fn get_tag_regex() -> &'static Regex {
    TAG_REGEX.get_or_init(|| Regex::new(r"^[a-z0-9\-]{1,15}$").unwrap())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Box {
    pub id: String,
    pub name: String,                // 50 chars max
    pub description: Option<String>, // 75 chars max
    pub tags: Vec<String>,
    pub dev_mode: bool,
    pub secrets_count: usize,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: chrono::DateTime<chrono::Utc>,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl Box {
    pub fn new(
        name: String,
        description: Option<String>,
        tags: Vec<String>,
        dev_mode: bool,
    ) -> Result<Self, ZapError> {
        Self::validate_name(&name)?;
        if let Some(ref desc) = description {
            Self::validate_description(desc)?;
        }
        Self::validate_tags(&tags)?;

        let now = chrono::Utc::now();
        Ok(Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            description,
            tags,
            dev_mode,
            secrets_count: 0,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_fields(
        &mut self,
        name: Option<String>,
        description: Option<Option<String>>,
        tags: Option<Vec<String>>,
        dev_mode: Option<bool>,
    ) -> Result<(), ZapError> {
        let mut updated = false;

        if let Some(new_name) = name {
            Self::validate_name(&new_name)?;
            self.name = new_name;
            updated = true;
        }

        if let Some(new_description) = description {
            if let Some(ref desc) = new_description {
                Self::validate_description(desc)?;
            }
            self.description = new_description;
            updated = true;
        }

        if let Some(new_tags) = tags {
            Self::validate_tags(&new_tags)?;
            self.tags = new_tags;
            updated = true;
        }

        if let Some(new_dev_mode) = dev_mode {
            self.dev_mode = new_dev_mode;
            updated = true;
        }

        if updated {
            self.updated_at = chrono::Utc::now();
        }

        Ok(())
    }

    pub fn can_be_dev_session(&self) -> bool {
        self.dev_mode && !self.is_empty()
    }

    // Keep existing validation methods unchanged
    pub fn validate_name(name: &str) -> Result<(), ZapError> {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            return Err(ZapError::ValidationError(
                "Box name cannot be empty".to_string(),
            ));
        }
        if trimmed.len() > 50 {
            return Err(ZapError::ValidationError(
                "Box name cannot exceed 50 characters".to_string(),
            ));
        }
        Ok(())
    }

    pub fn validate_description(description: &str) -> Result<(), ZapError> {
        if description.len() > 75 {
            return Err(ZapError::ValidationError(
                "Box description cannot exceed 75 characters".to_string(),
            ));
        }
        Ok(())
    }

    pub fn validate_tags(tags: &[String]) -> Result<(), ZapError> {
        if tags.len() > 5 {
            return Err(ZapError::InvalidTags(
                "Maximum 5 tags allowed per box".to_string(),
            ));
        }

        for tag in tags {
            if !get_tag_regex().is_match(tag) {
                return Err(ZapError::InvalidTags(
                    "Tags must be 1-15 characters, lowercase letters, numbers, and hyphens only"
                        .to_string(),
                ));
            }
        }

        let mut unique_tags = std::collections::HashSet::new();
        for tag in tags {
            if !unique_tags.insert(tag) {
                return Err(ZapError::InvalidTags(format!("Duplicate tag: '{}'", tag)));
            }
        }
        Ok(())
    }

    pub fn can_add_secret(&self) -> Result<(), ZapError> {
        if self.secrets_count >= 75 {
            return Err(ZapError::ValidationError(
                "Box has reached maximum capacity (75 secrets)".to_string(),
            ));
        }
        Ok(())
    }

    pub fn is_empty(&self) -> bool {
        self.secrets_count == 0
    }

    pub fn update_secrets_count(&mut self, count: usize) {
        self.secrets_count = count;
        self.updated_at = chrono::Utc::now();
    }
}
