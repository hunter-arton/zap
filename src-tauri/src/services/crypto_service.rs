// src/services/crypto_service.rs
use crate::models::{EncryptedData, ZapError};
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

pub struct CryptoService;

impl CryptoService {
    pub fn new() -> Self {
        Self
    }

    // Encrypt a string with AES-256-GCM
    pub fn encrypt(&self, text: &str, key: &[u8; 32]) -> Result<EncryptedData, ZapError> {
        let cipher_key = Key::<Aes256Gcm>::from_slice(key);
        let cipher = Aes256Gcm::new(cipher_key);
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

        let ciphertext = cipher
            .encrypt(&nonce, text.as_bytes())
            .map_err(|e| ZapError::CryptoError(format!("Encryption failed: {}", e)))?;

        // AES-GCM appends the 16-byte tag to the ciphertext
        if ciphertext.len() < 16 {
            return Err(ZapError::CryptoError(
                "Invalid ciphertext length".to_string(),
            ));
        }

        let (cipher_bytes, tag_bytes) = ciphertext.split_at(ciphertext.len() - 16);

        Ok(EncryptedData::new(
            cipher_bytes.to_vec(),
            nonce.to_vec(),
            tag_bytes.to_vec(),
        ))
    }

    // Decrypt back to string
    pub fn decrypt(&self, data: &EncryptedData, key: &[u8; 32]) -> Result<String, ZapError> {
        if !data.is_valid() {
            return Err(ZapError::CryptoError("Invalid encrypted data".to_string()));
        }

        let cipher_key = Key::<Aes256Gcm>::from_slice(key);
        let cipher = Aes256Gcm::new(cipher_key);
        let nonce = Nonce::from_slice(&data.nonce);

        // Reconstruct ciphertext with appended tag
        let mut full_ciphertext = data.cipher.clone();
        full_ciphertext.extend_from_slice(&data.tag);

        let decrypted_bytes = cipher
            .decrypt(nonce, full_ciphertext.as_ref())
            .map_err(|e| ZapError::CryptoError(format!("Decryption failed: {}", e)))?;

        String::from_utf8(decrypted_bytes)
            .map_err(|e| ZapError::CryptoError(format!("Invalid UTF-8: {}", e)))
    }

    // Encrypt multiple values at once - useful for dev sessions
    pub fn encrypt_batch(
        &self,
        items: &[(String, String)], // (name, value) pairs
        key: &[u8; 32],
    ) -> Result<Vec<EncryptedData>, ZapError> {
        let mut results = Vec::with_capacity(items.len());

        for (_, value) in items {
            let encrypted = self.encrypt(value, key)?;
            results.push(encrypted);
        }

        Ok(results)
    }

    // Decrypt multiple values at once
    pub fn decrypt_batch(
        &self,
        data_list: &[EncryptedData],
        key: &[u8; 32],
    ) -> Result<Vec<String>, ZapError> {
        let mut results = Vec::with_capacity(data_list.len());

        for encrypted_data in data_list {
            let decrypted = self.decrypt(encrypted_data, key)?;
            results.push(decrypted);
        }

        Ok(results)
    }

    // Hash password with Argon2 for secure storage
    pub fn hash_password(&self, password: &str) -> Result<String, ZapError> {
        let salt = SaltString::generate(&mut OsRng);
        let hasher = Argon2::default();

        let hash = hasher
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| ZapError::CryptoError(format!("Password hashing failed: {}", e)))?;

        Ok(hash.to_string())
    }

    // Check if password matches stored hash
    pub fn verify_password(&self, password: &str, stored_hash: &str) -> Result<bool, ZapError> {
        let parsed_hash = PasswordHash::new(stored_hash)
            .map_err(|e| ZapError::CryptoError(format!("Invalid hash format: {}", e)))?;

        let verifier = Argon2::default();

        match verifier.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(()) => Ok(true),
            Err(_) => Ok(false), // Wrong password, not an error
        }
    }

    // Derive 32-byte encryption key from master password using Argon2
    pub fn derive_key(&self, password: &str, salt: &[u8]) -> Result<[u8; 32], ZapError> {
        if salt.len() < 16 {
            return Err(ZapError::CryptoError(
                "Salt must be at least 16 bytes".to_string(),
            ));
        }

        let key_derivation = Argon2::default();
        let mut derived_key = [0u8; 32];

        key_derivation
            .hash_password_into(password.as_bytes(), salt, &mut derived_key)
            .map_err(|e| ZapError::CryptoError(format!("Key derivation failed: {}", e)))?;

        Ok(derived_key)
    }

    // Generate random salt for new users
    pub fn generate_salt(&self) -> [u8; 32] {
        use rand::RngCore;
        let mut salt = [0u8; 32];
        rand::rng().fill_bytes(&mut salt);
        salt
    }
}

impl Default for CryptoService {
    fn default() -> Self {
        Self::new()
    }
}
