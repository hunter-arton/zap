// src/types/errorTypes.ts 

export type ZapErrorType =
    | 'StorageError'
    | 'DatabaseError'
    | 'IoError'
    | 'ValidationError'
    | 'InvalidTags'
    | 'BoxNotFound'
    | 'BoxAlreadyExists'
    | 'BoxCapacityExceeded'
    | 'InvalidDevBox'
    | 'SecretNotFound'
    | 'SecretAlreadyExistsInBox'
    | 'AuthError'
    | 'IncorrectPassword'
    | 'SessionExpired'
    | 'CryptoError'
    | 'NoActiveSession'
    | 'SessionAlreadyActive'
    | 'InvalidSessionKey'
    | 'SerializationError'
    | 'Utf8Error';

// Frontend error handling
export interface AppError {
    type: ZapErrorType;
    message: string;
    timestamp?: number;
}

export type AppResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: AppError;
};