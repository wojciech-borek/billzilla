/**
 * AudioFileValidator - Centralized audio file validation logic
 *
 * Provides validation for audio files used in transcription services.
 * Handles both File and Blob objects with consistent validation rules.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const SUPPORTED_FORMATS = [
  "audio/flac",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/m4a",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
] as const;

/**
 * Validates an audio file or blob
 * @param file - File or Blob to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validateAudioFile(file: File | Blob): ValidationResult {
  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size: 25MB`,
    };
  }

  // Check format (skip if no type provided)
  if (file.type && !isSupportedFormat(file.type)) {
    return {
      valid: false,
      error: `Unsupported audio format: ${file.type}. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Checks if the MIME type is supported
 * @param mimeType - MIME type to check
 * @returns true if supported, false otherwise
 */
function isSupportedFormat(mimeType: string): boolean {
  return SUPPORTED_FORMATS.some((format) => mimeType.startsWith(format) || mimeType.includes(format));
}

/**
 * Gets the maximum allowed file size in bytes
 */
export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}

/**
 * Gets the list of supported formats
 */
export function getSupportedFormats(): readonly string[] {
  return SUPPORTED_FORMATS;
}
